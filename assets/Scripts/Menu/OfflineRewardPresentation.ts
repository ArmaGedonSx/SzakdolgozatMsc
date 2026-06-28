import { UserData } from "../Game/Data/UserData";

export interface OfflineRewardPresentationData {
    isVisible: boolean;
    buttonLabel: string;
    summary: string;
}

export class OfflineRewardPresentation {
    public static build(userData: UserData): OfflineRewardPresentationData {
        const pendingGold = Math.max(0, Math.floor(userData.game.offlineGold || 0));
        const idleRate = Math.max(1, userData.game.idleRate || 1);
        if (pendingGold <= 0) {
            return {
                isVisible: false,
                buttonLabel: "Gold: None",
                summary: "No gold waiting"
            };
        }

        return {
            isVisible: true,
            buttonLabel: `Claim gold: ${pendingGold}`,
            summary: `Gold waiting: ${pendingGold} | Rate: ${this.formatRate(idleRate)}`
        };
    }

    private static formatRate(rate: number): string {
        return `${Math.round(rate * 10) / 10}x`;
    }
}
