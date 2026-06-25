import { GameSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { GameRunCompletion } from "../../../assets/Scripts/Menu/GameRunCompletion";

function createZone(zoneId: string, requiredLevel: number, exits: { targetZoneId: string; minLevel: number }[] = []): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.name = zoneId === "zone_shadow_forest" ? "Shadow Forest" : zoneId;
    zone.requiredLevel = requiredLevel;
    zone.isUnlocked = true;
    zone.clearRewardGold = 25;
    zone.exits = exits.map((exit) => ({ direction: "east", spawnX: 0, spawnY: 0, ...exit }));
    return zone;
}

function createResult(zoneId: string) {
    return {
        zoneId,
        score: 90,
        kills: 12,
        finalLevel: 3,
        chestsOpened: 0,
        goldCoins: 5,
        cleared: true,
        targetSurvivalSeconds: 90,
        collectedMaterials: {},
        collectedItems: {}
    };
}

function createFailedResult(zoneId: string) {
    return {
        ...createResult(zoneId),
        score: 40,
        cleared: false
    };
}

test("GameRunCompletion unlocks newly accessible zones after a level-gaining run", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", 1, [{ targetZoneId: "zone_shadow_forest", minLevel: 3 }]),
        createZone("zone_shadow_forest", 3)
    ];
    const userData = new UserData();
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];
    userData.game.level = 3;

    GameRunCompletion.apply(settings, userData, createResult("zone_main_arena"));

    expect(userData.game.unlockedZones).toContain("zone_shadow_forest");
    expect(userData.game.currentZoneId).toBe("zone_main_arena");
    expect(userData.game.lastRunSummary).toContain("Lv. 3");
    expect(userData.game.lastRunSummary).toContain("cleared");
    expect(userData.game.lastRunSummary).toContain("Unlocked: Shadow Forest");
    expect(userData.game.goldCoins).toBe(30);
    expect(userData.game.lastRunSummary).toContain("First clear reward: 25 gold");
    expect(userData.game.zoneHighscores.zone_main_arena).toBe(90);
    expect(userData.game.clearedZones).toEqual(["zone_main_arena"]);
});

test("GameRunCompletion keeps later stages locked after a failed run even when the level requirement is met", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", 1, [{ targetZoneId: "zone_shadow_forest", minLevel: 3 }]),
        createZone("zone_shadow_forest", 3)
    ];
    const userData = new UserData();
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];
    userData.game.level = 3;

    GameRunCompletion.apply(settings, userData, createFailedResult("zone_main_arena"));

    expect(userData.game.unlockedZones).toEqual(["zone_main_arena"]);
    expect(userData.game.currentZoneId).toBe("zone_main_arena");
    expect(userData.game.lastRunSummary).toContain("failed");
    expect(userData.game.lastRunSummary).not.toContain("Unlocked: Shadow Forest");
    expect(userData.game.zoneHighscores.zone_main_arena).toBe(40);
    expect(userData.game.clearedZones).toEqual([]);
    expect(userData.game.goldCoins).toBe(5);
});

test("GameRunCompletion does not grant clear gold twice for the same stage", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_main_arena", 1)];
    const userData = new UserData();
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];
    userData.game.clearedZones = ["zone_main_arena"];

    GameRunCompletion.apply(settings, userData, createResult("zone_main_arena"));

    expect(userData.game.goldCoins).toBe(5);
    expect(userData.game.lastRunSummary).not.toContain("Clear reward");
    expect(userData.game.clearedZones).toEqual(["zone_main_arena"]);
});
