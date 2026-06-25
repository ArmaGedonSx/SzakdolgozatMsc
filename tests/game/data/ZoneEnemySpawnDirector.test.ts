import { ZoneEnemySpawnDirector } from "../../../assets/Scripts/Game/Data/ZoneEnemySpawnDirector";
import { ZoneEnemySpawnSettings } from "../../../assets/Scripts/Game/Data/GameSettings";

function createSpawn(
    spawnId: string,
    enemyId: string,
    zoneId: string,
    spawnInterval: number,
    weight: number,
    maxAlive: number,
    minLevel = 1,
    maxLevel = 999,
    spawnPattern: "individual" | "circular" | "wave" = "individual",
    groupSize = 1
): ZoneEnemySpawnSettings {
    const spawn = new ZoneEnemySpawnSettings();
    spawn.spawnId = spawnId;
    spawn.enemyId = enemyId;
    spawn.zoneId = zoneId;
    spawn.spawnInterval = spawnInterval;
    spawn.weight = weight;
    spawn.maxAlive = maxAlive;
    spawn.minLevel = minLevel;
    spawn.maxLevel = maxLevel;
    spawn.spawnPattern = spawnPattern;
    spawn.groupSize = groupSize;
    return spawn;
}

test("ZoneEnemySpawnDirector chooses among ready spawns by weight in the active zone", () => {
    const spawnedEnemyIds: string[] = [];
    const director = new ZoneEnemySpawnDirector<object>(
        [
            createSpawn("spawn_basic", "BasicEnemy", "zone_main_arena", 1000, 1, 3),
            createSpawn("spawn_standard", "StandardEnemy", "zone_main_arena", 1000, 3, 3),
            createSpawn("spawn_other_zone", "OtherEnemy", "zone_other", 1000, 10, 3)
        ],
        "zone_main_arena",
        5,
        false,
        (spawn) => {
            spawnedEnemyIds.push(spawn.enemyId);
            return [{ enemyId: spawn.enemyId }];
        }
    );
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.8);

    director.gameTick(1);

    expect(spawnedEnemyIds).toEqual(["StandardEnemy"]);
    randomSpy.mockRestore();
});

test("ZoneEnemySpawnDirector respects maxAlive until an enemy is removed", () => {
    const spawnedHandles: object[] = [];
    const director = new ZoneEnemySpawnDirector<object>(
        [createSpawn("spawn_basic", "BasicEnemy", "zone_main_arena", 1000, 1, 1)],
        "zone_main_arena",
        5,
        false,
        () => {
            const handle = {};
            spawnedHandles.push(handle);
            return [handle];
        }
    );

    director.gameTick(1);
    director.gameTick(1);

    expect(spawnedHandles).toHaveLength(1);

    director.onEnemyRemoved(spawnedHandles[0]);
    director.gameTick(1);

    expect(spawnedHandles).toHaveLength(2);
});

test("ZoneEnemySpawnDirector ignores spawns outside the player level range", () => {
    const spawnedEnemyIds: string[] = [];
    const director = new ZoneEnemySpawnDirector<object>(
        [
            createSpawn("spawn_locked", "HardEnemy", "zone_main_arena", 1000, 5, 2, 10, 99),
            createSpawn("spawn_open", "BasicEnemy", "zone_main_arena", 1000, 1, 2, 1, 9)
        ],
        "zone_main_arena",
        5,
        false,
        (spawn) => {
            spawnedEnemyIds.push(spawn.enemyId);
            return [{ enemyId: spawn.enemyId }];
        }
    );

    director.gameTick(1);

    expect(spawnedEnemyIds).toEqual(["BasicEnemy"]);
});

test("ZoneEnemySpawnDirector tracks grouped pattern spawns against maxAlive", () => {
    const spawnedHandles: object[] = [];
    const director = new ZoneEnemySpawnDirector<object>(
        [createSpawn("spawn_circle", "CircleEnemy", "zone_main_arena", 1000, 1, 3, 1, 999, "circular", 3)],
        "zone_main_arena",
        5,
        false,
        () => {
            const handles = [{}, {}, {}];
            spawnedHandles.push(...handles);
            return handles;
        }
    );

    director.gameTick(1);
    director.gameTick(1);

    expect(spawnedHandles).toHaveLength(3);

    director.onEnemyRemoved(spawnedHandles[0]);
    director.onEnemyRemoved(spawnedHandles[1]);
    director.onEnemyRemoved(spawnedHandles[2]);
    director.gameTick(1);

    expect(spawnedHandles).toHaveLength(6);
});

test("ZoneEnemySpawnDirector resolves a concrete enemy level inside the spawn range", () => {
    const spawnedLevels: number[] = [];
    const director = new ZoneEnemySpawnDirector<object>(
        [createSpawn("spawn_scaled", "ScaledEnemy", "zone_main_arena", 1000, 1, 1, 3, 6)],
        "zone_main_arena",
        5,
        false,
        (spawn) => {
            spawnedLevels.push(spawn.level);
            return [{}];
        }
    );
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.75);

    director.gameTick(1);

    expect(spawnedLevels).toEqual([6]);
    randomSpy.mockRestore();
});

test("ZoneEnemySpawnDirector increases spawn pressure over elapsed run time", () => {
    const spawnedLevels: number[] = [];
    const spawn = createSpawn("spawn_pressure", "PressureEnemy", "zone_main_arena", 1000, 1, 10, 1, 3);
    const director = new ZoneEnemySpawnDirector<object>(
        [spawn],
        "zone_main_arena",
        3,
        false,
        (selectedSpawn) => {
            spawnedLevels.push(selectedSpawn.level);
            return [{}];
        },
        {
            enabled: true,
            rampStartSeconds: 10,
            secondsPerStep: 10,
            maxSteps: 2,
            cooldownReductionPerStep: 0.25,
            levelBonusPerStep: 1
        }
    );
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    director.gameTick(1);
    director.gameTick(0.5);
    director.gameTick(0.5);
    director.gameTick(20);
    director.gameTick(0.5);

    expect(spawnedLevels).toEqual([1, 1, 3, 3]);
    randomSpy.mockRestore();
});

test("ZoneEnemySpawnDirector triggers timed milestone spawns once", () => {
    const spawnedEnemyIds: string[] = [];
    const bossSpawn = createSpawn("spawn_boss", "BasicBoss", "zone_main_arena", 100000, 1, 1, 2, 2);
    bossSpawn.milestoneTimeSeconds = 26;
    const director = new ZoneEnemySpawnDirector<object>(
        [bossSpawn],
        "zone_main_arena",
        2,
        false,
        (spawn) => {
            spawnedEnemyIds.push(spawn.enemyId);
            return [{}];
        }
    );

    director.gameTick(25.9);
    director.gameTick(0.1);
    director.gameTick(30);

    expect(spawnedEnemyIds).toEqual(["BasicBoss"]);
});
