import { GameSettings } from "../Game/Data/GameSettings";

export interface RunResultLike {
    zoneId: string;
    score: number;
    kills: number;
    finalLevel: number;
    chestsOpened: number;
    goldCoins: number;
    cleared?: boolean;
    targetSurvivalSeconds?: number;
    collectedMaterials: Record<string, number>;
    collectedItems: Record<string, number>;
}

export interface RunResultPresentationData {
    summary: string;
    details: string[];
    isNewZoneBest: boolean;
    isNewGlobalBest: boolean;
}

export class RunResultPresentation {
    public static build(
        settings: GameSettings,
        result: RunResultLike,
        previousZoneBest: number,
        previousGlobalBest: number
    ): RunResultPresentationData {
        const score = Math.floor(result.score);
        const zoneName = this.resolveZoneName(settings, result.zoneId);
        const isNewZoneBest = previousZoneBest < result.score;
        const isNewGlobalBest = previousGlobalBest < result.score;
        const recordSuffix = isNewGlobalBest ? " | New global best!" : isNewZoneBest ? " | New zone best!" : "";
        const targetSeconds = Math.max(0, Math.floor(result.targetSurvivalSeconds ?? 0));
        const runStatus = this.formatRunStatus(result.cleared, targetSeconds);
        const timeSummary = 0 < targetSeconds ? `${score}s/${targetSeconds}s` : `${score}s`;
        const lootSummary = this.formatLootSummary(settings, result.collectedMaterials, result.collectedItems);
        const lootSuffix = lootSummary ? ` | Loot: ${lootSummary}` : "";
        const detailPrefix = 0 < targetSeconds
            ? [runStatus.detail, `Time survived: ${score}s`, `Stage target: ${targetSeconds}s`, this.formatStageProgress(score, targetSeconds), this.formatTimeToClear(score, targetSeconds)]
            : [`Time survived: ${score}s`];

        return {
            summary: `${zoneName}${runStatus.summary}: ${timeSummary} | Lv. ${result.finalLevel} | Kills: ${result.kills} | Chests: ${result.chestsOpened} | Gold: ${result.goldCoins}${lootSuffix}${recordSuffix}`,
            details: [
                ...detailPrefix,
                `Final level: ${result.finalLevel}`,
                `Enemies defeated: ${result.kills}`,
                `Chests opened: ${result.chestsOpened}`,
                `Gold collected: ${result.goldCoins}`,
                `Zone best: ${Math.floor(Math.max(previousZoneBest, result.score))}s`,
                `Global best: ${Math.floor(Math.max(previousGlobalBest, result.score))}s`,
                `Materials: ${this.formatMaterialLoot(settings, result.collectedMaterials)}`,
                `Items: ${this.formatItemLoot(settings, result.collectedItems)}`
            ],
            isNewZoneBest,
            isNewGlobalBest
        };
    }

    private static resolveZoneName(settings: GameSettings, zoneId: string): string {
        const zone = settings.zones.find((candidate) => candidate.zoneId === zoneId);
        return zone?.name?.trim() ? zone.name : zoneId;
    }

    private static formatRunStatus(cleared: boolean | undefined, targetSeconds: number): { summary: string; detail: string } {
        if (targetSeconds <= 0) return { summary: "", detail: "" };
        if (cleared) return { summary: " cleared", detail: "Result: Stage cleared" };

        return { summary: " failed", detail: "Result: Failed" };
    }

    private static formatStageProgress(score: number, targetSeconds: number): string {
        const progressPercent = Math.min(100, Math.max(0, Math.floor((score / targetSeconds) * 100)));
        return `Stage progress: ${score}/${targetSeconds}s (${progressPercent}%)`;
    }

    private static formatTimeToClear(score: number, targetSeconds: number): string {
        const secondsRemaining = Math.max(0, targetSeconds - score);
        return secondsRemaining === 0 ? "Time to clear: Complete" : `Time to clear: ${secondsRemaining}s remaining`;
    }

    private static formatMaterialLoot(settings: GameSettings, collectedMaterials: Record<string, number>): string {
        const materialNames = new Map(settings.materials.map((material) => [material.materialId, material.name]));
        return this.formatLoot(collectedMaterials, (materialId) => materialNames.get(materialId) || materialId);
    }

    private static formatItemLoot(settings: GameSettings, collectedItems: Record<string, number>): string {
        const itemNames = new Map(settings.equippableItems.map((item) => [item.itemId, item.name]));
        return this.formatLoot(collectedItems, (itemId) => itemNames.get(itemId) || itemId);
    }

    private static formatLootSummary(settings: GameSettings, collectedMaterials: Record<string, number>, collectedItems: Record<string, number>): string {
        const materialNames = new Map(settings.materials.map((material) => [material.materialId, material.name]));
        const itemNames = new Map(settings.equippableItems.map((item) => [item.itemId, item.name]));
        const entries = [
            ...this.formatLootEntries(collectedMaterials, (materialId) => materialNames.get(materialId) || materialId),
            ...this.formatLootEntries(collectedItems, (itemId) => itemNames.get(itemId) || itemId)
        ];
        const visibleEntries = entries.slice(0, 3);
        const hiddenCount = entries.length - visibleEntries.length;
        const hiddenSuffix = 0 < hiddenCount ? ` +${hiddenCount} more` : "";

        return visibleEntries.length > 0 ? `${visibleEntries.join(", ")}${hiddenSuffix}` : "";
    }

    private static formatLoot(loot: Record<string, number>, resolveName: (id: string) => string): string {
        const entries = this.formatLootEntries(loot, resolveName);
        if (entries.length === 0) return "None";

        return entries.join(", ");
    }

    private static formatLootEntries(loot: Record<string, number>, resolveName: (id: string) => string): string[] {
        return Object.entries(loot)
            .filter(([, quantity]) => 0 < quantity)
            .map(([id, quantity]) => `${resolveName(id)} x${quantity}`);
    }
}
