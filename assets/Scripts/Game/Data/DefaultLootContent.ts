import { EquippableItemSettings, MaterialSettings } from "./GameSettings";

const SHADOW_FOREST = "zone_shadow_forest";
const CRYSTAL_CAVES = "zone_crystal_caves";
const ANCIENT_RUINS = "zone_ancient_ruins";
const MAIN_ARENA = "zone_main_arena";

export class DefaultLootContent {
    public static normalizeMaterials(materials: MaterialSettings[]): MaterialSettings[] {
        const shouldNormalize = materials.every((material) => this.isLegacyZoneAssignment(material.dropZones));
        if (!shouldNormalize) return materials;

        return materials.map((material) => {
            const normalized = new MaterialSettings();
            Object.assign(normalized, material);
            normalized.dropZones = this.resolveMaterialZones(material.rarity);
            return normalized;
        });
    }

    public static normalizeItems(items: EquippableItemSettings[]): EquippableItemSettings[] {
        const shouldNormalize = items.every((item) => this.isLegacyZoneAssignment(item.dropZones));
        if (!shouldNormalize) return items;

        return items.map((item) => {
            const normalized = new EquippableItemSettings();
            Object.assign(normalized, item);
            normalized.stats = Object.assign({}, item.stats);
            normalized.dropZones = this.resolveItemZones(item.rarity, item.requiredLevel);
            return normalized;
        });
    }

    private static resolveMaterialZones(rarity: string): string[] {
        switch (rarity) {
            case "uncommon":
                return [SHADOW_FOREST, CRYSTAL_CAVES, ANCIENT_RUINS];
            case "rare":
                return [CRYSTAL_CAVES, ANCIENT_RUINS];
            case "epic":
                return [ANCIENT_RUINS];
            default:
                return [];
        }
    }

    private static resolveItemZones(rarity: string, requiredLevel: number): string[] {
        if (rarity === "uncommon" || 3 <= requiredLevel) {
            return [SHADOW_FOREST, CRYSTAL_CAVES, ANCIENT_RUINS];
        }

        if (rarity === "common" || requiredLevel <= 2) {
            return [MAIN_ARENA, SHADOW_FOREST];
        }

        return [CRYSTAL_CAVES, ANCIENT_RUINS];
    }

    private static isLegacyZoneAssignment(dropZones: string[]): boolean {
        return dropZones.length === 0 || (dropZones.length === 1 && dropZones[0] === MAIN_ARENA);
    }
}
