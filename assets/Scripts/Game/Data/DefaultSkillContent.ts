import { SkillSettings, SkillStatBonusSettings, UpgradeSettings } from "./GameSettings";
import { UpgradeType } from "../Upgrades/UpgradeType";

interface LegacySkillDefinition {
    skillId: string;
    upgradeType: UpgradeType;
    name: string;
    description: string;
    maxRank: number;
}

const LEGACY_SKILL_DEFINITIONS: LegacySkillDefinition[] = [
    {
        skillId: "combat_weapon_length_1",
        upgradeType: UpgradeType.WeaponLength,
        name: "Weapon Length",
        description: "Increase melee reach.",
        maxRank: 0
    },
    {
        skillId: "combat_weapon_damage_1",
        upgradeType: UpgradeType.WeaponDamage,
        name: "Weapon Damage",
        description: "Increase melee damage.",
        maxRank: 0
    },
    {
        skillId: "combat_horizontal_projectile_1",
        upgradeType: UpgradeType.HorizontalProjectile,
        name: "Horizontal Projectile",
        description: "Unlock or improve forward projectile volleys.",
        maxRank: 0
    },
    {
        skillId: "combat_diagonal_projectile_1",
        upgradeType: UpgradeType.DiagonalProjectile,
        name: "Diagonal Projectile",
        description: "Unlock or improve diagonal projectile volleys.",
        maxRank: 0
    },
    {
        skillId: "combat_halo_projectile_1",
        upgradeType: UpgradeType.HaloProjectlie,
        name: "Halo Projectile",
        description: "Improve the rotating projectile halo.",
        maxRank: 0
    },
    {
        skillId: "support_regeneration_1",
        upgradeType: UpgradeType.Regeneration,
        name: "Regeneration",
        description: "Improve passive health regeneration.",
        maxRank: 0
    }
];

export class DefaultSkillContent {
    public static normalize(skills: SkillSettings[], upgrades: UpgradeSettings): SkillSettings[] {
        if (0 < skills.length) {
            return skills.map((skill) => {
                const normalized = new SkillSettings();
                Object.assign(normalized, skill);
                normalized.statBonusPerRank = new SkillStatBonusSettings();
                Object.assign(normalized.statBonusPerRank, skill.statBonusPerRank ?? {});
                normalized.type = skill.type ?? "passive";
                normalized.maxRank = Math.max(1, skill.maxRank ?? 1);
                normalized.goldCoinCost = Math.max(0, skill.goldCoinCost ?? 0);
                normalized.materialCosts = this.normalizeMaterialCosts(skill.materialCosts ?? {});
                normalized.choiceWeight = Math.max(0, skill.choiceWeight ?? 1);
                return normalized;
            });
        }

        return this.createDefaultSkills(upgrades);
    }

    private static createDefaultSkills(upgrades: UpgradeSettings): SkillSettings[] {
        const maxRanks = new Map<UpgradeType, number>([
            [UpgradeType.WeaponLength, upgrades.maxWeaponLengthUpgrades],
            [UpgradeType.WeaponDamage, upgrades.maxWeaponDamageUpgrades],
            [UpgradeType.HorizontalProjectile, upgrades.maxHorizontalProjectileUpgrades],
            [UpgradeType.DiagonalProjectile, upgrades.maxDiagonalProjectileUpgrades],
            [UpgradeType.HaloProjectlie, upgrades.maxHaloProjectileUpgrades],
            [UpgradeType.Regeneration, upgrades.maxRegenerationUpgrades]
        ]);

        return LEGACY_SKILL_DEFINITIONS.map((definition) => {
            const skill = new SkillSettings();
            skill.skillId = definition.skillId;
            skill.upgradeType = definition.upgradeType;
            skill.name = definition.name;
            skill.description = definition.description;
            skill.type = "passive";
            skill.maxRank = Math.max(1, maxRanks.get(definition.upgradeType) ?? 1);
            skill.goldCoinCost = 0;
            skill.materialCosts = {};
            skill.choiceWeight = 1;
            return skill;
        });
    }

    private static normalizeMaterialCosts(materialCosts: Record<string, number>): Record<string, number> {
        const normalized: Record<string, number> = {};
        for (const [materialId, cost] of Object.entries(materialCosts)) {
            normalized[materialId] = Math.max(0, cost ?? 0);
        }
        return normalized;
    }
}
