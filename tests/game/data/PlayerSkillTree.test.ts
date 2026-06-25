import { DefaultSkillContent } from "../../../assets/Scripts/Game/Data/DefaultSkillContent";
import { GameSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { PlayerSkillTreeState } from "../../../assets/Scripts/Game/Data/PlayerSkillTreeState";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.upgrades.maxWeaponLengthUpgrades = 2;
    settings.upgrades.maxWeaponDamageUpgrades = 3;
    settings.upgrades.maxHorizontalProjectileUpgrades = 1;
    settings.upgrades.maxDiagonalProjectileUpgrades = 1;
    settings.upgrades.maxHaloProjectileUpgrades = 1;
    settings.upgrades.maxRegenerationUpgrades = 1;
    settings.skills = DefaultSkillContent.normalize([], settings.upgrades);
    return settings;
}

test("PlayerSkillTreeState seeds missing skills and clamps invalid ranks", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.skillTree["combat_weapon_length_1"] = {
        rank: 9,
        unlockedAt: ""
    };
    userData.game.skillTree["unknown_skill"] = {
        rank: 3,
        unlockedAt: "2026-06-19T08:00:00.000Z"
    };

    PlayerSkillTreeState.normalize(settings, userData);

    expect(userData.game.skillTree["combat_weapon_length_1"].rank).toBe(2);
    expect(userData.game.skillTree["combat_weapon_length_1"].unlockedAt).toBeTruthy();
    expect(userData.game.skillTree["combat_weapon_damage_1"].rank).toBe(0);
    expect(userData.game.skillTree["unknown_skill"]).toBeUndefined();
});

test("PlayerSkillTreeState can resolve saved rank by upgrade type", () => {
    const settings = createSettings();
    const userData = new UserData();
    PlayerSkillTreeState.normalize(settings, userData);
    userData.game.skillTree["combat_weapon_damage_1"].rank = 2;

    expect(PlayerSkillTreeState.getRankForUpgradeType(settings, userData, UpgradeType.WeaponDamage)).toBe(2);
    expect(PlayerSkillTreeState.getRankForUpgradeType(settings, userData, UpgradeType.Regeneration)).toBe(0);
});
