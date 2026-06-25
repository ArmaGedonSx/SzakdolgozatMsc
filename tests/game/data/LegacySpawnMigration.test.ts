import { LegacySpawnMigration } from "../../../assets/Scripts/Game/Data/LegacySpawnMigration";
import { EnemySpawnsDomainData } from "../../../assets/Scripts/Game/Data/ContentData";
import { CircularEnemySpawnerSettings, IndividualEnemySpawnerSettings, WaveEnemySpawnerSettings } from "../../../assets/Scripts/Game/Data/GameSettings";

function createIndividualSpawner(enemyId: string, startDelay: number, stopDelay: number, cooldown: number): IndividualEnemySpawnerSettings {
    const spawner = new IndividualEnemySpawnerSettings();
    spawner.common.enemyId = enemyId;
    spawner.common.startDelay = startDelay;
    spawner.common.stopDelay = stopDelay;
    spawner.common.cooldown = cooldown;
    return spawner;
}

function createCircularSpawner(enemyId: string, startDelay: number, stopDelay: number, cooldown: number, enemiesToSpawn: number): CircularEnemySpawnerSettings {
    const spawner = new CircularEnemySpawnerSettings();
    spawner.common.enemyId = enemyId;
    spawner.common.startDelay = startDelay;
    spawner.common.stopDelay = stopDelay;
    spawner.common.cooldown = cooldown;
    spawner.enemiesToSpawn = enemiesToSpawn;
    return spawner;
}

function createWaveSpawner(enemyId: string, startDelay: number, stopDelay: number, cooldown: number, enemiesToSpawn: number): WaveEnemySpawnerSettings {
    const spawner = new WaveEnemySpawnerSettings();
    spawner.common.enemyId = enemyId;
    spawner.common.startDelay = startDelay;
    spawner.common.stopDelay = stopDelay;
    spawner.common.cooldown = cooldown;
    spawner.enemiesToSpawn = enemiesToSpawn;
    return spawner;
}

test("LegacySpawnMigration creates zoneEnemySpawns from legacy individual spawners", () => {
    const source: EnemySpawnsDomainData = {
        individualEnemySpawners: [
            createIndividualSpawner("BasicEnemy", 0, 60, 1),
            createIndividualSpawner("Hunter", 980, -1, 2)
        ],
        circularEnemySpawners: [],
        waveEnemySpawners: []
    };

    const migrated = LegacySpawnMigration.withZoneEnemySpawns(source, "zone_main_arena");

    expect(migrated.zoneEnemySpawns).toEqual([
        expect.objectContaining({
            spawnId: "legacy_individual_0_basicenemy",
            zoneId: "zone_main_arena",
            enemyId: "BasicEnemy",
            spawnInterval: 1000,
            maxAlive: 50,
            minLevel: 1,
            maxLevel: 999,
            idleOnly: false,
            weight: 1
        }),
        expect.objectContaining({
            spawnId: "legacy_individual_1_hunter",
            zoneId: "zone_ancient_ruins",
            enemyId: "Hunter",
            spawnInterval: 2000,
            maxAlive: 999,
            minLevel: 1,
            maxLevel: 999,
            idleOnly: false,
            weight: 1
        })
    ]);
});

test("LegacySpawnMigration also converts circular and wave spawners with their pattern metadata", () => {
    const source: EnemySpawnsDomainData = {
        individualEnemySpawners: [],
        circularEnemySpawners: [createCircularSpawner("CircleEnemy", 0, 120, 45, 12)],
        waveEnemySpawners: [createWaveSpawner("WaveEnemy", 10, 40, 27, 5)]
    };

    const migrated = LegacySpawnMigration.withZoneEnemySpawns(source, "zone_main_arena");

    expect(migrated.zoneEnemySpawns).toEqual([
        expect.objectContaining({
            spawnId: "legacy_circular_0_circleenemy",
            enemyId: "CircleEnemy",
            spawnPattern: "circular",
            groupSize: 12,
            spawnInterval: 45000
        }),
        expect.objectContaining({
            spawnId: "legacy_wave_0_waveenemy",
            enemyId: "WaveEnemy",
            spawnPattern: "wave",
            groupSize: 5,
            spawnInterval: 27000
        })
    ]);
});

test("LegacySpawnMigration preserves existing zoneEnemySpawns", () => {
    const source: EnemySpawnsDomainData = {
        individualEnemySpawners: [createIndividualSpawner("BasicEnemy", 0, 60, 1)],
        circularEnemySpawners: [],
        waveEnemySpawners: [],
        zoneEnemySpawns: [
            {
                spawnId: "manual_spawn",
                zoneId: "zone_main_arena",
                enemyId: "StandardEnemy",
                weight: 3,
                minLevel: 2,
                maxLevel: 10,
                maxAlive: 4,
                spawnInterval: 1500,
                idleOnly: false,
                spawnRegion: {
                    x: 10,
                    y: 20,
                    w: 30,
                    h: 40
                },
                lastUpdated: "2026-06-19T15:00:00.000Z"
            }
        ]
    };

    const migrated = LegacySpawnMigration.withZoneEnemySpawns(source, "zone_main_arena");

    expect(migrated.zoneEnemySpawns?.map((spawn) => spawn.spawnId)).toEqual(
        expect.arrayContaining(["manual_spawn", "legacy_individual_0_basicenemy"])
    );
    expect(migrated.zoneEnemySpawns?.find((spawn) => spawn.spawnId === "manual_spawn")).toEqual(
        expect.objectContaining({
            spawnRegion: expect.objectContaining({
                x: 10,
                y: 20,
                w: 30,
                h: 40
            }),
            lastUpdated: "2026-06-19T15:00:00.000Z"
        })
    );
});
