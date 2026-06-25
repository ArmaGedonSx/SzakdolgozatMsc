export class AttackResolver {
    public static resolveOutgoingDamage(baseDamage: number, critChance: number, critMult: number): number {
        const normalizedDamage = Math.max(0, baseDamage);
        const normalizedCritChance = Math.max(0, critChance);
        const normalizedCritMult = Math.max(1, critMult || 1);

        if (Math.random() < normalizedCritChance) {
            return Math.round(normalizedDamage * normalizedCritMult);
        }

        return normalizedDamage;
    }
}
