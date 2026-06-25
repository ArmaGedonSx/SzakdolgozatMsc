import { ContentValidationIssue, ContentValidator } from "../../../assets/Scripts/Game/Data/ContentValidator";
import {
    CircularEnemySpawnerSettings,
    EnemySettings,
    EquippableItemSettings,
    GameSettings,
    IndividualEnemySpawnerSettings,
    ItemCategorySettings,
    MaterialSettings,
    SkillSettings,
    WaveEnemySpawnerSettings,
    ZoneEnemySpawnSettings,
    ZoneExitSettings,
    ZoneSettings
} from "../../../assets/Scripts/Game/Data/GameSettings";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_main_arena")];
    settings.materials = [createMaterial("mat_common_ore", ["zone_main_arena"])];
    settings.itemCategories = [createCategory("weapon", "mainHand")];
    settings.equippableItems = [createItem("sword_iron_01", "weapon", ["zone_main_arena"])];
    settings.enemyManager.enemies = [createEnemy("BasicEnemy")];
    settings.enemyManager.individualEnemySpawners = [createIndividualSpawner("BasicEnemy")];
    settings.enemyManager.circularEnemySpawners = [createCircularSpawner("BasicEnemy")];
    settings.enemyManager.waveEnemySpawners = [createWaveSpawner("BasicEnemy")];
    settings.enemyManager.zoneEnemySpawns = [createZoneEnemySpawn("spawn_basic", "zone_main_arena", "BasicEnemy")];
    settings.skills = [createSkill("combat_weapon_length_1", UpgradeType.WeaponLength)];
    return settings;
}

function createZone(zoneId: string, exits: ZoneExitSettings[] = []): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.createdAt = "2026-06-19T00:00:00.000Z";
    zone.lastUpdated = "2026-06-23T00:00:00.000Z";
    zone.exits = exits;
    return zone;
}

function createExit(targetZoneId: string): ZoneExitSettings {
    const exit = new ZoneExitSettings();
    exit.targetZoneId = targetZoneId;
    return exit;
}

function createMaterial(materialId: string, dropZones: string[]): MaterialSettings {
    const material = new MaterialSettings();
    material.materialId = materialId;
    material.rarity = "common";
    material.dropZones = dropZones;
    material.dropWeight = 1;
    material.lastUpdated = "2026-06-23T00:00:00.000Z";
    return material;
}

function createCategory(categoryId: string, slot: string): ItemCategorySettings {
    const category = new ItemCategorySettings();
    category.categoryId = categoryId;
    category.slot = slot;
    category.lastUpdated = "2026-06-23T00:00:00.000Z";
    return category;
}

function createItem(itemId: string, categoryId: string, dropZones: string[]): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.categoryId = categoryId;
    item.rarity = "common";
    item.dropZones = dropZones;
    item.dropWeight = 1;
    item.lastUpdated = "2026-06-23T00:00:00.000Z";
    item.stats.critMult = 1;
    return item;
}

function createEnemy(enemyId: string): EnemySettings {
    const enemy = new EnemySettings();
    enemy.id = enemyId;
    enemy.lastUpdated = "2026-06-23T00:00:00.000Z";
    return enemy;
}

function createSkill(skillId: string, upgradeType: UpgradeType): SkillSettings {
    const skill = new SkillSettings();
    skill.skillId = skillId;
    skill.upgradeType = upgradeType;
    skill.name = skillId;
    skill.description = `${skillId} description`;
    skill.type = "passive";
    skill.maxRank = 1;
    skill.goldCoinCost = 0;
    skill.statBonusPerRank.critMult = 1;
    skill.lastUpdated = "2026-06-23T00:00:00.000Z";
    return skill;
}

function createIndividualSpawner(enemyId: string): IndividualEnemySpawnerSettings {
    const spawner = new IndividualEnemySpawnerSettings();
    spawner.common.enemyId = enemyId;
    return spawner;
}

function createCircularSpawner(enemyId: string): CircularEnemySpawnerSettings {
    const spawner = new CircularEnemySpawnerSettings();
    spawner.common.enemyId = enemyId;
    return spawner;
}

function createWaveSpawner(enemyId: string): WaveEnemySpawnerSettings {
    const spawner = new WaveEnemySpawnerSettings();
    spawner.common.enemyId = enemyId;
    return spawner;
}

