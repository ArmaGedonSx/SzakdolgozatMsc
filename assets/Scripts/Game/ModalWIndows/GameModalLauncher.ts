import { ModalWindowManager } from "../../Services/ModalWindowSystem/ModalWindowManager";
import { Game } from "../Game";
import { Pauser } from "../Pauser";
import { LevelUpModalWindowParams } from "../UI/LevelUpWindow/LevelUpModalWindow";
import { Player } from "../Unit/Player/Player";
import { Upgrader } from "../Upgrades/Upgrader";
import { UpgradeType } from "../Upgrades/UpgradeType";
import { GameModalWindowTypes } from "./GameModalWindowTypes";

export class GameModalLauncher {
    public constructor(
        private modalWindowManager: ModalWindowManager,
        private player: Player,
        private gamePauser: Pauser,
        private upgrader: Upgrader
    ) {
        this.player.Level.LevelUpEvent.on(this.showLevelUpModal, this);
    }

    private async showLevelUpModal(): Promise<void> {
        this.gamePauser.pause();
        const upgradeChoices = this.upgrader.getUpgradeChoices();
        if (upgradeChoices.length === 0) {
            this.gamePauser.resume();
            return;
        }

        const skillToUpgrade: UpgradeType = await this.modalWindowManager.showModal<LevelUpModalWindowParams, UpgradeType>(
            GameModalWindowTypes.LevelUp,
            { availableUpgrades: upgradeChoices }
        );
        if (!skillToUpgrade) {
            this.gamePauser.resume();
            return;
        }

        this.upgrader.upgradeSkill(skillToUpgrade);
        this.gamePauser.resume();
    }

    public async showChestModal(): Promise<void> {
        this.gamePauser.pause();
        const upgradeChoices = this.upgrader.getUpgradeChoices();
        if (upgradeChoices.length === 0) {
            this.gamePauser.resume();
            return;
        }

        const skillToUpgrade: UpgradeType = await this.modalWindowManager.showModal<LevelUpModalWindowParams, UpgradeType>(
            GameModalWindowTypes.Chest,
            { availableUpgrades: upgradeChoices }
        );
        if (!skillToUpgrade) {
            this.gamePauser.resume();
            return;
        }

        this.upgrader.upgradeSkill(skillToUpgrade);
        this.gamePauser.resume();
    }

    public async showPauseModal(): Promise<void> {
        this.gamePauser.pause();
        const shouldExit = await this.modalWindowManager.showModal<ModalWindowManager, boolean>(GameModalWindowTypes.Pause, this.modalWindowManager);

        if (shouldExit) {
            if (Game.Instance?.tryExitGame()) {
                return;
            }

            console.warn("[GameModalLauncher] Pause modal requested exit, but no active game run exists.");
            this.gamePauser.resume();
        } else {
            this.gamePauser.resume();
        }
    }
}
