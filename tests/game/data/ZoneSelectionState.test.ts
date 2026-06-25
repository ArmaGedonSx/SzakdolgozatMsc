import { GameSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { ZoneSelectionState } from "../../../assets/Scripts/Menu/ZoneSelectionState";

function createZone(zoneId: string, requiredLevel: number): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.requiredLevel = requiredLevel;
    zone.isUnlocked = true;
    return zone;
}

test("ZoneSelectionState selects an unlocked accessible zone", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_main_arena", 1), createZone("zone_shadow_forest", 3)];
    const userData = new UserData();
    userData.game.level = 4;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena", "zone_shadow_forest"];

    const selected = ZoneSelectionState.trySelectZone(settings, userData, "zone_shadow_forest");

    expect(selected).toBe(true);
    expect(userData.game.currentZoneId).toBe("zone_shadow_forest");
});

test("ZoneSelectionState rejects locked or level-gated zones", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_main_arena", 1), createZone("zone_crystal_caves", 6)];
    const userData = new UserData();
    userData.game.level = 4;
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.unlockedZones = ["zone_main_arena"];

    const selected = ZoneSelectionState.trySelectZone(settings, userData, "zone_crystal_caves");

    expect(selected).toBe(false);
    expect(userData.game.currentZoneId).toBe("zone_main_arena");
});

test("ZoneSelectionState rejects unknown zones", () => {
    const settings = new GameSettings();
    settings.zones = [createZone("zone_main_arena", 1)];
    const userData = new UserData();

    const selected = ZoneSelectionState.trySelectZone(settings, userData, "zone_missing");

    expect(selected).toBe(false);
    expect(userData.game.currentZoneId).toBe("zone_main_arena");
});
