import { GameSettings, SkillSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { OfflineProgressState } from "../../../assets/Scripts/Game/Data/OfflineProgressState";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-19T12:00:00.000Z"));
});

afterEach(() => {
    jest.useRealTimers();
});

function createSettings(): GameSettings {
    const settings = new GameSettings();
    const skill = new SkillSettings();
    skill.skillId = "economy_idle_1";
    skill.upgradeType = UpgradeType.WeaponLength;
    skill.type = "passive";
    skill.maxRank = 5;
    skill.statBonusPerRank.idleRate = 0.5;
    settings.skills = [skill];
    return settings;
}

test("OfflineProgressState derives idleRate from skill bonuses and clamps invalid lastOnline", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.skillTree["economy_idle_1"] = { rank: 2, unlockedAt: "2026-06-19T10:00:00.000Z" };
    userData.game.offlineGold = -10;
    userData.game.lastOnline = "not-a-date";

    OfflineProgressState.normalize(settings, userData);

    expect(userData.game.idleRate).toBe(2);
    expect(userData.game.offlineGold).toBe(0);
    expect(userData.game.lastOnline).toBe("2026-06-19T12:00:00.000Z");
});

test("OfflineProgressState accrues offline gold from elapsed idle time", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.skillTree["economy_idle_1"] = { rank: 3, unlockedAt: "2026-06-19T10:00:00.000Z" };
    userData.game.offlineGold = 4;
    userData.game.lastOnline = "2026-06-19T11:58:00.000Z";

    OfflineProgressState.normalize(settings, userData);

    expect(userData.game.offlineGold).toBe(304);
});

test("OfflineProgressState can apply pending offline gold into the wallet", () => {
    const userData = new UserData();
    userData.game.goldCoins = 10;
    userData.game.gold = 10;
    userData.game.offlineGold = 25;

    OfflineProgressState.collect(userData);

    expect(userData.game.goldCoins).toBe(35);
    expect(userData.game.gold).toBe(35);
    expect(userData.game.offlineGold).toBe(0);
});
