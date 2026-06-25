import { DefaultSkillContent } from "../../../assets/Scripts/Game/Data/DefaultSkillContent";
import { SkillSettings, UpgradeSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createLegacyUpgradeSettings(): UpgradeSettings {
    const settings = new UpgradeSettings();
    settings.maxWeaponLengthUpgrades = 2;
    settings.maxWeaponDamageUpgrades = 3;
    settings.maxHorizontalProjectileUpgrades = 1;
    settings.maxDiagonalProjectileUpgrades = 4;
    settings.maxHaloProjectileUpgrades = 5;
    settings.maxRegenerationUpgrades = 6;
    return settings;
}

function createSkill(skillId: string, upgradeType: UpgradeType, maxRank: number): SkillSettings {
    const skill = new SkillSettings();
    skill.skillId = skillId;
    skill.upgradeType = upgradeType;
    skill.name = `${skillId} name`;
    skill.description = `${skillId} description`;
    skill.type = "passive";
    skill.maxRank = maxRank;
    return skill;
}

test("DefaultSkillContent creates runtime skills from legacy upgrade limits", () => {
    const skills = DefaultSkillContent.normalize([], createLegacyUpgradeSettings());

    expect(skills.map((skill) => ({ type: skill.upgradeType, maxRank: skill.maxRank }))).toEqual([
        { type: UpgradeType.WeaponLength, maxRank: 2 },
        { type: UpgradeType.WeaponDamage, maxRank: 3 },
        { type: UpgradeType.HorizontalProjectile, maxRank: 1 },
        { type: UpgradeType.DiagonalProjectile, maxRank: 4 },
        { type: UpgradeType.HaloProjectlie, maxRank: 5 },
        { type: UpgradeType.Regeneration, maxRank: 6 }
    ]);
});

test("DefaultSkillContent keeps explicit skills instead of overwriting them from legacy settings", () => {
    const explicitSkills = [createSkill("custom_weapon_length", UpgradeType.WeaponLength, 9)];
    explicitSkills[0].statBonusPerRank.atk = 2;
    explicitSkills[0].statBonusPerRank.idleRate = 0.25;

    const skills = DefaultSkillContent.normalize(explicitSkills, createLegacyUpgradeSettings());

    expect(skills).toHaveLength(1);
    expect(skills[0].skillId).toBe("custom_weapon_length");
    expect(skills[0].maxRank).toBe(9);
    expect(skills[0].statBonusPerRank.atk).toBe(2);
    expect(skills[0].statBonusPerRank.idleRate).toBe(0.25);
});

test("DefaultSkillContent fills missing stat bonus objects on explicit skills", () => {
    const explicitSkills = [createSkill("custom_weapon_damage", UpgradeType.WeaponDamage, 4)];
    explicitSkills[0].statBonusPerRank = undefined as never;

    const skills = DefaultSkillContent.normalize(explicitSkills, createLegacyUpgradeSettings());

    expect(skills[0].statBonusPerRank).toEqual(expect.objectContaining({
        atk: 0,
        def: 0,
        hp: 0,
        speed: 0,
        critChance: 0,
        critMult: 1,
        goldBonus: 0,
        xpBonus: 0,
        idleRate: 0
    }));
});
