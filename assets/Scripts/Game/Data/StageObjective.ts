import { GameSettings } from "./GameSettings";

export class StageObjective {
    public static resolveTargetSeconds(settings: GameSettings, zoneId: string): number {
        const zone = settings.zones.find((candidate) => candidate.zoneId === zoneId);
        if (!zone || !Number.isFinite(zone.targetSurvivalSeconds)) return 0;

        return Math.max(0, Math.floor(zone.targetSurvivalSeconds));
    }

    public static isCleared(settings: GameSettings, zoneId: string, timeAlive: number): boolean {
        const targetSeconds = this.resolveTargetSeconds(settings, zoneId);
        if (targetSeconds <= 0 || !Number.isFinite(timeAlive)) return false;

        return targetSeconds <= timeAlive;
    }
}
