import { GameSettings } from "../Game/Data/GameSettings";
import { UserData } from "../Game/Data/UserData";

export class PlayerProfilePresentation {
    public static build(settings: GameSettings, userData: UserData): string {
        const game = userData.game;
        const level = Math.max(1, Math.floor(game.level));
        const xp = Math.max(0, Math.floor(game.xp));
        const xpToNext = Math.max(0, Math.floor(game.xpToNext));
        const zoneName = this.resolveZoneName(settings, game.currentZoneId);
        const stageProgress = this.formatStageProgress(settings, userData);
        const currentBest = this.formatCurrentZoneBest(settings, userData);
        const lastRun = game.lastRunSummary.trim();
        const baseSummary = `Level: ${level} | XP: ${xp}/${xpToNext} | Zone: ${zoneName} | ${stageProgress} | ${currentBest}`;

        return lastRun ? `${baseSummary}\nLast run: ${lastRun}` : baseSummary;
    }

    private static formatStageProgress(settings: GameSettings, userData: UserData): string {
        const zoneIds = new Set((settings.zones ?? []).map((zone) => zone.zoneId).filter((zoneId) => !!zoneId));
        const clearedCount = new Set((userData.game.clearedZones ?? []).filter((zoneId) => zoneIds.has(zoneId))).size;

        return `Stages: ${clearedCount}/${zoneIds.size} cleared`;
    }

    private static formatCurrentZoneBest(settings: GameSettings, userData: UserData): string {
        const zone = settings.zones.find((candidate) => candidate.zoneId === userData.game.currentZoneId);
        const bestScore = Math.max(0, Math.floor(userData.game.zoneHighscores[userData.game.currentZoneId] ?? 0));
        const targetSeconds = Math.max(0, Math.floor(zone?.targetSurvivalSeconds ?? 0));
        if (targetSeconds <= 0) return `Current best: ${bestScore}s`;

        const progressPercent = Math.min(100, Math.max(0, Math.floor((bestScore / targetSeconds) * 100)));
        return `Current best: ${bestScore}/${targetSeconds}s (${progressPercent}%)`;
    }

    private static resolveZoneName(settings: GameSettings, zoneId: string): string {
        const zone = settings.zones.find((candidate) => candidate.zoneId === zoneId);
        return zone?.name?.trim() ? zone.name : zoneId;
    }
}
