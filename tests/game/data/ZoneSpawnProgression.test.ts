import { ZoneSpawnProgression } from "../../../assets/Scripts/Game/Data/ZoneSpawnProgression";
import { ZoneEnemySpawnSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";

function createZone(zoneId: string, requiredLevel: number): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.requiredLevel = requiredLevel;
    zone.isUnlocked = true;
    return zone;
}

function createSpawn(spawnId: string, zoneId: string): ZoneEnemySpawnSettings {
    const spawn = new ZoneEnemySpawnSettings();
    spawn.spawnId = spawnId;
    spawn.zoneId = zoneId;
    spawn.enemyId = "BasicEnemy";
    spawn.minLevel = 1;
    spawn.maxLevel = 999;
    return spawn;
}

test("ZoneSpawnProgression aligns spawn level ranges to zone thresholds", () => {
    const zones = [
        createZone("zone_main_arena", 1),
        createZone("zone_shadow_forest", 3),
        createZone("zone_crystal_caves", 6),
        createZone("zone_ancient_ruins", 10)
    ];
    const spawns = [
        createSpawn("spawn_main", "zone_main_arena"),
        createSpawn("spawn_shadow", "zone_shadow_forest"),
        createSpawn("spawn_crystal", "zone_crystal_caves"),
        createSpawn("spawn_ruins", "zone_ancient_ruins")
    ];

    const normalized = ZoneSpawnProgression.normalize(spawns, zones);

    expect(normalized.map((spawn) => ({ id: spawn.spawnId, min: spawn.minLevel, max: spawn.maxLevel }))).toEqual([
        { id: "spawn_main", min: 1, max: 2 },
        { id: "spawn_shadow", min: 3, max: 5 },
        { id: "spawn_crystal", min: 6, max: 9 },
        { id: "spawn_ruins", min: 10, max: 999 }
    ]);
});

test("ZoneSpawnProgression leaves manual ranges intact when they are already narrower", () => {
    const zones = [createZone("zone_main_arena", 1), createZone("zone_shadow_forest", 3)];
    const spawn = createSpawn("spawn_manual", "zone_shadow_forest");
    spawn.minLevel = 4;
    spawn.maxLevel = 4;

    const normalized = ZoneSpawnProgression.normalize([spawn], zones);

    expect(normalized[0].minLevel).toBe(4);
    expect(normalized[0].maxLevel).toBe(4);
});
