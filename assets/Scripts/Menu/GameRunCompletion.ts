import { GameSettings } from "../Game/Data/GameSettings";
import { ItemDropResolver } from "../Game/Data/ItemDrops";
import { MaterialDropResolver } from "../Game/Data/MaterialDrops";
import { UserData } from "../Game/Data/UserData";
import { ZoneHighscores } from "../Game/Data/ZoneHighscores";
import { ZoneResolver } from "../Game/Data/ZoneResolver";
import { RunResultLike, RunResultPresentation } from "./RunResultPresentation";

export class GameRunCompletion {
    public static apply(settings: GameSettings, userData: UserData, result: RunResultLike): void {
        const previouslyUnlockedZones = new Set(userData.game.unlockedZones);
        const previousGlobalBest = userData.game.highscore;
        const previousZoneBest = userData.game.zoneHighscores[result.zoneId] ?? 0;
        userData.game.lastRunSummary = RunResultPresentation.build(settings, result, previousZoneBest, previousGlobalBest).summary;

        userData.game.goldCoins += result.goldCoins;
        MaterialDropResolver.applyCollectedMaterials(userData, result.collectedMaterials);
        ItemDropResolver.applyCollectedItems(settings, userData, result.collectedItems);

        if (userData.game.highscore < result.score) {
            userData.game.highscore = result.score;
        }

        ZoneHighscores.applyRunScore(userData, result.zoneId, result.score);
        if (result.cleared) {
            const wasFirstClear = !this.isZoneCleared(userData, result.zoneId);
            this.markZoneCleared(userData, result.zoneId);
            this.applyFirstClearReward(settings, userData, result.zoneId, wasFirstClear);
            ZoneResolver.resolveCurrentZone(settings, userData);
            this.appendUnlockedZoneSummary(settings, userData, previouslyUnlockedZones);
        }
    }

    private static isZoneCleared(userData: UserData, zoneId: string): boolean {
        return Array.isArray(userData.game.clearedZones) && userData.game.clearedZones.includes(zoneId);
    }

    private static markZoneCleared(userData: UserData, zoneId: string): void {
        if (!zoneId) return;
        if (!Array.isArray(userData.game.clearedZones)) {
            userData.game.clearedZones = [];
        }
        if (!userData.game.clearedZones.includes(zoneId)) {
            userData.game.clearedZones.push(zoneId);
        }
    }

    private static applyFirstClearReward(settings: GameSettings, userData: UserData, zoneId: string, wasFirstClear: boolean): void {
        if (!wasFirstClear) return;

        const zone = settings.zones.find((candidate) => candidate.zoneId === zoneId);
        const rewardGold = Math.max(0, Math.floor(zone?.clearRewardGold ?? 0));
        if (rewardGold <= 0) return;

        userData.game.goldCoins += rewardGold;
        userData.game.lastRunSummary = `${userData.game.lastRunSummary} | First clear reward: ${rewardGold} gold`;
    }

    private static appendUnlockedZoneSummary(settings: GameSettings, userData: UserData, previouslyUnlockedZones: Set<string>): void {
        const newlyUnlockedZones = userData.game.unlockedZones.filter((zoneId) => !previouslyUnlockedZones.has(zoneId));
        if (newlyUnlockedZones.length === 0) return;

        const zoneNames = newlyUnlockedZones.map((zoneId) => this.resolveZoneName(settings, zoneId)).join(", ");
        userData.game.lastRunSummary = `${userData.game.lastRunSummary} | Unlocked: ${zoneNames}`;
    }

    private static resolveZoneName(settings: GameSettings, zoneId: string): string {
        const zone = settings.zones.find((candidate) => candidate.zoneId === zoneId);
        return zone?.name?.trim() ? zone.name : zoneId;
    }
}
