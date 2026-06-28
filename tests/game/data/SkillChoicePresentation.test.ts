import { SkillChoicePresentation } from "../../../assets/Scripts/Game/Data/SkillChoicePresentation";
import { SkillChoiceSettings } from "../../../assets/Scripts/Game/Data/SkillChoiceSettings";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createChoice(): SkillChoiceSettings {
    const choice = new SkillChoiceSettings();
    choice.skillId = "combat_weapon_damage_1";
    choice.upgradeType = UpgradeType.WeaponDamage;
    choice.name = "Weapon Damage";
    choice.description = "Increase melee damage.";
    choice.maxRank = 10;
    choice.currentRank = 1;
    choice.nextRank = 2;
    return choice;
}

test("SkillChoicePresentation includes next rank in the title", () => {
    const presentation = SkillChoicePresentation.build(createChoice());

    expect(presentation.title).toBe("Weapon Damage\nLv 2/10");
});

test("SkillChoicePresentation appends progress to the description", () => {
    const presentation = SkillChoicePresentation.build(createChoice());

    expect(presentation.description).toBe("Boost melee damage\nRank 1/10");
});

test("SkillChoicePresentation appends a compact cost line when the skill has costs", () => {
    const choice = createChoice();
    choice.goldCoinCost = 5;
    choice.materialCosts = {
        mat_common_ore: 2,
        mat_rare_essence: 1
    };

    const presentation = SkillChoicePresentation.build(choice);

    expect(presentation.description).toBe(
        "Boost melee damage\nRank 1/10\nCost: 5 gold, Common Ore x2, Rare Essence x1"
    );
});

test("SkillChoicePresentation omits zero material costs from the cost line", () => {
    const choice = createChoice();
    choice.materialCosts = {
        mat_common_ore: 0,
        mat_uncommon_crystal: 3
    };

    const presentation = SkillChoicePresentation.build(choice);

    expect(presentation.description).toBe("Boost melee damage\nRank 1/10\nCost: Uncommon Crystal x3");
});
