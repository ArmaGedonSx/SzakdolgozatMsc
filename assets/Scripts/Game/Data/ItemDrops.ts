import { EquippableItemSettings, GameSettings } from "./GameSettings";
import { InventoryState } from "./InventoryState";
import { UserData } from "./UserData";

export class ItemDropResolver {
    public static tryResolveDrop(settings: GameSettings, zoneId: string): string | null {
        const availableItems = settings.equippableItems.filter((item) => this.isAvailableInZone(item, zoneId) && 0 < item.dropWeight);
        if (availableItems.length === 0) return null;

        const totalWeight = availableItems.reduce((sum, item) => sum + item.dropWeight, 0);
        let roll = Math.random() * totalWeight;

        for (const item of availableItems) {
            roll -= item.dropWeight;
            if (roll <= 0) {
                return item.itemId;
            }
        }

        return availableItems[availableItems.length - 1].itemId;
    }

    public static applyCollectedItems(settings: GameSettings, userData: UserData, collectedItems: Record<string, number>): void {
        for (const [itemId, quantity] of Object.entries(collectedItems)) {
            if (quantity <= 0) continue;
            InventoryState.addItem(settings, userData, itemId, quantity);
        }
    }

    private static isAvailableInZone(item: EquippableItemSettings, zoneId: string): boolean {
        return item.dropZones.length === 0 || item.dropZones.includes(zoneId);
    }
}
