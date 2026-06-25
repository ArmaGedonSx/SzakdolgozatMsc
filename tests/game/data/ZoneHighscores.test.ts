import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { ZoneHighscores } from "../../../assets/Scripts/Game/Data/ZoneHighscores";

test("ZoneHighscores records the best score for a zone", () => {
    const userData = new UserData();

    ZoneHighscores.applyRunScore(userData, "zone_shadow_forest", 120);

    expect(userData.game.zoneHighscores.zone_shadow_forest).toBe(120);
});

test("ZoneHighscores keeps the better existing score", () => {
    const userData = new UserData();
    userData.game.zoneHighscores.zone_shadow_forest = 180;

    ZoneHighscores.applyRunScore(userData, "zone_shadow_forest", 120);

    expect(userData.game.zoneHighscores.zone_shadow_forest).toBe(180);
});

test("ZoneHighscores ignores missing zones or non-positive scores", () => {
    const userData = new UserData();

    ZoneHighscores.applyRunScore(userData, "", 120);
    ZoneHighscores.applyRunScore(userData, "zone_shadow_forest", 0);

    expect(userData.game.zoneHighscores).toEqual({});
});
