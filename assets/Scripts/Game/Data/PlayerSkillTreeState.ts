import { DefaultSkillContent } from "./DefaultSkillContent";
import { GameSettings } from "./GameSettings";
import { PlayerSkillProgressData, UserData } from "./UserData";
import { UpgradeType } from "../Upgrades/UpgradeType";

export class PlayerSkillTreeState {
    public static normalize(settings: GameSettings, userData: UserData): void {
        const normalizedSkills = DefaultSkillContent.normalize(settings.skills ?? [], settings.upgrades);
        const nextTree = new Map<string, PlayerSkillProgressData>();

        normalizedSkills.forEach((skill) => {
            const existing = userData.game.skillTree?.[skill.skillId];
            const progress = new PlayerSkillProgressData();
            progress.rank = Math.max(0, Math.min(skill.maxRank, Math.floor(existing?.rank ?? 0)));
            progress.unlockedAt = progress.rank > 0 ? existing?.unlockedAt || new Date().toISOString() : "";
            nextTree.set(skill.skillId, progress);
        });

        userData.game.skillTree = {};
        nextTree.forEach((progress, skillId) => {
            userData.game.skillTree[skillId] = progress;
        });
    }

    public static getRankForUpgradeType(settings: GameSettings, userData: UserData, upgradeType: UpgradeType): number {
        const normalizedSkills = DefaultSkillContent.normalize(settings.skills ?? [], settings.upgrades);
        const skill = normalizedSkills.find((candidate) => candidate.upgradeType === upgradeType);
        if (!skill) return 0;

        return userData.game.skillTree?.[skill.skillId]?.rank ?? 0;
    }
}
