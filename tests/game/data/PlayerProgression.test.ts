import { PlayerProgression } from "../../../assets/Scripts/Game/Data/PlayerProgression";
import { GameSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.player.requiredXP = [10, 20, 30];
    return settings;
}

test("PlayerProgression normalizes saved level and xp against the settings", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.level = 1;
    userData.game.xp = 35;
    userData.game.xpToNext = 999;

    PlayerProgression.normalize(settings, userData);

    expect(userData.game.level).toBe(3);
    expect(userData.game.xp).toBe(5);
    expect(userData.game.xpToNext).toBe(30);
});

test("PlayerProgression writes runtime progression back to the save data", () => {
    const settings = createSettings();
    const userData = new UserData();
    const runtimeLevel = PlayerProgression.createRuntimeLevel(settings, userData, 1);

    runtimeLevel.addXp(12);
    PlayerProgression.syncFromRuntime(userData, runtimeLevel);

    expect(userData.game.level).toBe(2);
    expect(userData.game.xp).toBe(2);
    expect(userData.game.xpToNext).toBe(20);
});
