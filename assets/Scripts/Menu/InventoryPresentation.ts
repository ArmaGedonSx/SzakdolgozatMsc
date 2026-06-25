import { GameSettings } from "../Game/Data/GameSettings";
import { EquipmentBonuses, EquipmentBonusResolver } from "../Game/Data/EquipmentBonuses";
import { EquipmentSlotKey } from "../Game/Data/InventoryState";
import { UserData } from "../Game/Data/UserData";

export interface InventoryEquipmentEntry {
    slot: EquipmentSlotKey;
    label: string;
    itemId: string | null;
    itemLabel: string;
    isEmpty: boolean;
}

export interface InventoryItemEntry {
    itemId: string;
    label: string;
    subtitle: string;
    iconKey: string;
    iconLabel: string;
    quantity: number;
    isEquipped: boolean;
    canEquip: boolean;
    actionLabel: string;
    rarity: string;
    slotLabel: string;
    statLine: string;
    description: string;
}

export interface InventoryMaterialEntry {
    materialId: string;
    label: string;
    subtitle: string;
    description: string;
    rarity: string;
    statLine: string;
    iconLabel: string;
    quantity: number;
}

export interface InventoryPresentationData {
    summary: string;
    gearBonusSummary: string;
    emptyBagLabel: string;
    emptyMaterialsLabel: string;
    details: string;
    equipment: InventoryEquipmentEntry[];
    items: InventoryItemEntry[];
    materials: InventoryMaterialEntry[];
}

export class InventoryPresentation {
    public static build(settings: GameSettings, userData: UserData): InventoryPresentationData {
        const itemById = new Map(settings.equippableItems.map((item) => [item.itemId, item]));
        const materialById = new Map(settings.materials.map((material) => [material.materialId, material]));
        const itemCategoryById = new Map(settings.itemCategories.map((category) => [category.categoryId, category]));
        const equippedItemIds = new Set(
            Object.values(userData.game.equipment).filter((itemId): itemId is string => itemId != null && itemId.length > 0)
        );

        const equippedCount = this.countActiveEquippedItems(settings, userData);
        const gearBonuses = EquipmentBonusResolver.resolve(settings, userData);
        const inventoryStacks = userData.game.inventory.filter((item) => item.quantity > 0).sort((left, right) => left.slotIndex - right.slotIndex);
        const materialEntries = Object.entries(userData.game.materials)
            .filter(([, quantity]) => 0 < quantity)
            .sort(([leftId], [rightId]) => leftId.localeCompare(rightId));

        const summary = `Equipped: ${equippedCount} | Bag stacks: ${inventoryStacks.length} | Materials: ${materialEntries.length}`;
        const equipment = this.getEquipmentSlots().map((slot) => {
            const itemId = userData.game.equipment[slot];
            return {
                slot,
                label: this.getSlotLabel(slot),
                itemId,
                itemLabel: itemId ? this.getItemName(itemById, itemId) : "Empty",
                isEmpty: itemId == null
            };
        });
        const items = inventoryStacks.map((inventoryItem) => {
            const item = itemById.get(inventoryItem.itemId);
            const category = item ? itemCategoryById.get(item.categoryId) : undefined;
            const isEquipped = equippedItemIds.has(inventoryItem.itemId);
            const rarity = this.formatRarity(item?.rarity ?? "");
            const slotLabel = this.resolveCategoryLabel(category);
            const statLine = item ? this.formatStats(item.stats) : "No stats";
            const description = this.formatDescription(item?.description);
            const requiredLevel = Math.max(1, Math.floor(item?.requiredLevel ?? 1));
            const meetsLevelRequirement = userData.game.level >= requiredLevel;
            const canEquip = !!item && !!category && meetsLevelRequirement;
            return {
                itemId: inventoryItem.itemId,
                label: `${this.getItemName(itemById, inventoryItem.itemId)} x${inventoryItem.quantity}`,
                subtitle: `${rarity} | ${slotLabel} | Lv. ${requiredLevel}`,
                iconKey: item?.icon || category?.icon || inventoryItem.itemId,
                iconLabel: this.resolveIconLabel(category?.slot ?? item?.categoryId ?? inventoryItem.itemId),
                quantity: inventoryItem.quantity,
                isEquipped,
                canEquip,
                actionLabel: isEquipped ? "Equipped" : item && category ? canEquip ? "Equip" : `Locked Lv. ${requiredLevel}` : "Unknown",
                rarity: item?.rarity ?? "",
                slotLabel,
                statLine,
                description
            };
        });
        const materials = materialEntries.map(([materialId, quantity]) => {
            const material = materialById.get(materialId);
            const rarity = material?.rarity ?? "";
            const rarityLabel = this.formatRarity(rarity);
            const statLine = `${rarityLabel} material`;
            return {
                materialId,
                label: `${this.getMaterialName(materialById, materialId)} x${quantity}`,
                subtitle: statLine,
                description: this.formatDescription(material?.description),
                rarity,
                statLine,
                iconLabel: this.resolveIconLabel(materialId),
                quantity
            };
        });

        const details: string[] = ["Equipped"];
        for (const entry of equipment) {
            details.push(`${entry.label}: ${entry.itemLabel}`);
        }

        details.push("");
        details.push("Bag");
        if (inventoryStacks.length === 0) {
            details.push("Empty");
        } else {
            for (const inventoryItem of inventoryStacks) {
                const equippedSuffix = equippedItemIds.has(inventoryItem.itemId) ? " (equipped)" : "";
                const itemDescription = this.formatDescription(itemById.get(inventoryItem.itemId)?.description);
                details.push(this.appendDescription(`${this.getItemName(itemById, inventoryItem.itemId)} x${inventoryItem.quantity}${equippedSuffix}`, itemDescription));
            }
        }

        details.push("");
        details.push("Materials");
        if (materialEntries.length === 0) {
            details.push("None");
        } else {
            for (const [materialId, quantity] of materialEntries) {
                const materialDescription = this.formatDescription(materialById.get(materialId)?.description);
                details.push(this.appendDescription(`${this.getMaterialName(materialById, materialId)} x${quantity}`, materialDescription));
            }
        }

        return {
            summary,
            gearBonusSummary: this.formatGearBonusSummary(gearBonuses),
            emptyBagLabel: items.length === 0 ? "No gear in backpack" : "",
            emptyMaterialsLabel: materials.length === 0 ? "No materials collected" : "",
            details: details.join("\n"),
            equipment,
            items,
            materials
        };
    }

