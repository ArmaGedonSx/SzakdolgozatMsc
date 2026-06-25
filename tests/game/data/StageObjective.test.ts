import { GameSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { StageObjective } from "../../../assets/Scripts/Game/Data/StageObjective";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    const zone = new ZoneSettings();
    zone.zoneId = "zone_main_arena";
    zone.name = "Main Arena";
    zone.targetSurvivalSeconds = 120;
    settings.zones = [zone];
    return settings;
}

test("StageObjective resolves a zone survival target and clear state", () => {
    const settings = createSettings();

    expect(StageObjective.resolveTargetSeconds(settings, "zone_main_arena")).toBe(120);
    expect(StageObjective.isCleared(settings, "zone_main_arena", 119.9)).toBe(false);
    expect(StageObjective.isCleared(settings, "zone_main_arena", 120)).toBe(true);
});

test("StageObjective treats missing or disabled targets as endless survival", () => {
    const settings = createSettings();

    expect(StageObjective.resolveTargetSeconds(settings, "zone_missing")).toBe(0);
    expect(StageObjective.isCleared(settings, "zone_missing", 999)).toBe(false);
});
