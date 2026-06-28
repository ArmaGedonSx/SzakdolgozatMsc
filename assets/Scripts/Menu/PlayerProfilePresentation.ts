import { GameSettings } from "../Game/Data/GameSettings";
import { UserData } from "../Game/Data/UserData";

export class PlayerProfilePresentation {
    public static build(settings: GameSettings, userData: UserData): string {
        return this.buildStatusLine(settings, userData);
    }

    public static buildZoneTitle(settings: GameSettings, userData: UserData): string {
        return this.resolveZoneName(settings, userData.game.currentZoneId).toUpperCase();
    }

    public static buildStatusLine(settings: GameSettings, userData: UserData): string {
        const game = userData.game;
        const level = Math.max(1, Math.floor(game.level));
        const xp = Math.max(0, Math.floor(game.xp));
        const xpToNext = Math.max(0, Math.floor(game.xpToNext));
        const stageProgress = this.formatStageProgress(settings, userData);
        const currentBest = this.formatCurrentZoneBest(settings, userData);
        return `LV ${level}  |  XP ${xp}/${xpToNext}  |  ${stageProgress}  |  ${currentBest}`;
    }

    private static formatStageProgress(settings: GameSettings, userData: UserData): string {
        const zoneIds = new Set((settings.zones ?? []).map((zone) => zone.zoneId).filter((zoneId) => !!zoneId));
        const clearedCount = new Set((userData.game.clearedZones ?? []).filter((zoneId) => zoneIds.has(zoneId))).size;

        return `${clearedCount}/${zoneIds.size} STAGES`;
    }

    private static formatCurrentZoneBest(settings: GameSettings, userData: UserData): string {
        const zone = settings.zones.find((candidate) => candidate.zoneId === userData.game.currentZoneId);
        const bestScore = Math.max(0, Math.floor(userData.game.zoneHighscores[userData.game.currentZoneId] ?? 0));
        const targetSeconds = Math.max(0, Math.floor(zone?.targetSurvivalSeconds ?? 0));
        if (targetSeconds <= 0) return `BEST ${bestScore}s`;

        const progressPercent = Math.min(100, Math.max(0, Math.floor((bestScore / targetSeconds) * 100)));
        return `BEST ${bestScore}/${targetSeconds}s (${progressPercent}%)`;
    }

    private static resolveZoneName(settings: GameSettings, zoneId: string): string {
        const zone = settings.zones.find((candidate) => candidate.zoneId === zoneId);
        return zone?.name?.trim() ? zone.name : zoneId;
    }
}