    private static getEquipmentSlots(): EquipmentSlotKey[] {
        return ["mainHand", "head", "chest", "legs", "feet", "ring1", "ring2", "amulet"];
    }

    private static countActiveEquippedItems(settings: GameSettings, userData: UserData): number {
        const itemById = new Map(settings.equippableItems.map((item) => [item.itemId, item]));
        let count = 0;

        for (const itemId of Object.values(userData.game.equipment)) {
            if (!itemId) continue;

            const item = itemById.get(itemId);
            if (!item || userData.game.level < item.requiredLevel) continue;

            count += 1;
        }

        return count;
    }

    private static formatGearBonusSummary(bonuses: EquipmentBonuses): string {
        const parts = this.formatStats(bonuses);
        return parts === "No stats" ? "Gear: No active bonuses" : `Gear: ${parts}`;
    }

    private static getSlotLabel(slot: EquipmentSlotKey): string {
        switch (slot) {
            case "mainHand":
                return "Weapon";
            case "head":
                return "Head";
            case "chest":
                return "Chest";
            case "legs":
                return "Legs";
            case "feet":
                return "Feet";
            case "ring1":
                return "Ring 1";
            case "ring2":
                return "Ring 2";
            case "amulet":
                return "Amulet";
        }
    }

    private static getItemName(itemById: Map<string, { name: string }>, itemId: string): string {
        const item = itemById.get(itemId);
        return item?.name?.trim() ? item.name : itemId;
    }

    private static getMaterialName(materialById: Map<string, { name: string }>, materialId: string): string {
        const material = materialById.get(materialId);
        return material?.name?.trim() ? material.name : materialId;
    }

    private static formatRarity(rarity: string): string {
        if (!rarity.trim()) return "Unknown";

        return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }

    private static resolveCategoryLabel(category: { name: string; slot: string; categoryId: string } | undefined): string {
        if (!category) return "Unknown";
        if (category.name.trim()) return category.name.trim();
        if (category.slot.trim()) return this.formatSlotText(category.slot);
        if (category.categoryId.trim()) return this.formatSlotText(category.categoryId);

        return "Unknown";
    }

    private static formatSlotText(value: string): string {
        const spaced = value
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[_-]+/g, " ")
            .trim();
        if (!spaced) return value;

        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }

    private static formatStats(stats: {
        atk: number;
        def: number;
        hp: number;
        speed: number;
        critChance: number;
        critMult: number;
        goldBonus: number;
        xpBonus: number;
    }): string {
        const parts: string[] = [];
        this.pushStat(parts, "ATK", stats.atk);
        this.pushStat(parts, "DEF", stats.def);
        this.pushStat(parts, "HP", stats.hp);
        this.pushStat(parts, "SPD", stats.speed);
        this.pushPercentStat(parts, "Crit", stats.critChance);
        this.pushMultiplierStat(parts, "Crit x", stats.critMult);
        this.pushPercentStat(parts, "Gold", stats.goldBonus);
        this.pushPercentStat(parts, "XP", stats.xpBonus);

        return parts.length > 0 ? parts.join(", ") : "No stats";
    }

    private static formatDescription(description: string | undefined): string {
        return description?.trim() ? description.trim() : "";
    }

    private static appendDescription(label: string, description: string): string {
        return description ? `${label} - ${description}` : label;
    }

    private static pushStat(parts: string[], label: string, value: number): void {
        if (value === 0) return;

        parts.push(`${label} ${0 < value ? "+" : ""}${value}`);
    }

    private static pushPercentStat(parts: string[], label: string, value: number): void {
        if (value === 0) return;

        parts.push(`${label} ${0 < value ? "+" : ""}${Math.round(value * 100)}%`);
    }

    private static pushMultiplierStat(parts: string[], label: string, value: number): void {
        if (value <= 1) return;

        parts.push(`${label}${value}`);
    }

    private static resolveIconLabel(slotOrCategory: string): string {
        switch (slotOrCategory) {
            case "mainHand":
            case "weapon":
                return "WPN";
            case "head":
            case "helmet":
                return "HD";
            case "chest":
            case "chestplate":
                return "CH";
            case "legs":
            case "leggings":
                return "LG";
            case "feet":
            case "boots":
                return "BT";
            case "ring":
                return "RG";
            case "amulet":
                return "AM";
            default:
                return slotOrCategory.slice(0, 3).toUpperCase() || "ITM";
        }
    }
}
