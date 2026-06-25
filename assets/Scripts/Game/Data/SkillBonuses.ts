import { DefaultSkillContent } from "./DefaultSkillContent";
import { GameSettings, SkillSettings, SkillStatBonusSettings } from "./GameSettings";
import { UserData } from "./UserData";

export class SkillBonuses {
    public atk = 0;
    public def = 0;
    public hp = 0;
    public speed = 0;
    public critChance = 0;
    public critMult = 1;
    public goldBonus = 0;
    public xpBonus = 0;
    public idleRate = 0;
}

export class SkillBonusResolver {
    public static resolve(settings: GameSettings, userData: UserData): SkillBonuses {
        const bonuses = new SkillBonuses();
        const normalizedSkills = DefaultSkillContent.normalize(settings.skills ?? [], settings.upgrades);

        for (const skill of normalizedSkills) {
            const rank = Math.max(0, Math.min(skill.maxRank, userData.game.skillTree?.[skill.skillId]?.rank ?? 0));
            if (rank <= 0) continue;

            this.addRankedBonus(bonuses, skill, rank);
        }

        return bonuses;
    }

    private static addRankedBonus(bonuses: SkillBonuses, skill: SkillSettings, rank: number): void {
        const stats: SkillStatBonusSettings = skill.statBonusPerRank ?? new SkillStatBonusSettings();
        bonuses.atk += stats.atk * rank;
        bonuses.def += stats.def * rank;
        bonuses.hp += stats.hp * rank;
        bonuses.speed += stats.speed * rank;
        bonuses.critChance += stats.critChance * rank;
        bonuses.critMult *= Math.pow(stats.critMult, rank);
        bonuses.goldBonus += stats.goldBonus * rank;
        bonuses.xpBonus += stats.xpBonus * rank;
        bonuses.idleRate += stats.idleRate * rank;
    }
}