function createZoneEnemySpawn(spawnId: string, zoneId: string, enemyId: string): ZoneEnemySpawnSettings {
    const spawn = new ZoneEnemySpawnSettings();
    spawn.spawnId = spawnId;
    spawn.zoneId = zoneId;
    spawn.enemyId = enemyId;
    spawn.weight = 1;
    spawn.minLevel = 1;
    spawn.maxLevel = 10;
    spawn.maxAlive = 3;
    spawn.spawnInterval = 1000;
    spawn.lastUpdated = "2026-06-23T00:00:00.000Z";
    return spawn;
}

function summarize(issues: ContentValidationIssue[]): string[] {
    return issues.map((issue) => `${issue.severity}:${issue.path}:${issue.message}`);
}

test("ContentValidator returns no issues for coherent content data", () => {
    const settings = createSettings();

    const issues = ContentValidator.validate(settings);

    expect(issues).toEqual([]);
});

test("ContentValidator reports missing references and duplicate ids", () => {
    const settings = createSettings();
    settings.zones = [createZone("zone_main_arena", [createExit("zone_missing")]), createZone("zone_main_arena")];
    settings.materials = [createMaterial("mat_common_ore", ["zone_missing"])];
    settings.equippableItems = [createItem("sword_iron_01", "missing_category", ["zone_missing"])];
    settings.skills = [createSkill("combat_weapon_length_1", UpgradeType.WeaponLength), createSkill("combat_weapon_length_1", UpgradeType.WeaponLength)];
    settings.enemyManager.enemies = [createEnemy("BasicEnemy"), createEnemy("BasicEnemy")];
    settings.enemyManager.individualEnemySpawners = [createIndividualSpawner("UnknownEnemy")];
    settings.enemyManager.zoneEnemySpawns = [createZoneEnemySpawn("spawn_basic", "zone_missing", "UnknownEnemy")];

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toEqual(
        expect.arrayContaining([
            expect.stringContaining("error:zones[1].zoneId:Duplicate zoneId"),
            expect.stringContaining("error:zones[0].exits[0].targetZoneId:Unknown zone reference"),
            expect.stringContaining("error:materials[0].dropZones[0]:Unknown zone reference"),
            expect.stringContaining("error:equippableItems[0].categoryId:Unknown item category reference"),
            expect.stringContaining("error:equippableItems[0].dropZones[0]:Unknown zone reference"),
            expect.stringContaining("error:skills[1].skillId:Duplicate skillId"),
            expect.stringContaining("error:skills[1].upgradeType:Duplicate upgrade type"),
            expect.stringContaining("error:enemyManager.enemies[1].id:Duplicate enemy id"),
            expect.stringContaining("error:enemyManager.individualEnemySpawners[0].common.enemyId:Unknown enemy reference"),
            expect.stringContaining("error:enemyManager.zoneEnemySpawns[0].zoneId:Unknown zone reference"),
            expect.stringContaining("error:enemyManager.zoneEnemySpawns[0].enemyId:Unknown enemy reference")
        ])
    );
});

test("ContentValidator reports invalid skill settings", () => {
    const settings = createSettings();
    const invalidSkill = createSkill("broken_skill", UpgradeType.WeaponLength);
    invalidSkill.type = "broken" as any;
    invalidSkill.maxRank = 0;
    invalidSkill.goldCoinCost = -1;
    invalidSkill.choiceWeight = -1;
    invalidSkill.upgradeType = "MISSING" as UpgradeType;
    invalidSkill.materialCosts.mat_missing = 2;
    invalidSkill.materialCosts.mat_common_ore = -1;
    settings.skills = [invalidSkill];

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('error:skills[0].upgradeType:Unknown upgrade type "MISSING"'),
            expect.stringContaining('error:skills[0].type:Unknown skill type "broken"'),
            expect.stringContaining("error:skills[0].maxRank:Skill maxRank must be greater than zero"),
            expect.stringContaining("error:skills[0].goldCoinCost:Skill goldCoinCost cannot be negative"),
            expect.stringContaining("error:skills[0].choiceWeight:Skill choiceWeight cannot be negative"),
            expect.stringContaining('error:skills[0].materialCosts.mat_missing:Unknown material reference "mat_missing"'),
            expect.stringContaining("error:skills[0].materialCosts.mat_common_ore:Skill material cost cannot be negative")
        ])
    );
});

test("ContentValidator reports invalid zone spawn regions", () => {
    const settings = createSettings();
    settings.enemyManager.zoneEnemySpawns[0].spawnRegion.w = -10;
    settings.enemyManager.zoneEnemySpawns[0].spawnRegion.h = -5;

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toEqual(
        expect.arrayContaining([
            expect.stringContaining("error:enemyManager.zoneEnemySpawns[0].spawnRegion.w:zoneEnemySpawn spawnRegion.w cannot be negative"),
            expect.stringContaining("error:enemyManager.zoneEnemySpawns[0].spawnRegion.h:zoneEnemySpawn spawnRegion.h cannot be negative")
        ])
    );
});

