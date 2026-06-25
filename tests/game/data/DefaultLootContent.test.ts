import { DefaultLootContent } from "../../../assets/Scripts/Game/Data/DefaultLootContent";
import { EquippableItemSettings, MaterialSettings } from "../../../assets/Scripts/Game/Data/GameSettings";

function createMaterial(materialId: string, rarity: string, dropZones: string[] = []): MaterialSettings {
    const material = new MaterialSettings();
    material.materialId = materialId;
    material.rarity = rarity;
    material.dropZones = dropZones;
    return material;
}

function createItem(itemId: string, rarity: string, requiredLevel: number, dropZones: string[] = []): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.rarity = rarity;
    item.requiredLevel = requiredLevel;
    item.dropZones = dropZones;
    return item;
}

test("DefaultLootContent redistributes legacy materials across progression zones", () => {
    const materials = [
        createMaterial("mat_common_ore", "common"),
        createMaterial("mat_uncommon_crystal", "uncommon", ["zone_main_arena"]),
        createMaterial("mat_rare_essence", "rare", ["zone_main_arena"]),
        createMaterial("mat_epic_core", "epic", ["zone_main_arena"])
    ];

    const normalized = DefaultLootContent.normalizeMaterials(materials);

    expect(normalized.map((material) => ({ id: material.materialId, zones: material.dropZones }))).toEqual([
        { id: "mat_common_ore", zones: [] },
        { id: "mat_uncommon_crystal", zones: ["zone_shadow_forest", "zone_crystal_caves", "zone_ancient_ruins"] },
        { id: "mat_rare_essence", zones: ["zone_crystal_caves", "zone_ancient_ruins"] },
        { id: "mat_epic_core", zones: ["zone_ancient_ruins"] }
    ]);
});

test("DefaultLootContent redistributes legacy items across progression zones", () => {
    const items = [
        createItem("sword_iron_01", "common", 1, ["zone_main_arena"]),
        createItem("helmet_leather_01", "common", 1, ["zone_main_arena"]),
        createItem("ring_greed_01", "uncommon", 3, ["zone_main_arena"])
    ];

    const normalized = DefaultLootContent.normalizeItems(items);

    expect(normalized.map((item) => ({ id: item.itemId, zones: item.dropZones }))).toEqual([
        { id: "sword_iron_01", zones: ["zone_main_arena", "zone_shadow_forest"] },
        { id: "helmet_leather_01", zones: ["zone_main_arena", "zone_shadow_forest"] },
        { id: "ring_greed_01", zones: ["zone_shadow_forest", "zone_crystal_caves", "zone_ancient_ruins"] }
    ]);
});

test("DefaultLootContent keeps already diversified loot zones untouched", () => {
    const items = [createItem("custom_item", "rare", 8, ["zone_crystal_caves", "zone_ancient_ruins"])];
    const materials = [createMaterial("custom_mat", "rare", ["zone_crystal_caves", "zone_ancient_ruins"])];

    expect(DefaultLootContent.normalizeItems(items)[0].dropZones).toEqual(["zone_crystal_caves", "zone_ancient_ruins"]);
    expect(DefaultLootContent.normalizeMaterials(materials)[0].dropZones).toEqual(["zone_crystal_caves", "zone_ancient_ruins"]);
});
