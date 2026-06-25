import { GameSettings } from "../Game/Data/GameSettings";
import { UserData } from "../Game/Data/UserData";

export interface MenuQuickActionsPresentationData {
    stageButtonLabel: string;
    inventoryButtonLabel: string;
}

export class MenuQuickActionsPresentation {
    public static build(settings: GameSettings, userData: UserData): MenuQuickActionsPresentationData {
        const currentZoneId = userData.game.currentZoneId;
        const currentZone = settings.zones.find((zone) => zone.zoneId === currentZoneId);
        const zoneName = currentZone?.name?.trim() ? currentZone.name : currentZoneId;
        const stackCount = userData.game.inventory.filter((item) => item.quantity > 0).length;
        const inventoryLabel = 0 < stackCount ? stackCount.toString() : "Empty";

        return {
            stageButtonLabel: `Stages: ${zoneName} ${this.formatStageProgress(settings, userData)}`,
            inventoryButtonLabel: `Inventory: ${inventoryLabel}`
        };
    }

    private static formatStageProgress(settings: GameSettings, userData: UserData): string {
        const zoneIds = new Set(settings.zones.map((zone) => zone.zoneId).filter((zoneId) => 0 < zoneId.length));
        const clearedZoneIds = new Set(
            userData.game.clearedZones.filter((zoneId) => zoneIds.has(zoneId))
        );

        return `${clearedZoneIds.size}/${zoneIds.size}`;
    }
}
