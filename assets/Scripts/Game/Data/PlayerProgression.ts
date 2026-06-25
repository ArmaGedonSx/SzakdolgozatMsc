import { GameSettings } from "./GameSettings";
import { UserData } from "./UserData";
import { UnitLevel } from "../Unit/UnitLevel";

export class PlayerProgression {
    public static normalize(settings: GameSettings, userData: UserData): void {
        const requiredXP = settings.player.requiredXP ?? [];
        const maxLevel = Math.max(1, requiredXP.length + 1);

        userData.game.level = Math.min(maxLevel, Math.max(1, Math.floor(userData.game.level || 1)));
        userData.game.xp = Math.max(0, userData.game.xp || 0);

        while (userData.game.level < maxLevel) {
            const requiredForCurrentLevel = requiredXP[userData.game.level - 1];
            if (requiredForCurrentLevel == null || userData.game.xp < requiredForCurrentLevel) break;

            userData.game.xp -= requiredForCurrentLevel;
            userData.game.level++;
        }

        userData.game.xpToNext = requiredXP[userData.game.level - 1] ?? 0;
    }

    public static createRuntimeLevel(settings: GameSettings, userData: UserData, xpMultiplier: number): UnitLevel {
        return new UnitLevel(settings.player.requiredXP, xpMultiplier, userData.game.level - 1, userData.game.xp);
    }

    public static syncFromRuntime(userData: UserData, runtimeLevel: UnitLevel): void {
        userData.game.level = runtimeLevel.CurrentLevel;
        userData.game.xp = runtimeLevel.XP;
        userData.game.xpToNext = runtimeLevel.RequiredXP;
    }
}
