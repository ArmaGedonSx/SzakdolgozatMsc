import { GameSettings, ZoneExitSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { ZoneResolver } from "../../../assets/Scripts/Game/Data/ZoneResolver";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", 1, true),
        createZone("zone_shadow_forest", 3, true),
        createZone("zone_ancient_ruins", 5, true)
    ];
    return settings;
}

function createZone(zoneId: string, requiredLevel: number, isUnlocked: boolean): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.requiredLevel = requiredLevel;
    zone.isUnlocked = isUnlocked;
    return zone;
}

function createExit(targetZoneId: string, minLevel = 0): ZoneExitSettings {
    const exit = new ZoneExitSettings();
    exit.targetZoneId = targetZoneId;
    exit.minLevel = minLevel;
    return exit;
}

test("ZoneResolver keeps the current zone when it is accessible", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.level = 4;
    userData.game.currentZoneId = "zone_shadow_forest";
    userData.game.unlockedZones = ["zone_main_arena", "zone_shadow_forest"];

    const resolvedZone = ZoneResolver.resolveCurrentZone(settings, userData);

    expect(resolvedZone.zoneId).toBe("zone_shadow_forest");
    expect(userData.game.currentZoneId).toBe("zone_shadow_forest");
    expect(userData.game.unlockedZones).toEqual(["zone_main_arena", "zone_shadow_forest"]);
});

test("ZoneResolver moves the player to the best accessible zone and unlocks it on the player", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.level = 3;
    userData.game.currentZoneId = "zone_ancient_ruins";
    userData.game.unlockedZones = [];

    const resolvedZone = ZoneResolver.resolveCurrentZone(settings, userData);

    expect(resolvedZone.zoneId).toBe("zone_shadow_forest");
    expect(userData.game.currentZoneId).toBe("zone_shadow_forest");
    expect(userData.game.unlockedZones).toContain("zone_main_arena");
    expect(userData.game.unlockedZones).toContain("zone_shadow_forest");
});

test("ZoneResolver keeps a selected accessible zone while unlocking newly accessible zones", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.level = 5;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];

    const resolvedZone = ZoneResolver.resolveCurrentZone(settings, userData);

    expect(resolvedZone.zoneId).toBe("zone_main_arena");
    expect(userData.game.currentZoneId).toBe("zone_main_arena");
    expect(userData.game.unlockedZones).toEqual(["zone_main_arena", "zone_shadow_forest", "zone_ancient_ruins"]);
});

test("ZoneResolver uses exit minLevel to gate access to the next zone", () => {
    const settings = new GameSettings();
    const mainArena = createZone("zone_main_arena", 1, true);
    const shadowForest = createZone("zone_shadow_forest", 3, true);
    mainArena.exits = [createExit("zone_shadow_forest", 5)];
    settings.zones = [mainArena, shadowForest];

    const userData = new UserData();
    userData.game.level = 4;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];

    const resolvedZone = ZoneResolver.resolveCurrentZone(settings, userData);

    expect(resolvedZone.zoneId).toBe("zone_main_arena");
    expect(userData.game.unlockedZones).toEqual(["zone_main_arena"]);
});

test("ZoneResolver does not auto-unlock disconnected higher-level zones when exits define progression", () => {
    const settings = new GameSettings();
    const mainArena = createZone("zone_main_arena", 1, true);
    const shadowForest = createZone("zone_shadow_forest", 3, true);
    const ancientRuins = createZone("zone_ancient_ruins", 5, true);
    mainArena.exits = [createExit("zone_shadow_forest", 3)];
    shadowForest.exits = [];
    ancientRuins.exits = [];
    settings.zones = [mainArena, shadowForest, ancientRuins];

    const userData = new UserData();
    userData.game.level = 10;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];

    const resolvedZone = ZoneResolver.resolveCurrentZone(settings, userData);

    expect(resolvedZone.zoneId).toBe("zone_main_arena");
    expect(userData.game.currentZoneId).toBe("zone_main_arena");
    expect(userData.game.unlockedZones).toEqual(["zone_main_arena", "zone_shadow_forest"]);
});
