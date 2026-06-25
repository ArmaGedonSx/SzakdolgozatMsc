import { GameSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { PlayerProfilePresentation } from "../../../assets/Scripts/Menu/PlayerProfilePresentation";

function createZone(zoneId: string, name: string): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.name = name;
    zone.targetSurvivalSeconds = 120;
    return zone;
}

test("PlayerProfilePresentation summarizes the current player progress for the menu", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", "Main Arena"),
        createZone("zone_shadow_forest", "Shadow Forest")
    ];
    const userData = new UserData();
    userData.game.level = 4;
    userData.game.xp = 12;
    userData.game.xpToNext = 30;
    userData.game.currentZoneId = "zone_shadow_forest";
    userData.game.highscore = 125.7;
    userData.game.zoneHighscores.zone_shadow_forest = 92;
    userData.game.clearedZones = ["zone_main_arena"];
    userData.game.lastRunSummary = "Shadow Forest: 125s | Lv. 4 | Kills: 24 | Chests: 2 | Gold: 3";

    const summary = PlayerProfilePresentation.build(settings, userData);

    expect(summary).toBe(
        "Level: 4 | XP: 12/30 | Zone: Shadow Forest | Stages: 1/2 cleared | Current best: 92/120s (76%)\nLast run: Shadow Forest: 125s | Lv. 4 | Kills: 24 | Chests: 2 | Gold: 3"
    );
});

test("PlayerProfilePresentation falls back cleanly for missing zone names", () => {
    const settings = new GameSettings();
    const userData = new UserData();
    userData.game.level = 0;
    userData.game.xp = -5;
    userData.game.xpToNext = -1;
    userData.game.currentZoneId = "zone_missing";
    userData.game.highscore = -10;

    const summary = PlayerProfilePresentation.build(settings, userData);

    expect(summary).toBe("Level: 1 | XP: 0/0 | Zone: zone_missing | Stages: 0/0 cleared | Current best: 0s");
});
