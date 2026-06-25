import { SkillChoiceSettings } from "../../../assets/Scripts/Game/Data/SkillChoiceSettings";
import { ChestRewardChoice } from "../../../assets/Scripts/Game/Data/ChestRewardChoice";
import { UpgradeType } from "../../../assets/Scripts/Game/Upgrades/UpgradeType";

function createChoice(upgradeType: UpgradeType): SkillChoiceSettings {
    const choice = new SkillChoiceSettings();
    choice.upgradeType = upgradeType;
    return choice;
}

test("ChestRewardChoice can choose the last available upgrade", () => {
    const choices = [
        createChoice(UpgradeType.WeaponLength),
        createChoice(UpgradeType.WeaponDamage),
        createChoice(UpgradeType.Regeneration)
    ];

    expect(ChestRewardChoice.chooseRandomUpgrade(choices, () => 0.999).upgradeType).toBe(UpgradeType.Regeneration);
});

test("ChestRewardChoice returns null when there are no upgrade choices", () => {
    expect(ChestRewardChoice.chooseRandomUpgrade([], () => 0)).toBeNull();
});
