import { GameSettings } from "./GameSettings";
import { SkillBonusResolver } from "./SkillBonuses";
import { UserData } from "./UserData";

export class OfflineProgressState {
    public static normalize(settings: GameSettings, userData: UserData): void {
        const now = new Date();
        const parsedLastOnline = new Date(userData.game.lastOnline);

        const idleRateFromSkills = 1 + SkillBonusResolver.resolve(settings, userData).idleRate;
        userData.game.idleRate = Number.isFinite(idleRateFromSkills) && 0 < idleRateFromSkills ? idleRateFromSkills : 1;
        userData.game.offlineGold = Math.max(0, Math.floor(userData.game.offlineGold || 0));

        if (Number.isNaN(parsedLastOnline.getTime())) {
            userData.game.lastOnline = now.toISOString();
            return;
        }

        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - parsedLastOnline.getTime()) / 1000));
        userData.game.offlineGold += Math.floor(elapsedSeconds * userData.game.idleRate);
        userData.game.lastOnline = now.toISOString();
    }

    public static collect(userData: UserData): number {
        const collected = Math.max(0, Math.floor(userData.game.offlineGold || 0));
        if (collected <= 0) return 0;

        userData.game.goldCoins += collected;
        userData.game.gold = userData.game.goldCoins;
        userData.game.offlineGold = 0;
        return collected;
    }
}
