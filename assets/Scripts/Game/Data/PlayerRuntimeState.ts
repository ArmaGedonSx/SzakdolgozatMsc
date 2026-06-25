import { GameSettings } from "./GameSettings";
import { UserData } from "./UserData";
import { Player } from "../Unit/Player/Player";

export class PlayerRuntimeState {
    public static normalize(settings: GameSettings, userData: UserData): void {
        const fallbackMaxHp = Math.max(1, settings.player.defaultHP || 1);

        userData.game.goldCoins = Math.max(0, userData.game.goldCoins || userData.game.gold || 0);
        userData.game.gold = userData.game.goldCoins;

        userData.game.maxHp = Math.max(1, userData.game.maxHp || fallbackMaxHp);
        userData.game.hp = Math.max(0, Math.min(userData.game.maxHp, userData.game.hp || userData.game.maxHp));
        userData.game.posX = Number.isFinite(userData.game.posX) ? userData.game.posX : 0;
        userData.game.posY = Number.isFinite(userData.game.posY) ? userData.game.posY : 0;
    }

    public static syncFromRuntime(userData: UserData, player: Player): void {
        userData.game.hp = player.Health.HealthPoints;
        userData.game.maxHp = player.Health.MaxHealthPoints;
        userData.game.posX = player.node.worldPosition.x;
        userData.game.posY = player.node.worldPosition.y;
        userData.game.gold = userData.game.goldCoins;
    }

    public static applySavedPosition(userData: UserData, player: Player): void {
        player.node.setWorldPosition(userData.game.posX, userData.game.posY, 0);
    }
}
