import * as fs from "fs";
import * as path from "path";

type ZoneEnemySpawn = {
    spawnId: string;
    zoneId: string;
    enemyId: string;
    minLevel: number;
    maxLevel: number;
    maxAlive: number;
    spawnInterval: number;
    milestoneTimeSeconds?: number;
    idleOnly?: boolean;
    groupSize: number;
    spawnRegion?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
};

const settingsPath = path.resolve(__dirname, "../../../assets/Data/GameSettings.json");
const enemySpawnsPath = path.resolve(__dirname, "../../../assets/Data/EnemySpawns.json");
const enemiesPath = path.resolve(__dirname, "../../../assets/Data/Enemies.json");
const itemsPath = path.resolve(__dirname, "../../../assets/Data/Items.json");
const skillsPath = path.resolve(__dirname, "../../../assets/Data/Skills.json");
const zonesPath = path.resolve(__dirname, "../../../assets/Data/Zones.json");

function loadSettings(): {
    zones: {
        zoneId: string;
        targetSurvivalSeconds: number;
        clearRewardGold: number;
    }[];
    equippableItems: {
        itemId: string;
        categoryId: string;
        rarity: string;
        dropZones: string[];
    }[];
    enemyManager: {
        enemies: {
            id: string;
            chestRewardChance: number;
        }[];
        individualEnemySpawners: unknown[];
        circularEnemySpawners: unknown[];
        waveEnemySpawners: unknown[];
        zoneEnemySpawns: ZoneEnemySpawn[];
    };
} {
    return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
}

function loadZones(): {
    zoneId: string;
    targetSurvivalSeconds: number;
    clearRewardGold: number;
}[] {
    return JSON.parse(fs.readFileSync(zonesPath, "utf8"));
}

function loadEnemySpawns(): {
    individualEnemySpawners: unknown[];
    circularEnemySpawners: unknown[];
    waveEnemySpawners: unknown[];
    zoneEnemySpawns: ZoneEnemySpawn[];
} {
    return JSON.parse(fs.readFileSync(enemySpawnsPath, "utf8"));
}

function normalizeSpawn(spawn: ZoneEnemySpawn): ZoneEnemySpawn {
    return {
        ...spawn,
        milestoneTimeSeconds: spawn.milestoneTimeSeconds ?? 0,
        spawnRegion: spawn.spawnRegion ?? { x: 0, y: 0, w: 0, h: 0 }
    };
}

test("GameSettings uses curated zone spawns instead of duplicated legacy spawners", () => {
    const settings = loadSettings();
    const enemyManager = settings.enemyManager;

    expect(enemyManager.individualEnemySpawners).toHaveLength(0);
    expect(enemyManager.circularEnemySpawners).toHaveLength(0);
    expect(enemyManager.waveEnemySpawners).toHaveLength(0);
    expect(enemyManager.zoneEnemySpawns).toHaveLength(18);
});

test("zones define survivor-style stage clear targets", () => {
    const settings = loadSettings();
    const zones = loadZones();

    expect(zones.map((zone) => [zone.zoneId, zone.targetSurvivalSeconds])).toEqual([
        ["zone_main_arena", 120],
        ["zone_shadow_forest", 180],
        ["zone_crystal_caves", 240],
        ["zone_ancient_ruins", 300]
    ]);
    expect(settings.zones.map((zone) => [zone.zoneId, zone.targetSurvivalSeconds])).toEqual(
        zones.map((zone) => [zone.zoneId, zone.targetSurvivalSeconds])
    );
});

test("zones define one-time stage clear gold rewards", () => {
    const settings = loadSettings();
    const zones = loadZones();

    expect(zones.map((zone) => [zone.zoneId, zone.clearRewardGold])).toEqual([
        ["zone_main_arena", 25],
        ["zone_shadow_forest", 50],
        ["zone_crystal_caves", 85],
        ["zone_ancient_ruins", 125]
    ]);
    expect(settings.zones.map((zone) => [zone.zoneId, zone.clearRewardGold])).toEqual(
        zones.map((zone) => [zone.zoneId, zone.clearRewardGold])
    );
});

test("EnemySpawns domain source matches the curated runtime spawn table", () => {
    const settings = loadSettings();
    const enemySpawns = loadEnemySpawns();

    expect(enemySpawns.individualEnemySpawners).toHaveLength(0);
    expect(enemySpawns.circularEnemySpawners).toHaveLength(0);
    expect(enemySpawns.waveEnemySpawners).toHaveLength(0);
    expect(enemySpawns.zoneEnemySpawns.map(normalizeSpawn)).toEqual(settings.enemyManager.zoneEnemySpawns.map(normalizeSpawn));
});

test("GameSettings keeps the starting zone spawn budget readable", () => {
    const settings = loadSettings();
    const startingSpawns = settings.enemyManager.zoneEnemySpawns.filter(
        (spawn) => spawn.zoneId === "zone_main_arena" && spawn.minLevel <= 1 && 1 <= spawn.maxLevel && !spawn.idleOnly
    );

    expect(startingSpawns).toHaveLength(2);
    expect(Math.min(...startingSpawns.map((spawn) => spawn.spawnInterval))).toBeGreaterThanOrEqual(2200);
    expect(startingSpawns.reduce((sum, spawn) => sum + spawn.maxAlive, 0)).toBeLessThanOrEqual(22);
});

