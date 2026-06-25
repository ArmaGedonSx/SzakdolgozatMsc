import { SkillSettings } from "../Data/GameSettings";
import { SkillChoiceSettings } from "../Data/SkillChoiceSettings";
import { PlayerSkillTreeData, UserData } from "../Data/UserData";
import { WeightedChoiceDraft } from "../Data/WeightedChoiceDraft";
import { Player } from "../Unit/Player/Player";
import { HaloProjectileLauncher } from "../Projectile/ProjectileLauncher/HaloProjectileLauncher";
import { WaveProjectileLauncher } from "../Projectile/ProjectileLauncher/WaveProjectileLauncher";
import { UpgradeType } from "./UpgradeType";

export class Upgrader {
    private typeToAction: Map<UpgradeType, () => void> = new Map<UpgradeType, () => void>();
    private typeToSkill: Map<UpgradeType, SkillSettings> = new Map<UpgradeType, SkillSettings>();
    private typeToLevel: Map<UpgradeType, number> = new Map<UpgradeType, number>();
    private typeToMaxLevel: Map<UpgradeType, number> = new Map<UpgradeType, number>();
    private static readonly DEFAULT_CHOICE_COUNT = 3;

    public constructor(
        private player: Player,
        private horizontalProjectileLauncher: WaveProjectileLauncher,
        private haloProjectileLauncher: HaloProjectileLauncher,
        private diagonalProjectileLauncher: WaveProjectileLauncher,
        skills: SkillSettings[],
        private skillTree?: PlayerSkillTreeData,
        private userData?: UserData
    ) {
        this.setTypeMaps(UpgradeType.WeaponLength, this.upgradeWeaponLength.bind(this), skills);
        this.setTypeMaps(UpgradeType.WeaponDamage, this.upgradeWeaponDamage.bind(this), skills);
        this.setTypeMaps(UpgradeType.HorizontalProjectile, this.upgradeHorizontalProjectileLauncher.bind(this), skills);
        this.setTypeMaps(UpgradeType.DiagonalProjectile, this.upgradeDiagonalProjectileLauncher.bind(this), skills);
        this.setTypeMaps(UpgradeType.HaloProjectlie, this.upgradeHaloProjectileLauncher.bind(this), skills);
        this.setTypeMaps(UpgradeType.Regeneration, this.upgradeRegeneration.bind(this), skills);
    }

    public upgradeSkill(type: UpgradeType): void {
        if (!this.typeToAction.has(type)) throw new Error("Upgrade does not have " + type);
        if (this.isMaxLevel(type)) throw new Error("Upgrade is already at max level " + type);

        const skill = this.typeToSkill.get(type);
        if (!skill) throw new Error("Upgrade does not have skill config " + type);
        if (!this.canAffordGold(skill)) throw new Error("Not enough gold");
        if (!this.hasRequiredMaterials(skill)) throw new Error("Not enough materials");

        this.typeToAction.get(type)();
        this.paySkillCost(skill);
        const level: number = this.typeToLevel.get(type);
        const nextLevel = level + 1;
        this.typeToLevel.set(type, nextLevel);
        this.syncSkillTree(type, nextLevel);
    }

    public getAvailableUpgrades(): SkillChoiceSettings[] {
        const availableUpgrades: SkillChoiceSettings[] = [];
        for (const key of this.typeToAction.keys()) {
            const skill = this.typeToSkill.get(key);
            if (!this.isMaxLevel(key) && skill && this.canAffordGold(skill) && this.hasRequiredMaterials(skill)) {
                availableUpgrades.push(this.createChoice(skill));
            }
        }

        return availableUpgrades;
    }

    public getUpgradeChoices(choiceCount = Upgrader.DEFAULT_CHOICE_COUNT): SkillChoiceSettings[] {
        return WeightedChoiceDraft.selectWithoutReplacement(
            this.getAvailableUpgrades(),
            choiceCount,
            (skill) => skill.choiceWeight
        );
    }

    private setTypeMaps(upgradeType: UpgradeType, action: () => void, skills: SkillSettings[]): void {
        const skill = skills.find((candidate) => candidate.upgradeType === upgradeType);
        if (!skill) return;

        this.typeToAction.set(upgradeType, action);
        this.typeToSkill.set(upgradeType, skill);
        const initialLevel = Math.max(0, Math.min(skill.maxRank, this.skillTree?.[skill.skillId]?.rank ?? 0));
        this.typeToLevel.set(upgradeType, initialLevel);
        this.typeToMaxLevel.set(upgradeType, skill.maxRank);

        for (let i = 0; i < initialLevel; i++) {
            action();
        }
        if (0 < initialLevel) this.syncSkillTree(upgradeType, initialLevel);
    }

    private upgradeWeaponLength(): void {
        this.player.Weapon.upgradeWeaponLength();
    }

    private upgradeWeaponDamage(): void {
        this.player.Weapon.upgradeWeaponDamage();
    }

    private upgradeHorizontalProjectileLauncher(): void {
        this.horizontalProjectileLauncher.upgrade();
    }

    private upgradeDiagonalProjectileLauncher(): void {
        this.diagonalProjectileLauncher.upgrade();
    }

    private upgradeHaloProjectileLauncher(): void {
        this.haloProjectileLauncher.upgrade();
    }

    private upgradeRegeneration(): void {
        this.player.Regeneration.upgrade();
    }

    private isMaxLevel(type: UpgradeType): boolean {
        return this.typeToMaxLevel.get(type) <= this.typeToLevel.get(type);
    }

    private canAffordGold(skill: SkillSettings): boolean {
        if (!this.userData) return true;
        return skill.goldCoinCost <= this.userData.game.goldCoins;
    }

    private paySkillCost(skill: SkillSettings): void {
        if (!this.userData) return;

        if (0 < skill.goldCoinCost) {
            this.userData.game.goldCoins = Math.max(0, this.userData.game.goldCoins - skill.goldCoinCost);
            this.userData.game.gold = this.userData.game.goldCoins;
        }

        for (const [materialId, cost] of Object.entries(skill.materialCosts ?? {})) {
            if (cost <= 0) continue;

            this.userData.game.materials[materialId] = Math.max(0, (this.userData.game.materials[materialId] ?? 0) - cost);
        }
    }

    private hasRequiredMaterials(skill: SkillSettings): boolean {
        for (const [materialId, cost] of Object.entries(skill.materialCosts ?? {})) {
            if ((this.userData.game.materials[materialId] ?? 0) < cost) {
                return false;
            }
        }

        return true;
    }

    private syncSkillTree(type: UpgradeType, rank: number): void {
        if (!this.skillTree) return;

        const skill = this.typeToSkill.get(type);
        if (!skill) return;

        const current = this.skillTree[skill.skillId] ?? { rank: 0, unlockedAt: "" };
        current.rank = rank;
        if (!current.unlockedAt && 0 < rank) {
            current.unlockedAt = new Date().toISOString();
        }
        this.skillTree[skill.skillId] = current;
    }

    private createChoice(skill: SkillSettings): SkillChoiceSettings {
        const choice = new SkillChoiceSettings();
        Object.assign(choice, skill);
        const currentRank = this.typeToLevel.get(skill.upgradeType) ?? 0;
        choice.currentRank = currentRank;
        choice.nextRank = Math.min(skill.maxRank, currentRank + 1);
        return choice;
    }
}
