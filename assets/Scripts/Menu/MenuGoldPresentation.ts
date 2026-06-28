export class MenuGoldPresentation {
    public static format(gold: number): string {
        const value = Math.max(0, Math.floor(gold || 0));
        if (value < 1000) return value.toString();

        if (value >= 1_000_000_000) return this.formatCompact(value, 1_000_000_000, "B");
        if (value >= 1_000_000) return this.formatCompact(value, 1_000_000, "M");
        return this.formatCompact(value, 1000, "K");
    }

    private static formatCompact(value: number, divisor: number, suffix: string): string {
        const compact = Math.round((value / divisor) * 10) / 10;
        return `${compact.toFixed(1)}${suffix}`;
    }
}
