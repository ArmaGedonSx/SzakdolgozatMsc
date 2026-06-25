import { EquippableItemSettings, GameSettings, MaterialSettings, ZoneEnemySpawnSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { ZoneSelectionPresentation } from "../../../assets/Scripts/Menu/ZoneSelectionPresentation";

function createZone(zoneId: string, name: string, requiredLevel: number): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.name = name;
    zone.requiredLevel = requiredLevel;
    zone.isUnlocked = true;
    zone.targetSurvivalSeconds = 120;
    zone.clearRewardGold = 25;
    return zone;
}

function createMaterial(materialId: string, name: string, dropZones: string[] = []): MaterialSettings {
    const material = new MaterialSettings();
    material.materialId = materialId;
    material.name = name;
    material.rarity = "common";
    material.dropZones = dropZones;
    material.dropWeight = 1;
    material.lastUpdated = "2026-06-23T00:00:00.000Z";
    return material;
}

function createItem(itemId: string, name: string, dropZones: string[] = []): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.name = name;
    item.categoryId = "weapon";
    item.rarity = "common";
    item.dropZones = dropZones;
    item.dropWeight = 1;
    item.lastUpdated = "2026-06-23T00:00:00.000Z";
    return item;
}

function createZoneSpawn(zoneId: string, enemyId: string, milestoneTimeSeconds: number, spawnPattern: "individual" | "circular" | "wave" = "individual"): ZoneEnemySpawnSettings {
    const spawn = new ZoneEnemySpawnSettings();
    spawn.spawnId = `${zoneId}_${enemyId}_${milestoneTimeSeconds}`;
    spawn.zoneId = zoneId;
    spawn.enemyId = enemyId;
    spawn.weight = 1;
    spawn.maxAlive = 1;
    spawn.spawnInterval = 1000;
    spawn.spawnPattern = spawnPattern;
    spawn.milestoneTimeSeconds = milestoneTimeSeconds;
    spawn.lastUpdated = "2026-06-23T00:00:00.000Z";
    return spawn;
}

test("ZoneSelectionPresentation marks current, unlocked and locked zones", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", "Main Arena", 1),
        createZone("zone_shadow_forest", "Shadow Forest", 3),
        createZone("zone_crystal_caves", "Crystal Caves", 6)
    ];
    const userData = new UserData();
    userData.game.level = 4;
    userData.game.currentZoneId = "zone_shadow_forest";
    userData.game.unlockedZones = ["zone_main_arena", "zone_shadow_forest"];
    userData.game.clearedZones = ["zone_main_arena"];
    userData.game.zoneHighscores.zone_main_arena = 125;
    userData.game.zoneHighscores.zone_shadow_forest = 92;

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.summary).toBe("Current zone: Shadow Forest | Unlocked: 2/3 | Cleared: 1/3 | Current best: 92/120s (76%)");
    expect(presentation.zones).toEqual([
        {
            zoneId: "zone_main_arena",
            name: "Main Arena",
            label: "Main Arena - Cleared - Best: 125s",
            subtitle: "Level 1 | Goal: 120s | Best: 125/120s (100%)",
            actionLabel: "Replay",
            iconKey: "zone_main_arena",
            iconLabel: "MA",
            requiredLevel: 1,
            targetSurvivalSeconds: 120,
            clearRewardGold: 25,
            bestScore: 125,
            unlockHint: "Cleared | Goal: 120s",
            isCleared: true,
            isCurrent: false,
            isUnlocked: true,
            isRecommended: false,
            isSelectable: true,
            tone: "cleared",
            status: "Cleared"
        },
        {
            zoneId: "zone_shadow_forest",
            name: "Shadow Forest",
            label: "Shadow Forest - Current - Best: 92s",
            subtitle: "Level 3 | Goal: 120s | Reward: 25 gold | Best: 92/120s (76%)",
            actionLabel: "Current",
            iconKey: "zone_shadow_forest",
            iconLabel: "SF",
            requiredLevel: 3,
            targetSurvivalSeconds: 120,
            clearRewardGold: 25,
            bestScore: 92,
            unlockHint: "Goal: 120s | Reward: 25 gold",
            isCleared: false,
            isCurrent: true,
            isUnlocked: true,
            isRecommended: false,
            isSelectable: false,
            tone: "current",
            status: "Current"
        },
        {
            zoneId: "zone_crystal_caves",
            name: "Crystal Caves",
            label: "Crystal Caves - Locked (Level 6)",
            subtitle: "Reach Level 6 | Goal: 120s | Reward: 25 gold | Best: 0/120s (0%)",
            actionLabel: "Locked",
            iconKey: "zone_crystal_caves",
            iconLabel: "CC",
            requiredLevel: 6,
            targetSurvivalSeconds: 120,
            clearRewardGold: 25,
            bestScore: 0,
            unlockHint: "Reach Level 6 | Goal: 120s | Reward: 25 gold",
            isCleared: false,
            isCurrent: false,
            isUnlocked: false,
            isRecommended: false,
            isSelectable: false,
            tone: "locked",
            status: "Locked (Level 6)"
        }
    ]);
});

