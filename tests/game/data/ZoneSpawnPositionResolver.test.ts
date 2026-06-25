import { ZoneEnemySpawnSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { ZoneSpawnPositionResolver } from "../../../assets/Scripts/Game/Data/ZoneSpawnPositionResolver";

function createSpawn(pattern: "individual" | "circular" | "wave" = "individual", groupSize = 1): ZoneEnemySpawnSettings {
    const spawn = new ZoneEnemySpawnSettings();
    spawn.spawnPattern = pattern;
    spawn.groupSize = groupSize;
    return spawn;
}

test("ZoneSpawnPositionResolver keeps legacy random-edge behavior when no spawnRegion is configured", () => {
    const spawn = createSpawn("individual");
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    const position = ZoneSpawnPositionResolver.resolveIndividualSpawn(spawn);

    expect(position).toEqual({ x: 450, y: 450 });
    randomSpy.mockRestore();
});

test("ZoneSpawnPositionResolver uses spawnRegion bounds for individual spawns", () => {
    const spawn = createSpawn("individual");
    spawn.spawnRegion.x = 10;
    spawn.spawnRegion.y = 20;
    spawn.spawnRegion.w = 100;
    spawn.spawnRegion.h = 50;
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    const position = ZoneSpawnPositionResolver.resolveIndividualSpawn(spawn);

    expect(position).toEqual({ x: 60, y: 45 });
    randomSpy.mockRestore();
});

test("ZoneSpawnPositionResolver fits circular spawns inside the configured region", () => {
    const spawn = createSpawn("circular", 4);
    spawn.spawnRegion.x = 0;
    spawn.spawnRegion.y = 0;
    spawn.spawnRegion.w = 200;
    spawn.spawnRegion.h = 100;

    const positions = ZoneSpawnPositionResolver.resolveCircularSpawns(spawn);

    expect(positions).toEqual([
        { x: 100, y: 100 },
        { x: 200, y: 50 },
        { x: 100.00000000000001, y: 0 },
        { x: 0, y: 49.99999999999999 }
    ]);
});

test("ZoneSpawnPositionResolver distributes wave spawns across the configured region grid", () => {
    const spawn = createSpawn("wave", 4);
    spawn.spawnRegion.x = 10;
    spawn.spawnRegion.y = 20;
    spawn.spawnRegion.w = 90;
    spawn.spawnRegion.h = 60;

    const positions = ZoneSpawnPositionResolver.resolveWaveSpawns(spawn);

    expect(positions).toEqual([
        { x: 10, y: 20 },
        { x: 100, y: 20 },
        { x: 10, y: 80 },
        { x: 100, y: 80 }
    ]);
});
