import { EnemySettings } from "./GameSettings";

export interface ResolvedEnemyStats {
    health: number;
    damage: number;
    speed: number;
    aggroRange: number;
    attackRange: number;
    attackCooldown: number;
    xpReward: number;
    goldReward: number;
    graphicsType: string;
}

export class EnemyRuntimeStats {
    public static resolve(settings: EnemySettings, level: number): ResolvedEnemyStats {
        const normalizedLevel = Math.max(1, Math.floor(level || 1));
        const usesScaledSchema = 0 < settings.baseHp || 0 < settings.baseAtk || 0 < settings.baseSpeed;

        if (!usesScaledSchema) {
            return {
                health: settings.health,
                damage: settings.damage,
                speed: settings.speed,
                aggroRange: settings.aggroRange,
                attackRange: settings.attackRange,
                attackCooldown: settings.attackCooldown,
                xpReward: settings.xpReward,
                goldReward: settings.goldReward,
                graphicsType: settings.graphicsType || settings.spriteAsset
            };
        }

        const hpScaling = settings.hpScaling || 1;
        const atkScaling = settings.atkScaling || 1;
        const rewardScaling = settings.rewardScaling || 1;

        return {
            health: Math.max(1, Math.round(settings.baseHp * Math.pow(hpScaling, normalizedLevel - 1))),
            damage: this.round2(Math.max(1, settings.baseAtk * Math.pow(atkScaling, normalizedLevel - 1))),
            speed: settings.baseSpeed,
            aggroRange: settings.aggroRange,
            attackRange: settings.attackRange,
            attackCooldown: settings.attackCooldown,
            xpReward: this.round2(settings.xpReward * Math.pow(rewardScaling, normalizedLevel - 1)),
            goldReward: this.round2(settings.goldReward * Math.pow(rewardScaling, normalizedLevel - 1)),
            graphicsType: settings.spriteAsset || settings.graphicsType
        };
    }

    private static round2(value: number): number {
        return Math.round(value * 100) / 100;
    }
}