test("ZoneSelectionPresentation falls back to zone ids when names are missing", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_main_arena", "", 1)];
    const userData = new UserData();

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.summary).toBe("Current zone: zone_main_arena | Unlocked: 1/1 | Cleared: 0/1 | Current best: 0/120s (0%)");
    expect(presentation.zones[0].label).toBe("zone_main_arena - Current");
});

test("ZoneSelectionPresentation highlights the next recommended unlocked zone", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", "Main Arena", 1),
        createZone("zone_shadow_forest", "Shadow Forest", 3),
        createZone("zone_crystal_caves", "Crystal Caves", 6)
    ];
    const userData = new UserData();
    userData.game.level = 4;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena", "zone_shadow_forest"];

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.summary).toBe("Current zone: Main Arena | Unlocked: 2/3 | Cleared: 0/3 | Current best: 0/120s (0%) | Next: Shadow Forest");
    expect(presentation.zones[1]).toEqual(expect.objectContaining({
        zoneId: "zone_shadow_forest",
        label: "Shadow Forest - Recommended",
        subtitle: "Recommended next | Level 3 | Goal: 120s | Reward: 25 gold | Best: 0/120s (0%)",
        actionLabel: "Select",
        iconKey: "zone_shadow_forest",
        iconLabel: "SF",
        targetSurvivalSeconds: 120,
        clearRewardGold: 25,
        unlockHint: "Goal: 120s | Reward: 25 gold",
        isCleared: false,
        isRecommended: true,
        isSelectable: true,
        tone: "recommended",
        status: "Recommended"
    }));
});

test("ZoneSelectionPresentation explains clear-gated locked stages", () => {
    const settings = new GameSettings();
    const mainArena = createZone("zone_main_arena", "Main Arena", 1);
    const shadowForest = createZone("zone_shadow_forest", "Shadow Forest", 3);
    mainArena.targetSurvivalSeconds = 120;
    shadowForest.targetSurvivalSeconds = 180;
    shadowForest.clearRewardGold = 50;
    mainArena.exits = [{ direction: "east", targetZoneId: "zone_shadow_forest", spawnX: 0, spawnY: 0, minLevel: 3 }];
    settings.zones = [mainArena, shadowForest];
    const userData = new UserData();
    userData.game.level = 3;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];
    userData.game.zoneHighscores.zone_main_arena = 45;

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.zones[1]).toEqual(expect.objectContaining({
        zoneId: "zone_shadow_forest",
        status: "Locked",
        subtitle: "Clear Main Arena: 45/120s (37%) | Level 3 | Goal: 180s | Reward: 50 gold",
        unlockHint: "Clear Main Arena: 45/120s (37%) | Goal: 180s | Reward: 50 gold",
        clearRewardGold: 50,
        isSelectable: false,
        tone: "locked"
    }));
});

