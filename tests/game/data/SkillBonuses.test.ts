import { GameSettings, SkillSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { SkillBonusResolver } from "../../../assets/Scripts/Game/Data/SkillBonuses";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createSkill(skillId: string, upgradeType: UpgradeType, bonuses: Partial<SkillSettings["statBonusPerRank"]>): SkillSettings {
    const skill = new SkillSettings();
    skill.skillId = skillId;
    skill.upgradeType = upgradeType;
    skill.type = "passive";
    skill.maxRank = 5;
    Object.assign(skill.statBonusPerRank, bonuses);
    return skill;
}

test("SkillBonusResolver sums configured statBonusPerRank values from saved ranks", () => {
    const settings = new GameSettings();
    settings.skills = [
        createSkill("combat_mastery_1", UpgradeType.WeaponDamage, { atk: 2, goldBonus: 0.1 }),
        createSkill("survival_training_1", UpgradeType.Regeneration, { hp: 5, speed: 0.2, idleRate: 0.25 })
    ];

    const userData = new UserData();
    userData.game.skillTree["combat_mastery_1"] = { rank: 3, unlockedAt: "2026-06-19T10:00:00.000Z" };
    userData.game.skillTree["survival_training_1"] = { rank: 2, unlockedAt: "2026-06-19T11:00:00.000Z" };

    const bonuses = SkillBonusResolver.resolve(settings, userData);

    expect(bonuses.atk).toBe(6);
    expect(bonuses.goldBonus).toBeCloseTo(0.3);
    expect(bonuses.hp).toBe(10);
    expect(bonuses.speed).toBeCloseTo(0.4);
    expect(bonuses.idleRate).toBeCloseTo(0.5);
});
