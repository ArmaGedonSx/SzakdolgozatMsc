export enum EventName {
    GAMES_PER_SESSION = "games_per_session",
    GAME_TIME = "game_time",
    GAME_EXIT = "game_exit",
    GOLD_PER_RUN = "gold_per_run"
}

export class Analytics {
    private totalTime = 0;
    private gamesPerSession = 0;

    public constructor() {}

    public update(deltaTime: number): void {
        this.totalTime += deltaTime;
    }

    public gameStart(): void {
        this.gamesPerSession++;
        console.log(`[Analytics] Game started. Session games: ${this.gamesPerSession}`);
    }

    public gameEnd(time: number): void {
        console.log(`[Analytics] Game ended. Score: ${Math.floor(time)}`);
    }

    public gameExit(time: number): void {
        console.log(`[Analytics] Game exited. Final time: ${Math.floor(time)}`);
    }

    public goldPerRun(goldEarned: number): void {
        console.log(`[Analytics] Gold earned this run: ${Math.floor(goldEarned)}`);
    }
}
