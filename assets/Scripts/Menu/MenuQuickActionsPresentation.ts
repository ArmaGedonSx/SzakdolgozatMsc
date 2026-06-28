import { GameSettings } from "../Game/Data/GameSettings";
import { UserData } from "../Game/Data/UserData";

export interface MenuQuickActionsPresentationData {
    stageButtonLabel: string;
    inventoryButtonLabel: string;
}

export class MenuQuickActionsPresentation {
    public static build(settings: GameSettings, userData: UserData): MenuQuickActionsPresentationData {
        return {
            stageButtonLabel: "Stages",
            inventoryButtonLabel: "Inventory"
        };
    }
}
