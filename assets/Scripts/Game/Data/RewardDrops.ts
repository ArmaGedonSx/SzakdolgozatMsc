export class RewardDropResolver {
    public static resolveDropCount(reward: number, random: () => number): number {
        if (!Number.isFinite(reward) || reward <= 0) return 0;

        const guaranteedDrops = Math.floor(reward);
        const extraDropChance = reward - guaranteedDrops;
        return guaranteedDrops + (random() < extraDropChance ? 1 : 0);
    }
}
