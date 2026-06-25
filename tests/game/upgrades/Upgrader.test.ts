import { SkillSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { Upgrader } from "../../../assets/Scripts/Game/Upgrades/Upgrader";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createSkill(upgradeType: UpgradeType, maxRank: number): SkillSettings {
    const skill = new SkillSettings();
    skill.skillId = upgradeType.toLowerCase();
    skill.upgradeType = upgradeType;
    skill.name = upgradeType;
    skill.description = `${upgradeType} description`;
    skill.type = "passive";
    skill.maxRank = maxRank;
    skill.goldCoinCost = 0;
    return skill;
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

test("Upgrader exposes available skills from runtime skill config and respects maxRank", () => {
    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();
    const upgrader = new Upgrader(
        player,
        horizontal,
        halo,
        diagonal,
        [createSkill(UpgradeType.WeaponLength, 1), createSkill(UpgradeType.Regeneration, 2)]
    );

    expect(upgrader.getAvailableUpgrades().map((skill) => skill.upgradeType)).toEqual([
        UpgradeType.WeaponLength,
        UpgradeType.Regeneration
    ]);

    upgrader.upgradeSkill(UpgradeType.WeaponLength);

    expect(player.Weapon.upgradeWeaponLength).toHaveBeenCalledTimes(1);
    expect(upgrader.getAvailableUpgrades().map((skill) => skill.upgradeType)).toEqual([UpgradeType.Regeneration]);
});

test("Upgrader hides unaffordable skills when a persistent wallet is present", () => {
    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();
    const userData = new UserData();
    userData.game.goldCoins = 2;
    userData.game.gold = 2;

    const affordable = createSkill(UpgradeType.WeaponLength, 1);
    affordable.goldCoinCost = 2;
    const expensive = createSkill(UpgradeType.Regeneration, 1);
    expensive.goldCoinCost = 5;

    const upgrader = new Upgrader(player, horizontal, halo, diagonal, [affordable, expensive], userData.game.skillTree, userData);

    expect(upgrader.getAvailableUpgrades().map((skill) => skill.upgradeType)).toEqual([UpgradeType.WeaponLength]);
});

test("Upgrader drafts up to three level-up choices from available skills", () => {
    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();
    const skills = [
        createSkill(UpgradeType.WeaponLength, 1),
        createSkill(UpgradeType.WeaponDamage, 1),
        createSkill(UpgradeType.HorizontalProjectile, 1),
        createSkill(UpgradeType.DiagonalProjectile, 1),
        createSkill(UpgradeType.HaloProjectlie, 1),
        createSkill(UpgradeType.Regeneration, 1)
    ];
    const upgrader = new Upgrader(player, horizontal, halo, diagonal, skills);

    const choices = upgrader.getUpgradeChoices();

    expect(choices).toHaveLength(3);
    expect(new Set(choices.map((skill) => skill.upgradeType)).size).toBe(3);
    expect(upgrader.getAvailableUpgrades()).toEqual(expect.arrayContaining(choices));
});

test("Upgrader draft excludes maxed and unaffordable choices", () => {
    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();
    const userData = new UserData();
    userData.game.goldCoins = 1;
    userData.game.gold = 1;
    const affordable = createSkill(UpgradeType.WeaponLength, 2);
    affordable.goldCoinCost = 1;
    const maxed = createSkill(UpgradeType.WeaponDamage, 1);
    maxed.goldCoinCost = 1;
    const expensive = createSkill(UpgradeType.Regeneration, 1);
    expensive.goldCoinCost = 3;
    userData.game.skillTree[maxed.skillId] = { rank: 1, unlockedAt: "2026-06-19T10:00:00.000Z" };
    const upgrader = new Upgrader(player, horizontal, halo, diagonal, [affordable, maxed, expensive], userData.game.skillTree, userData);

    expect(upgrader.getUpgradeChoices().map((skill) => skill.upgradeType)).toEqual([UpgradeType.WeaponLength]);
});

test("Upgrader drafts weighted skill choices from content data", () => {
    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();
    const lightChoice = createSkill(UpgradeType.WeaponLength, 1);
    lightChoice.choiceWeight = 1;
    const featuredChoice = createSkill(UpgradeType.WeaponDamage, 1);
    featuredChoice.choiceWeight = 3;
    const fallbackChoice = createSkill(UpgradeType.Regeneration, 1);
    fallbackChoice.choiceWeight = 1;
    const upgrader = new Upgrader(player, horizontal, halo, diagonal, [lightChoice, featuredChoice, fallbackChoice]);
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.3);

    const choices = upgrader.getUpgradeChoices(2);

    expect(choices.map((skill) => skill.upgradeType)).toEqual([UpgradeType.WeaponDamage, UpgradeType.WeaponLength]);
    randomSpy.mockRestore();
});

test("Upgrader choices include current and next rank for display", () => {
    const player = createPlayerMock();
    const horizontal = createWaveLauncherMock();
    const halo = createWaveLauncherMock();
    const diagonal = createWaveLauncherMock();
    const userData = new UserData();
    const skill = createSkill(UpgradeType.WeaponDamage, 10);
    userData.game.skillTree[skill.skillId] = { rank: 3, unlockedAt: "2026-06-19T10:00:00.000Z" };
    const upgrader = new Upgrader(player, horizontal, halo, diagonal, [skill], userData.game.skillTree, userData);

    const choices = upgrader.getUpgradeChoices(1);

    expect(choices[0].currentRank).toBe(3);
    expect(choices[0].nextRank).toBe(4);
});
