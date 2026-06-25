import { random, _decorator } from "cc";
import { ModalWindow } from "../../Services/ModalWindowSystem/ModalWindow";
import { UIButton } from "../../Services/UI/Button/UIButton";
import { ChestRewardChoice } from "../Data/ChestRewardChoice";
import { LevelUpModalWindowParams } from "../UI/LevelUpWindow/LevelUpModalWindow";
import { LevelUpSkill } from "../UI/LevelUpWindow/LevelUpSkill";
import { UpgradeType } from "../Upgrades/UpgradeType";
const { ccclass, property } = _decorator;

@ccclass("ChestModalWindow")
export class ChestModalWindow extends ModalWindow<LevelUpModalWindowParams, UpgradeType> {
    @property(LevelUpSkill) private levelUpSkill: LevelUpSkill;
    @property(UIButton) private okButton: UIButton;

    protected setup(params: LevelUpModalWindowParams): void {
        const skillToUpgrade = ChestRewardChoice.chooseRandomUpgrade(params.availableUpgrades, random);
        if (!skillToUpgrade) {
            this.dismiss(null);
            return;
        }

        this.levelUpSkill.init(skillToUpgrade);

        this.okButton.InteractedEvent.on(() => this.dismiss(skillToUpgrade.upgradeType), this);
    }
}
