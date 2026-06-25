import { EnemySettings } from "./GameSettings";

type EnemyTier = "early" | "mid" | "late" | "endgame";

interface TierProfile {
    goldMultiplier: number;
    xpMultiplier: number;
    healthMultiplier: number;
    damageMultiplier: number;
    speedMultiplier: number;
}

const EARLY_IDS = new Set(["BasicEnemy", "BasicEnemySkeleton", "CircleEnemyBat", "CircleEnemy", "WaveEnemy"]);
const MID_IDS = new Set([
    "StandardEnemy",
    "FastEnemy",
    "TreasureEnemy",
    "WaveEnemyArmor",
    "WaveEnemyArmorFast",
    "BasicBoss",
    "Hunter",
    "BasicCheetah",
    "CircleEnemyStandard"
]);
const LATE_IDS = new Set([
    "ToughEnemy",
    "HardEnemy",
    "HarderEnemy",
    "SpeedEnemy",
    "TankEnemy",
    "SiegeEnemyMelee",
    "SiegeEnemyRanged",
    "SkeletonRanger",
    "HunterMage",
    "BatEnemy",
    "CircleEnemyTough",
    "CircleEnemySkelePrison",
    "CircleEnemyDark",
    "WaveEnemyArmorMarch",
    "WaveEnemyArmorBlitz",
    "WaveEnemyDeath",
    "StandardBoss",
    "HardBoss",
    "HarderBoss",
    "StandardCheetah"
]);

const TIER_PROFILES: Record<EnemyTier, TierProfile> = {
    early: { goldMultiplier: 1, xpMultiplier: 1, healthMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1 },
    mid: { goldMultiplier: 1.5, xpMultiplier: 1.5, healthMultiplier: 1.5, damageMultiplier: 1.25, speedMultiplier: 1.05 },
    late: { goldMultiplier: 2.5, xpMultiplier: 2.5, healthMultiplier: 1.8, damageMultiplier: 1.5, speedMultiplier: 1.07 },
    endgame: { goldMultiplier: 1.5, xpMultiplier: 2, healthMultiplier: 1.625, damageMultiplier: 1.5, speedMultiplier: 1.1667 }
};

export class DefaultEnemyProgression {
    public static normalize(enemies: EnemySettings[]): EnemySettings[] {
        return enemies.map((enemy) => {
            const normalized = new EnemySettings();
            Object.assign(normalized, enemy);

            const profile = TIER_PROFILES[this.resolveTier(enemy.id)];
            normalized.goldReward = this.roundReward(enemy.goldReward * profile.goldMultiplier);
            normalized.xpReward = this.roundReward(enemy.xpReward * profile.xpMultiplier);
            normalized.health = Math.max(1, Math.round(enemy.health * profile.healthMultiplier));
            normalized.damage = Math.max(1, this.roundReward(enemy.damage * profile.damageMultiplier));
            normalized.speed = Math.max(1, Math.round(enemy.speed * profile.speedMultiplier));

            return normalized;
        });
    }

    public static resolveTier(enemyId: string): EnemyTier {
        if (EARLY_IDS.has(enemyId)) return "early";
        if (MID_IDS.has(enemyId)) return "mid";
        if (LATE_IDS.has(enemyId)) return "late";
        return "endgame";
    }

    private static roundReward(value: number): number {
        return Math.round(value * 100) / 100;
    }
}
