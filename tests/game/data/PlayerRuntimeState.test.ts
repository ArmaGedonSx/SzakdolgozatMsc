import { GameSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { PlayerRuntimeState } from "../../../assets/Scripts/Game/Data/PlayerRuntimeState";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";

test("PlayerRuntimeState normalizes legacy gold alias and clamps hp values", () => {
    const settings = new GameSettings();
    settings.player.defaultHP = 50;
    const userData = new UserData();
    userData.game.gold = 27;
    userData.game.goldCoins = 0;
    userData.game.maxHp = 120;
    userData.game.hp = 180;

    PlayerRuntimeState.normalize(settings, userData);

    expect(userData.game.goldCoins).toBe(27);
    expect(userData.game.gold).toBe(27);
    expect(userData.game.maxHp).toBe(120);
    expect(userData.game.hp).toBe(120);
});

test("PlayerRuntimeState syncs runtime hp and position back into save data", () => {
    const userData = new UserData();
    const player = {
        Health: {
            HealthPoints: 34,
            MaxHealthPoints: 89
        },
        node: {
            worldPosition: {
                x: 123,
                y: -45
            }
        }
    } as any;

    PlayerRuntimeState.syncFromRuntime(userData, player);

    expect(userData.game.hp).toBe(34);
    expect(userData.game.maxHp).toBe(89);
    expect(userData.game.posX).toBe(123);
    expect(userData.game.posY).toBe(-45);
});

test("PlayerRuntimeState applies saved position back onto the runtime player", () => {
    const userData = new UserData();
    userData.game.posX = 77;
    userData.game.posY = -13;

    const player = {
        node: {
            setWorldPosition: jest.fn()
        }
    } as any;

    PlayerRuntimeState.applySavedPosition(userData, player);

    expect(player.node.setWorldPosition).toHaveBeenCalledWith(77, -13, 0);
});
