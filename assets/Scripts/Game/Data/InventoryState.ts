import { EquippableItemSettings, GameSettings, ItemCategorySettings } from "./GameSettings";
import { InventoryItemData, UserData } from "./UserData";

export type EquipmentSlotKey = "mainHand" | "head" | "chest" | "legs" | "feet" | "ring1" | "ring2" | "amulet";

export class InventoryNormalizationResult {
    public addedInventoryItems: string[] = [];
    public removedInventoryItems: string[] = [];
    public clearedEquipmentSlots: EquipmentSlotKey[] = [];
    public autoEquippedSlots: EquipmentSlotKey[] = [];
}

export class InventoryState {
    public static normalize(settings: GameSettings, userData: UserData): InventoryNormalizationResult {
        const result = new InventoryNormalizationResult();
        this.normalizeInventory(settings, userData, result);
        this.normalizeEquipment(settings, userData, result);
        this.ensureStarterWeapon(settings, userData, result);
        return result;
    }

    public static addItem(settings: GameSettings, userData: UserData, itemId: string, quantity: number): void {
        if (quantity <= 0) return;

        const maxStack = this.getMaxStack(settings, itemId);
        let quantityLeft = quantity;
        const matchingStacks = userData.game.inventory
            .filter((item) => item.itemId === itemId)
            .sort((left, right) => left.slotIndex - right.slotIndex);

        for (const inventoryItem of matchingStacks) {
            if (quantityLeft <= 0) break;
            const freeSpace = Math.max(0, maxStack - inventoryItem.quantity);
            if (freeSpace <= 0) continue;

            const toAdd = Math.min(freeSpace, quantityLeft);
            inventoryItem.quantity += toAdd;
            quantityLeft -= toAdd;
        }

        while (0 < quantityLeft) {
            const newItem = new InventoryItemData();
            newItem.itemId = itemId;
            newItem.quantity = Math.min(maxStack, quantityLeft);
            newItem.slotIndex = this.getNextSlotIndex(userData);
            userData.game.inventory.push(newItem);
            quantityLeft -= newItem.quantity;
        }
    }

    public static equipItem(settings: GameSettings, userData: UserData, itemId: string): boolean {
        const item = settings.equippableItems.find((candidate) => candidate.itemId === itemId);
        if (!item) return false;
        if (userData.game.level < item.requiredLevel) return false;

        const category = settings.itemCategories.find((candidate) => candidate.categoryId === item.categoryId);
        if (!category) return false;

        const inventoryItem = userData.game.inventory.find((candidate) => candidate.itemId === itemId && candidate.quantity > 0);
        if (!inventoryItem) return false;

        const slot = this.resolveEquipmentSlot(category, userData);
        if (!slot) return false;

        userData.game.equipment[slot] = itemId;
        return true;
    }

    public static unequipItem(userData: UserData, slot: EquipmentSlotKey): void {
        userData.game.equipment[slot] = null;
    }

    private static normalizeInventory(settings: GameSettings, userData: UserData, result: InventoryNormalizationResult): void {
        const validItemIds = new Set(settings.equippableItems.map((item) => item.itemId));
        const quantityByItemId = new Map<string, number>();

        for (const item of userData.game.inventory) {
            if (!validItemIds.has(item.itemId)) {
                result.removedInventoryItems.push(item.itemId);
                continue;
            }

            if (item.quantity <= 0) {
                result.removedInventoryItems.push(item.itemId);
                continue;
            }

            quantityByItemId.set(item.itemId, (quantityByItemId.get(item.itemId) ?? 0) + item.quantity);
        }

        userData.game.inventory = [];
        for (const [itemId, quantity] of quantityByItemId) {
            this.addItem(settings, userData, itemId, quantity);
        }
        userData.game.inventory.sort((left, right) => left.slotIndex - right.slotIndex);
    }

    private static normalizeEquipment(settings: GameSettings, userData: UserData, result: InventoryNormalizationResult): void {
        const allItems = new Map(settings.equippableItems.map((item) => [item.itemId, item]));
        const categories = new Map(settings.itemCategories.map((item) => [item.categoryId, item]));
        const equipmentSlots: EquipmentSlotKey[] = ["mainHand", "head", "chest", "legs", "feet", "ring1", "ring2", "amulet"];

        for (const slot of equipmentSlots) {
            const equippedItemId = userData.game.equipment[slot];
            if (!equippedItemId) continue;

            const item = allItems.get(equippedItemId);
            if (!item) {
                userData.game.equipment[slot] = null;
                result.clearedEquipmentSlots.push(slot);
                continue;
            }

            const category = categories.get(item.categoryId);
            if (!category || !this.isItemAllowedInSlot(category, slot)) {
                userData.game.equipment[slot] = null;
                result.clearedEquipmentSlots.push(slot);
                continue;
            }

            if (userData.game.level < item.requiredLevel) {
                userData.game.equipment[slot] = null;
                result.clearedEquipmentSlots.push(slot);
                continue;
            }

            if (!userData.game.inventory.some((inventoryItem) => inventoryItem.itemId === equippedItemId)) {
                this.addItem(settings, userData, equippedItemId, 1);
                result.addedInventoryItems.push(equippedItemId);
            }
        }
    }

    private static ensureStarterWeapon(settings: GameSettings, userData: UserData, result: InventoryNormalizationResult): void {
        const hasWeaponEquipped = !!userData.game.equipment.mainHand;
        if (hasWeaponEquipped) return;

        const starterWeapon = settings.equippableItems.find((item) => item.categoryId === "weapon" && item.requiredLevel <= userData.game.level);
        if (!starterWeapon) return;

        if (!userData.game.inventory.some((item) => item.itemId === starterWeapon.itemId)) {
            this.addItem(settings, userData, starterWeapon.itemId, 1);
            result.addedInventoryItems.push(starterWeapon.itemId);
        }

        userData.game.equipment.mainHand = starterWeapon.itemId;
        result.autoEquippedSlots.push("mainHand");
    }

    private static resolveEquipmentSlot(category: ItemCategorySettings, userData: UserData): EquipmentSlotKey | null {
        if (category.slot === "ring") {
            return userData.game.equipment.ring1 == null ? "ring1" : userData.game.equipment.ring2 == null ? "ring2" : "ring1";
        }

        return this.toEquipmentSlotKey(category.slot);
    }

    private static isItemAllowedInSlot(category: ItemCategorySettings, slot: EquipmentSlotKey): boolean {
        if (category.slot === "ring") {
            return slot === "ring1" || slot === "ring2";
        }

        return this.toEquipmentSlotKey(category.slot) === slot;
    }

    private static toEquipmentSlotKey(slot: string): EquipmentSlotKey | null {
        switch (slot) {
            case "mainHand":
            case "head":
            case "chest":
            case "legs":
            case "feet":
            case "amulet":
                return slot;
            default:
                return null;
        }
    }

    private static getNextSlotIndex(userData: UserData): number {
        if (userData.game.inventory.length === 0) return 0;
        return Math.max(...userData.game.inventory.map((item) => item.slotIndex)) + 1;
    }

    private static getMaxStack(settings: GameSettings, itemId: string): number {
        const item = settings.equippableItems.find((candidate) => candidate.itemId === itemId);
        if (!item) return 1;

        const category = settings.itemCategories.find((candidate) => candidate.categoryId === item.categoryId);
        return Math.max(1, category?.maxStack ?? 1);
    }
}
