import { UserData } from "./UserData";

export class ZoneHighscores {
    public static applyRunScore(userData: UserData, zoneId: string, score: number): void {
        if (!zoneId || score <= 0) return;

        const currentBest = userData.game.zoneHighscores[zoneId] ?? 0;
        if (currentBest < score) {
            userData.game.zoneHighscores[zoneId] = score;
        }
    }
}
