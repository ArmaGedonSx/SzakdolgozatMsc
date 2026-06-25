export interface RunEventMilestones {
    hordeMilestones?: number[];
    bossMilestones?: number[];
    targetSurvivalSeconds?: number;
}

export class GameHudPresentation {
    public static formatRunStatus(timeAlive: number, level: number, kills: number, events: number[] | RunEventMilestones = []): string {
        const safeTime = Number.isFinite(timeAlive) ? Math.max(0, Math.floor(timeAlive)) : 0;
        const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
        const safeKills = Number.isFinite(kills) ? Math.max(0, Math.floor(kills)) : 0;
        const objectiveStatus = this.formatObjectiveStatus(safeTime, Array.isArray(events) ? 0 : events.targetSurvivalSeconds ?? 0);
        const bossWarning = this.formatEventWarning(timeAlive, this.normalizeEvents(events));

        return `${safeTime}s${objectiveStatus} | Lv. ${safeLevel} | Kills: ${safeKills}${bossWarning}`;
    }

    private static formatObjectiveStatus(safeTime: number, targetSurvivalSeconds: number): string {
        if (!Number.isFinite(targetSurvivalSeconds) || targetSurvivalSeconds <= 0) return "";

        const safeTarget = Math.floor(targetSurvivalSeconds);
        const secondsLeft = Math.max(0, safeTarget - safeTime);
        if (secondsLeft === 0) return " | Stage clear!";

        return ` | Goal: ${secondsLeft}s`;
    }

    private static normalizeEvents(events: number[] | RunEventMilestones): { label: string; milestone: number }[] {
        if (Array.isArray(events)) {
            return events.map((milestone) => ({ label: "Boss", milestone }));
        }

        return [
            ...(events.hordeMilestones ?? []).map((milestone) => ({ label: "Horde", milestone })),
            ...(events.bossMilestones ?? []).map((milestone) => ({ label: "Boss", milestone }))
        ];
    }

    private static formatEventWarning(timeAlive: number, events: { label: string; milestone: number }[]): string {
        if (!Number.isFinite(timeAlive)) return "";

        const upcomingEvent = events
            .filter((event) => Number.isFinite(event.milestone))
            .filter((event) => timeAlive <= event.milestone)
            .sort((left, right) => left.milestone - right.milestone)[0];
        if (!upcomingEvent) return "";

        const secondsLeft = Math.ceil(upcomingEvent.milestone - timeAlive);
        if (secondsLeft === 0) return ` | ${upcomingEvent.label} incoming!`;
        if (secondsLeft <= 10) return ` | ${upcomingEvent.label} in ${secondsLeft}s`;

        return "";
    }
}
