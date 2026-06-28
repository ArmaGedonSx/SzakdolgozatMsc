export interface RunEventMilestones {
    hordeMilestones?: number[];
    bossMilestones?: number[];
    targetSurvivalSeconds?: number;
}

export class GameHudPresentation {
    public static formatRunStatus(timeAlive: number, _level: number, _kills: number, _events: number[] | RunEventMilestones = []): string {
        const safeTime = Number.isFinite(timeAlive) ? Math.max(0, Math.floor(timeAlive)) : 0;

        return `${safeTime}`;
    }
}