test("ContentValidator reports invalid stage survival targets", () => {
    const settings = createSettings();
    settings.zones[0].targetSurvivalSeconds = -1;
    settings.zones[0].clearRewardGold = -1;

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toContain("error:zones[0].targetSurvivalSeconds:Zone targetSurvivalSeconds cannot be negative");
    expect(summarize(issues)).toContain("error:zones[0].clearRewardGold:Zone clearRewardGold cannot be negative");
});

test("ContentValidator reports invalid spawn pressure settings", () => {
    const settings = createSettings();
    settings.enemyManager.spawnPressure.enabled = true;
    settings.enemyManager.spawnPressure.rampStartSeconds = -1;
    settings.enemyManager.spawnPressure.secondsPerStep = 0;
    settings.enemyManager.spawnPressure.maxSteps = -1;
    settings.enemyManager.spawnPressure.cooldownReductionPerStep = 1.2;
    settings.enemyManager.spawnPressure.levelBonusPerStep = -1;

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toEqual(
        expect.arrayContaining([
            expect.stringContaining("error:enemyManager.spawnPressure.rampStartSeconds:spawnPressure rampStartSeconds cannot be negative"),
            expect.stringContaining("error:enemyManager.spawnPressure.secondsPerStep:spawnPressure secondsPerStep must be greater than zero"),
            expect.stringContaining("error:enemyManager.spawnPressure.maxSteps:spawnPressure maxSteps cannot be negative"),
            expect.stringContaining(
                "error:enemyManager.spawnPressure.cooldownReductionPerStep:spawnPressure cooldownReductionPerStep must be between 0 and 0.9"
            ),
            expect.stringContaining("error:enemyManager.spawnPressure.levelBonusPerStep:spawnPressure levelBonusPerStep cannot be negative")
        ])
    );
});

test("ContentValidator reports invalid rarity, slot and crit stat ranges", () => {
    const settings = createSettings();
    settings.materials[0].rarity = "mythic";
    settings.itemCategories[0].slot = "backpack";
    settings.equippableItems[0].rarity = "artifact";
    settings.equippableItems[0].stats.critChance = 1.5;
    settings.equippableItems[0].stats.critMult = 0.5;
    settings.skills[0].statBonusPerRank.critChance = -0.2;
    settings.skills[0].statBonusPerRank.critMult = 0.4;
    settings.zones[0].exits = [createExit("zone_main_arena")];
    settings.zones[0].exits[0].direction = "upward";

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('error:materials[0].rarity:Unknown material rarity "mythic"'),
            expect.stringContaining('error:itemCategories[0].slot:Unknown equipment slot "backpack"'),
            expect.stringContaining('error:equippableItems[0].rarity:Unknown item rarity "artifact"'),
            expect.stringContaining("error:equippableItems[0].stats.critChance:critChance must be between 0 and 1"),
            expect.stringContaining("error:equippableItems[0].stats.critMult:critMult must be at least 1"),
            expect.stringContaining("error:skills[0].statBonusPerRank.critChance:critChance must be between 0 and 1"),
            expect.stringContaining("error:skills[0].statBonusPerRank.critMult:critMult must be at least 1"),
            expect.stringContaining('error:zones[0].exits[0].direction:Unknown exit direction "upward"')
        ])
    );
});

test("ContentValidator reports missing or malformed content metadata timestamps", () => {
    const settings = createSettings();
    settings.zones[0].createdAt = "";
    settings.zones[0].lastUpdated = "not-a-date";
    settings.materials[0].lastUpdated = "";
    settings.itemCategories[0].lastUpdated = "2026-06-23";
    settings.equippableItems[0].lastUpdated = "yesterday";
    settings.skills[0].lastUpdated = "";
    settings.enemyManager.enemies[0].lastUpdated = "";
    settings.enemyManager.zoneEnemySpawns[0].lastUpdated = "";

    const issues = ContentValidator.validate(settings);

    expect(summarize(issues)).toEqual(
        expect.arrayContaining([
            "error:zones[0].createdAt:createdAt must be an ISO 8601 timestamp",
            "error:zones[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp",
            "error:materials[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp",
            "error:itemCategories[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp",
            "error:equippableItems[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp",
            "error:skills[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp",
            "error:enemyManager.enemies[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp",
            "error:enemyManager.zoneEnemySpawns[0].lastUpdated:lastUpdated must be an ISO 8601 timestamp"
        ])
    );
});