test("GameSettings does not spawn grouped waves above their alive cap", () => {
    const settings = loadSettings();

    for (const spawn of settings.enemyManager.zoneEnemySpawns) {
        expect(spawn.groupSize).toBeLessThanOrEqual(spawn.maxAlive);
    }
});

test("domain data keeps crit multipliers valid before regeneration", () => {
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf8")) as { stats: { critMult: number } }[];
    const skills = JSON.parse(fs.readFileSync(skillsPath, "utf8")) as { statBonusPerRank: { critMult: number } }[];

    for (const item of items) {
        expect(item.stats.critMult).toBeGreaterThanOrEqual(1);
    }
    for (const skill of skills) {
        expect(skill.statBonusPerRank.critMult).toBeGreaterThanOrEqual(1);
    }
});

test("GameSettings keeps a diversified multi-zone item pool", () => {
    const settings = loadSettings();
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf8")) as {
        itemId: string;
        categoryId: string;
        rarity: string;
        dropZones: string[];
    }[];
    const runtimeItemIds = new Set(settings.equippableItems.map((item) => item.itemId));

    expect(items).toHaveLength(14);
    expect(settings.equippableItems).toHaveLength(14);
    expect(new Set(items.map((item) => item.categoryId)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(items.map((item) => item.rarity))).toEqual(new Set(["common", "uncommon", "rare", "epic"]));
    expect(items.some((item) => item.dropZones.includes("zone_main_arena"))).toBe(true);
    expect(items.some((item) => item.dropZones.includes("zone_shadow_forest"))).toBe(true);
    expect(items.some((item) => item.dropZones.includes("zone_crystal_caves"))).toBe(true);
    expect(items.some((item) => item.dropZones.includes("zone_ancient_ruins"))).toBe(true);
    for (const item of items) {
        expect(runtimeItemIds.has(item.itemId)).toBe(true);
    }
});

test("boss enemies create survivor-style chest reward moments", () => {
    const settings = loadSettings();
    const enemiesDomain = JSON.parse(fs.readFileSync(enemiesPath, "utf8")) as { enemies: { id: string; chestRewardChance: number }[] };
    const runtimeBosses = settings.enemyManager.enemies.filter((enemy: { id: string }) => enemy.id.includes("Boss"));
    const domainBosses = enemiesDomain.enemies.filter((enemy) => enemy.id.includes("Boss"));

    for (const boss of [...runtimeBosses, ...domainBosses]) {
        const expectedChance = boss.id === "FinalBoss" ? 1 : 0.35;
        expect(boss.chestRewardChance).toBeGreaterThanOrEqual(expectedChance);
    }
});

test("boss spawns are scheduled as survivor-style timed milestones", () => {
    const settings = loadSettings();
    const enemySpawns = loadEnemySpawns();
    const runtimeBossSpawns = settings.enemyManager.zoneEnemySpawns.filter((spawn) => spawn.enemyId.includes("Boss"));
    const domainBossSpawns = enemySpawns.zoneEnemySpawns.filter((spawn) => spawn.enemyId.includes("Boss"));

    expect(runtimeBossSpawns.map((spawn) => [spawn.spawnId, spawn.milestoneTimeSeconds])).toEqual([
        ["main_basic_boss_intro", 30],
        ["forest_standard_boss", 60],
        ["caves_hard_boss", 90],
        ["ruins_final_boss", 120]
    ]);
    expect(domainBossSpawns.map((spawn) => [spawn.spawnId, spawn.milestoneTimeSeconds])).toEqual(
        runtimeBossSpawns.map((spawn) => [spawn.spawnId, spawn.milestoneTimeSeconds])
    );
});

test("horde wave spawns are scheduled as survivor-style timed milestones", () => {
    const settings = loadSettings();
    const enemySpawns = loadEnemySpawns();
    const runtimeHordeSpawns = settings.enemyManager.zoneEnemySpawns.filter(
        (spawn) => !spawn.enemyId.includes("Boss") && 0 < (spawn.milestoneTimeSeconds ?? 0)
    );
    const domainHordeSpawns = enemySpawns.zoneEnemySpawns.filter(
        (spawn) => !spawn.enemyId.includes("Boss") && 0 < (spawn.milestoneTimeSeconds ?? 0)
    );

    expect(runtimeHordeSpawns.map((spawn) => [spawn.spawnId, spawn.milestoneTimeSeconds])).toEqual([
        ["main_small_circle", 20],
        ["forest_circle_standard", 45],
        ["caves_wave_armor", 70],
        ["ruins_end_wave", 95]
    ]);
    expect(domainHordeSpawns.map((spawn) => [spawn.spawnId, spawn.milestoneTimeSeconds])).toEqual(
        runtimeHordeSpawns.map((spawn) => [spawn.spawnId, spawn.milestoneTimeSeconds])
    );
});