test("ZoneSelectionPresentation includes compact farm hints from zone materials and items", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_shadow_forest", "Shadow Forest", 3)];
    settings.materials = [
        createMaterial("mat_common_ore", "Common Ore"),
        createMaterial("mat_uncommon_crystal", "Uncommon Crystal", ["zone_shadow_forest"]),
        createMaterial("mat_rare_essence", "Rare Essence", ["zone_crystal_caves"])
    ];
    settings.equippableItems = [
        createItem("sword_iron_01", "Iron Sword", ["zone_shadow_forest"]),
        createItem("ring_greed_01", "Greed Ring", ["zone_crystal_caves"])
    ];
    const userData = new UserData();
    userData.game.level = 3;
    userData.game.currentZoneId = "zone_shadow_forest";
    userData.game.unlockedZones = ["zone_shadow_forest"];

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.zones[0].subtitle).toBe(
        "Level 3 | Goal: 120s | Reward: 25 gold | Best: 0/120s (0%) | Farm: Common Ore, Uncommon Crystal, Iron Sword"
    );
});

test("ZoneSelectionPresentation indicates when a zone has more farm targets than fit the card", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_crystal_caves", "Crystal Caves", 6)];
    settings.materials = [
        createMaterial("mat_common_ore", "Common Ore"),
        createMaterial("mat_uncommon_crystal", "Uncommon Crystal", ["zone_crystal_caves"]),
        createMaterial("mat_rare_essence", "Rare Essence", ["zone_crystal_caves"])
    ];
    settings.equippableItems = [
        createItem("helmet_steel_01", "Steel Helmet", ["zone_crystal_caves"]),
        createItem("boots_runner_01", "Runner Boots", ["zone_crystal_caves"])
    ];
    const userData = new UserData();
    userData.game.level = 6;
    userData.game.currentZoneId = "zone_crystal_caves";
    userData.game.unlockedZones = ["zone_crystal_caves"];

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.zones[0].subtitle).toBe(
        "Level 6 | Goal: 120s | Reward: 25 gold | Best: 0/120s (0%) | Farm: Common Ore, Uncommon Crystal, Rare Essence +2 more"
    );
});

test("ZoneSelectionPresentation includes survivor-style horde and boss event hints", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_shadow_forest", "Shadow Forest", 3)];
    settings.enemyManager.zoneEnemySpawns = [
        createZoneSpawn("zone_shadow_forest", "StandardEnemy", 0),
        createZoneSpawn("zone_shadow_forest", "CircleEnemyStandard", 45, "circular"),
        createZoneSpawn("zone_shadow_forest", "StandardBoss", 60),
        createZoneSpawn("zone_crystal_caves", "HardBoss", 90)
    ];
    const userData = new UserData();
    userData.game.level = 3;
    userData.game.currentZoneId = "zone_shadow_forest";
    userData.game.unlockedZones = ["zone_shadow_forest"];

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.zones[0].subtitle).toBe(
        "Level 3 | Goal: 120s | Reward: 25 gold | Best: 0/120s (0%) | Events: Horde 45s, Boss 60s"
    );
});

test("ZoneSelectionPresentation indicates when a zone has more timed events than fit the card", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_ancient_ruins", "Ancient Ruins", 10)];
    settings.enemyManager.zoneEnemySpawns = [
        createZoneSpawn("zone_ancient_ruins", "WaveEnemyDeath", 40, "wave"),
        createZoneSpawn("zone_ancient_ruins", "HardBoss", 70),
        createZoneSpawn("zone_ancient_ruins", "CircleEnemyDeath", 95, "circular"),
        createZoneSpawn("zone_ancient_ruins", "FinalBoss", 120)
    ];
    const userData = new UserData();
    userData.game.level = 10;
    userData.game.currentZoneId = "zone_ancient_ruins";
    userData.game.unlockedZones = ["zone_ancient_ruins"];

    const presentation = ZoneSelectionPresentation.build(settings, userData);

    expect(presentation.zones[0].subtitle).toBe(
        "Level 10 | Goal: 120s | Reward: 25 gold | Best: 0/120s (0%) | Events: Horde 40s, Boss 70s +2 more"
    );
});
