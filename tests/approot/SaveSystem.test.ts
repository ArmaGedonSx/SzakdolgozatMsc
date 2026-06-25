const storage = new Map<string, string>();

jest.mock("cc", () => ({
    sys: {
        localStorage: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value)
        }
    }
}), { virtual: true });

import { SaveSystem } from "../../assets/Scripts/AppRoot/SaveSystem";
import { UserData } from "../../assets/Scripts/Game/Data/UserData";

beforeEach(() => {
    storage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-19T10:00:00.000Z"));
});

afterEach(() => {
    jest.useRealTimers();
});

test("SaveSystem.load backfills player profile metadata onto legacy saves", () => {
    storage.set(
        "user-dse",
        JSON.stringify({
            soundVolume: 0.5,
            game: {
                goldCoins: 12
            }
        })
    );

    const saveSystem = new SaveSystem();
    const userData = saveSystem.load();

    expect(userData.playerId).toBeTruthy();
    expect(userData.displayName).toBe("Player");
    expect(userData.createdAt).toBe("2026-06-19T10:00:00.000Z");
    expect(userData.lastUpdated).toBe("2026-06-19T10:00:00.000Z");
    expect(userData.game.lastOnline).toBe("2026-06-19T10:00:00.000Z");
    expect(userData.game.goldCoins).toBe(12);
    expect(userData.game.zoneHighscores).toEqual({});
    expect(userData.game.clearedZones).toEqual([]);
});

test("SaveSystem.save updates timestamps before persisting", () => {
    const saveSystem = new SaveSystem();
    const userData = new UserData();
    userData.playerId = "player-1";
    userData.displayName = "Chronos";
    userData.createdAt = "2026-06-18T09:00:00.000Z";
    userData.game.goldCoins = 42;

    jest.setSystemTime(new Date("2026-06-19T12:30:00.000Z"));

    saveSystem.save(userData);

    const persisted = JSON.parse(storage.get("user-dse"));
    expect(persisted.lastUpdated).toBe("2026-06-19T12:30:00.000Z");
    expect(persisted.game.lastOnline).toBe("2026-06-19T12:30:00.000Z");
    expect(persisted.createdAt).toBe("2026-06-18T09:00:00.000Z");
    expect(persisted.displayName).toBe("Chronos");
    expect(persisted.game.gold).toBe(42);
});
