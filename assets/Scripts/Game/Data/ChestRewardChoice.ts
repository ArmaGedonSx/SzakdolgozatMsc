import { SkillChoiceSettings } from "./SkillChoiceSettings";

export class ChestRewardChoice {
    public static chooseRandomUpgrade(choices: SkillChoiceSettings[], randomSource: () => number): SkillChoiceSettings | null {
        if (choices.length === 0) return null;

        const randomValue = Math.max(0, Math.min(0.999999, randomSource()));
        const index = Math.floor(randomValue * choices.length);
        return choices[index];
    }
}
