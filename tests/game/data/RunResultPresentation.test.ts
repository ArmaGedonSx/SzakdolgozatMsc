import { GameSettings, MaterialSettings, EquippableItemSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { RunResultPresentation } from "../../../assets/Scripts/Menu/RunResultPresentation";

function createZone(zoneId: string, name: string): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.name = name;
    return zone;
}

function createMaterial(materialId: string, name: string): MaterialSettings {
    const material = new MaterialSettings();
    material.materialId = materialId;
    material.name = name;
    return material;
}

function createItem(itemId: string, name: string): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.name = name;
    return item;
}

test("RunResultPresentation summarizes the completed run with records and loot", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_shadow_forest", "Shadow Forest")];
    settings.materials = [createMaterial("mat_uncommon_crystal", "Uncommon Crystal")];
    settings.equippableItems = [createItem("ring_greed_01", "Greed Ring")];
    const result = {
        zoneId: "zone_shadow_forest",
        score: 125.7,
        kills: 24,
        finalLevel: 7,
        chestsOpened: 2,
        goldCoins: 3,
        cleared: true,
        targetSurvivalSeconds: 120,
        collectedMaterials: { mat_uncommon_crystal: 2 },
        collectedItems: { ring_greed_01: 1 }
    };

    const presentation = RunResultPresentation.build(settings, result, 100, 200);

    expect(presentation.summary).toBe("Shadow Forest cleared: 125s/120s | Lv. 7 | Kills: 24 | Chests: 2 | Gold: 3 | Loot: Uncommon Crystal x2, Greed Ring x1 | New zone best!");
    expect(presentation.details).toEqual([
        "Result: Stage cleared",
        "Time survived: 125s",
        "Stage target: 120s",
        "Stage progress: 125/120s (100%)",
        "Time to clear: Complete",
        "Final level: 7",
        "Enemies defeated: 24",
        "Chests opened: 2",
        "Gold collected: 3",
        "Zone best: 125s",
        "Global best: 200s",
        "Materials: Uncommon Crystal x2",
        "Items: Greed Ring x1"
    ]);
    expect(presentation.isNewZoneBest).toBe(true);
    expect(presentation.isNewGlobalBest).toBe(false);
});

test("RunResultPresentation falls back cleanly when there is no loot", () => {
    const settings = new GameSettings();
    const result = {
        zoneId: "zone_missing",
        score: 40,
        kills: 0,
        finalLevel: 1,
        chestsOpened: 0,
        goldCoins: 0,
        cleared: false,
        targetSurvivalSeconds: 90,
        collectedMaterials: {},
        collectedItems: {}
    };

    const presentation = RunResultPresentation.build(settings, result, 50, 100);

    expect(presentation.summary).toBe("zone_missing failed: 40s/90s | Lv. 1 | Kills: 0 | Chests: 0 | Gold: 0");
    expect(presentation.details).toContain("Result: Failed");
    expect(presentation.details).toContain("Stage target: 90s");
    expect(presentation.details).toContain("Stage progress: 40/90s (44%)");
    expect(presentation.details).toContain("Time to clear: 50s remaining");
    expect(presentation.details).toContain("Materials: None");
    expect(presentation.details).toContain("Items: None");
    expect(presentation.isNewZoneBest).toBe(false);
    expect(presentation.isNewGlobalBest).toBe(false);
});

test("RunResultPresentation keeps summary loot compact when many drops were collected", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_crystal_caves", "Crystal Caves")];
    settings.materials = [
        createMaterial("mat_common_ore", "Common Ore"),
        createMaterial("mat_uncommon_crystal", "Uncommon Crystal"),
        createMaterial("mat_rare_essence", "Rare Essence")
    ];
    settings.equippableItems = [
        createItem("helmet_steel_01", "Steel Helmet"),
        createItem("boots_runner_01", "Runner Boots")
    ];
    const result = {
        zoneId: "zone_crystal_caves",
        score: 90,
        kills: 18,
        finalLevel: 5,
        chestsOpened: 1,
        goldCoins: 4,
        cleared: false,
        targetSurvivalSeconds: 120,
        collectedMaterials: {
            mat_common_ore: 3,
            mat_uncommon_crystal: 2,
            mat_rare_essence: 1
        },
        collectedItems: {
            helmet_steel_01: 1,
            boots_runner_01: 1
        }
    };

    const presentation = RunResultPresentation.build(settings, result, 100, 200);

    expect(presentation.summary).toBe(
        "Crystal Caves failed: 90s/120s | Lv. 5 | Kills: 18 | Chests: 1 | Gold: 4 | Loot: Common Ore x3, Uncommon Crystal x2, Rare Essence x1 +2 more"
    );
});
