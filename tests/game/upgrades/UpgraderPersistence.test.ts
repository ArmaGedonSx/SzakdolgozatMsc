import { DefaultSkillContent } from "../../../assets/Scripts/Game/Data/DefaultSkillContent";
import { GameSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { Upgrader } from "../../../assets/Scripts/Game/Upgrades/Upgrader";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.upgrades.maxWeaponLengthUpgrades = 2;
    settings.upgrades.maxWeaponDamageUpgrades = 1;
    settings.upgrades.maxHorizontalProjectileUpgrades = 1;
    settings.upgrades.maxDiagonalProjectileUpgrades = 1;
    settings.upgrades.maxHaloProjectileUpgrades = 1;
    settings.upgrades.maxRegenerationUpgrades = 1;
    settings.skills = DefaultSkillContent.normalize([], settings.upgrades);
    return settings;
}

function createPlayerMock() {
    return {
        Weapon: {
            upgradeWeaponLength: jest.fn(),
            upgradeWeaponDamage: jest.fn()
        },
        Regeneration: {
            upgrade: jest.fn()
        }
    } as any;
}

function createWaveLauncherMock() {
    return {
        upgrade: jest.fn()
    } as any;
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-19T14:00:00.000Z"));
});

afterEach(() => {
    jest.useRealTimers();
});

test("Upgrader replays saved skill ranks on startup and hides maxed skills", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.skillTree["combat_weapon_length_1"] = {
        rank: 2,
        unlockedAt: "2026-06-19T10:00:00.000Z"
    };

    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();

    const upgrader = new Upgrader(player, horizontal, halo, diagonal, settings.skills, userData.game.skillTree);

    expect(player.Weapon.upgradeWeaponLength).toHaveBeenCalledTimes(2);
    expect(upgrader.getAvailableUpgrades().map((skill) => skill.upgradeType)).not.toContain(UpgradeType.WeaponLength);
});

test("Upgrader writes new ranks and unlockedAt back into skillTree", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.goldCoins = 6;
    userData.game.gold = 6;
    const skill = settings.skills.find((candidate) => candidate.skillId === "combat_weapon_damage_1");
    skill.goldCoinCost = 4;

    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();

    const upgrader = new Upgrader(player, horizontal, halo, diagonal, settings.skills, userData.game.skillTree, userData);
    upgrader.upgradeSkill(UpgradeType.WeaponDamage);

    expect(userData.game.skillTree["combat_weapon_damage_1"].rank).toBe(1);
    expect(userData.game.skillTree["combat_weapon_damage_1"].unlockedAt).toBe("2026-06-19T14:00:00.000Z");
    expect(userData.game.goldCoins).toBe(2);
    expect(userData.game.gold).toBe(2);
    expect(player.Weapon.upgradeWeaponDamage).toHaveBeenCalledTimes(1);
});

test("Upgrader rejects upgrades when the player cannot afford the skill cost", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.goldCoins = 1;
    userData.game.gold = 1;
    const skill = settings.skills.find((candidate) => candidate.skillId === "combat_weapon_damage_1");
    skill.goldCoinCost = 3;

    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();

    const upgrader = new Upgrader(player, horizontal, halo, diagonal, settings.skills, userData.game.skillTree, userData);

    expect(() => upgrader.upgradeSkill(UpgradeType.WeaponDamage)).toThrow("Not enough gold");
    expect(userData.game.goldCoins).toBe(1);
    expect(userData.game.skillTree["combat_weapon_damage_1"]).toBeUndefined();
    expect(player.Weapon.upgradeWeaponDamage).not.toHaveBeenCalled();
});

test("Upgrader spends required materials when upgrading a skill", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.goldCoins = 6;
    userData.game.gold = 6;
    userData.game.materials.mat_common_ore = 4;
    const skill = settings.skills.find((candidate) => candidate.skillId === "combat_weapon_damage_1");
    skill.goldCoinCost = 2;
    skill.materialCosts.mat_common_ore = 3;

    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();

    const upgrader = new Upgrader(player, horizontal, halo, diagonal, settings.skills, userData.game.skillTree, userData);
    upgrader.upgradeSkill(UpgradeType.WeaponDamage);

    expect(userData.game.goldCoins).toBe(4);
    expect(userData.game.materials.mat_common_ore).toBe(1);
    expect(userData.game.skillTree["combat_weapon_damage_1"].rank).toBe(1);
    expect(player.Weapon.upgradeWeaponDamage).toHaveBeenCalledTimes(1);
});

test("Upgrader rejects upgrades when the player cannot afford required materials", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.goldCoins = 6;
    userData.game.gold = 6;
    userData.game.materials.mat_common_ore = 1;
    const skill = settings.skills.find((candidate) => candidate.skillId === "combat_weapon_damage_1");
    skill.goldCoinCost = 2;
    skill.materialCosts.mat_common_ore = 3;

    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();

    const upgrader = new Upgrader(player, horizontal, halo, diagonal, settings.skills, userData.game.skillTree, userData);

    expect(() => upgrader.upgradeSkill(UpgradeType.WeaponDamage)).toThrow("Not enough materials");
    expect(userData.game.goldCoins).toBe(6);
    expect(userData.game.materials.mat_common_ore).toBe(1);
    expect(userData.game.skillTree["combat_weapon_damage_1"]).toBeUndefined();
    expect(player.Weapon.upgradeWeaponDamage).not.toHaveBeenCalled();
});
