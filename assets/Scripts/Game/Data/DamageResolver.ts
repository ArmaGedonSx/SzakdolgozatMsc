export class DamageResolver {
    public static resolveIncomingDamage(baseDamage: number, defense: number): number {
        return Math.max(1, baseDamage - Math.max(0, defense));
    }
}
