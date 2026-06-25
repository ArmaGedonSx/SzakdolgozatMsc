import { GameSettings, ZoneSettings } from "../Game/Data/GameSettings";
import { UserData } from "../Game/Data/UserData";

export interface ZoneSelectionEntry {
    zoneId: string;
    name: string;
    label: string;
    subtitle: string;
    actionLabel: string;
    iconKey: string;
    iconLabel: string;
    requiredLevel: number;
    targetSurvivalSeconds: number;
    clearRewardGold: number;
    bestScore: number;
    unlockHint: string;
    isCleared: boolean;
    isCurrent: boolean;
    isUnlocked: boolean;
    isRecommended: boolean;
    isSelectable: boolean;
    tone: "current" | "recommended" | "cleared" | "available" | "locked";
    status: string;
}

export interface ZoneSelectionPresentationData {
    summary: string;
    zones: ZoneSelectionEntry[];
}

export class ZoneSelectionPresentation {
    public static build(settings: GameSettings, userData: UserData): ZoneSelectionPresentationData {
        const recommendedZoneId = this.resolveRecommendedZoneId(settings, userData);
        const zones = (settings.zones ?? []).map((zone) => this.createEntry(settings, zone, userData, recommendedZoneId));
        const currentZone = zones.find((zone) => zone.isCurrent);
        const currentZoneName = currentZone?.name ?? userData.game.currentZoneId;
        const currentBestScore = currentZone?.bestScore ?? 0;
        const currentBestSummary = this.formatBestProgress(currentBestScore, currentZone?.targetSurvivalSeconds ?? 0).replace("Best:", "Current best:");
        const unlockedCount = zones.filter((zone) => zone.isUnlocked).length;
        const clearedCount = zones.filter((zone) => zone.isCleared).length;
        const recommendedZone = zones.find((zone) => zone.isRecommended);
        const recommendedSuffix = recommendedZone ? ` | Next: ${recommendedZone.name}` : "";

        return {
            summary: `Current zone: ${currentZoneName} | Unlocked: ${unlockedCount}/${zones.length} | Cleared: ${clearedCount}/${zones.length} | ${currentBestSummary}${recommendedSuffix}`,
            zones
        };
    }

    private static createEntry(settings: GameSettings, zone: ZoneSettings, userData: UserData, recommendedZoneId: string): ZoneSelectionEntry {
        const name = zone.name?.trim() ? zone.name : zone.zoneId;
        const isCurrent = zone.zoneId === userData.game.currentZoneId;
        const isUnlocked = zone.isUnlocked && userData.game.unlockedZones.includes(zone.zoneId) && zone.requiredLevel <= userData.game.level;
        const isCleared = (userData.game.clearedZones ?? []).includes(zone.zoneId);
        const isRecommended = zone.zoneId === recommendedZoneId;
        const prerequisiteZone = this.resolvePrerequisiteZone(settings, zone.zoneId);
        const isClearGated = !isUnlocked && !!prerequisiteZone && !userData.game.unlockedZones.includes(zone.zoneId) && zone.requiredLevel <= userData.game.level;
        const status = isCurrent
            ? "Current"
            : isRecommended
              ? "Recommended"
              : isCleared
                ? "Cleared"
                : isUnlocked
                  ? "Unlocked"
                  : isClearGated
                    ? "Locked"
                    : `Locked (Level ${zone.requiredLevel})`;
        const bestScore = Math.floor(userData.game.zoneHighscores[zone.zoneId] ?? 0);
        const bestSuffix = 0 < bestScore ? ` - Best: ${bestScore}s` : "";
        const isSelectable = isUnlocked && !isCurrent;
        const tone = isCurrent ? "current" : isRecommended ? "recommended" : isCleared ? "cleared" : isUnlocked ? "available" : "locked";
        const actionLabel = isCurrent ? "Current" : isUnlocked ? (isCleared ? "Replay" : "Select") : "Locked";
        const recommendationPrefix = isRecommended ? "Recommended next | " : "";
        const targetSurvivalSeconds = Math.max(0, Math.floor(zone.targetSurvivalSeconds ?? 0));
        const clearRewardGold = Math.max(0, Math.floor(zone.clearRewardGold ?? 0));
        const goalText = 0 < targetSurvivalSeconds ? `Goal: ${targetSurvivalSeconds}s` : "";
        const rewardText = !isCleared && 0 < clearRewardGold ? `Reward: ${clearRewardGold} gold` : "";
        const unlockHint = this.resolveUnlockHint(settings, zone, userData, prerequisiteZone, goalText, rewardText, isClearGated, isUnlocked, isCleared);
        const eventHint = this.resolveEventHint(settings, zone.zoneId);
        const farmHint = this.resolveFarmHint(settings, zone.zoneId);
        const subtitle = this.buildSubtitle(recommendationPrefix, zone, bestScore, unlockHint, isUnlocked, isClearGated, goalText, rewardText, eventHint, farmHint);

        return {
            zoneId: zone.zoneId,
            name,
            label: `${name} - ${status}${bestSuffix}`,
            subtitle,
            actionLabel,
            iconKey: zone.zoneId,
            iconLabel: this.resolveIconLabel(name, zone.zoneId),
            requiredLevel: zone.requiredLevel,
            targetSurvivalSeconds,
            clearRewardGold,
            bestScore,
            unlockHint,
            isCleared,
            isCurrent,
            isUnlocked,
            isRecommended,
            isSelectable,
            tone,
            status
        };
    }

    private static resolveUnlockHint(
        settings: GameSettings,
        zone: ZoneSettings,
        userData: UserData,
        prerequisiteZone: ZoneSettings | null,
        goalText: string,
        rewardText: string,
        isClearGated: boolean,
        isUnlocked: boolean,
        isCleared: boolean
    ): string {
        const parts: string[] = [];

        if (isCleared) {
            parts.push("Cleared");
        } else if (isClearGated && prerequisiteZone) {
            parts.push(`Clear ${this.resolveZoneName(prerequisiteZone)}: ${this.formatPrerequisiteProgress(userData, prerequisiteZone)}`);
        } else if (!isUnlocked && userData.game.level < zone.requiredLevel) {
            parts.push(`Reach Level ${zone.requiredLevel}`);
        }

        if (goalText) {
            parts.push(goalText);
        }
        if (rewardText) {
            parts.push(rewardText);
        }

        return parts.join(" | ");
    }

    private static formatPrerequisiteProgress(userData: UserData, prerequisiteZone: ZoneSettings): string {
        const bestScore = Math.floor(userData.game.zoneHighscores[prerequisiteZone.zoneId] ?? 0);
        return this.formatBestProgress(bestScore, prerequisiteZone.targetSurvivalSeconds).replace("Best: ", "");
    }

    private static buildSubtitle(
        recommendationPrefix: string,
        zone: ZoneSettings,
        bestScore: number,
        unlockHint: string,
        isUnlocked: boolean,
        isClearGated: boolean,
        goalText: string,
        rewardText: string,
        eventHint: string,
        farmHint: string
    ): string {
        if (isClearGated) {
            return [`${unlockHint.split(" | ")[0]}`, `Level ${zone.requiredLevel}`, goalText, rewardText, eventHint, farmHint].filter(Boolean).join(" | ");
        }

        if (isUnlocked) {
            return [`${recommendationPrefix}Level ${zone.requiredLevel}`, goalText, rewardText, this.formatBestProgress(bestScore, zone.targetSurvivalSeconds), eventHint, farmHint]
                .filter(Boolean)
                .join(" | ");
        }

        return [unlockHint || `Reach Level ${zone.requiredLevel}`, this.formatBestProgress(bestScore, zone.targetSurvivalSeconds), eventHint, farmHint].filter(Boolean).join(" | ");
    }

    private static resolveEventHint(settings: GameSettings, zoneId: string): string {
        const events = (settings.enemyManager.zoneEnemySpawns ?? [])
            .filter((spawn) => spawn.zoneId === zoneId)
            .map((spawn) => ({
                label: this.resolveEventLabel(spawn.enemyId, spawn.spawnPattern),
                milestone: Math.floor(spawn.milestoneTimeSeconds ?? 0)
            }))
            .filter((event) => event.label && 0 < event.milestone)
            .sort((left, right) => left.milestone - right.milestone);
        const visibleEvents = events.slice(0, 2).map((event) => `${event.label} ${event.milestone}s`);
        const hiddenCount = events.length - visibleEvents.length;
        const hiddenSuffix = 0 < hiddenCount ? ` +${hiddenCount} more` : "";

        return visibleEvents.length > 0 ? `Events: ${visibleEvents.join(", ")}${hiddenSuffix}` : "";
    }

    private static resolveEventLabel(enemyId: string, spawnPattern: string): string {
        if (enemyId.includes("Boss")) return "Boss";
        if (spawnPattern === "circular" || spawnPattern === "wave") return "Horde";
        return "";
    }

    private static resolveFarmHint(settings: GameSettings, zoneId: string): string {
        const materialNames = (settings.materials ?? [])
            .filter((material) => this.isLootAvailableInZone(material.dropZones, zoneId))
            .filter((material) => 0 < material.dropWeight)
            .map((material) => material.name?.trim() ? material.name : material.materialId);
        const itemNames = (settings.equippableItems ?? [])
            .filter((item) => this.isLootAvailableInZone(item.dropZones, zoneId))
            .filter((item) => 0 < item.dropWeight)
            .map((item) => item.name?.trim() ? item.name : item.itemId);
        const names = [...materialNames, ...itemNames].filter((name) => name.trim().length > 0);
        const visibleNames = names.slice(0, 3);
        const hiddenCount = names.length - visibleNames.length;
        const hiddenSuffix = 0 < hiddenCount ? ` +${hiddenCount} more` : "";

        return visibleNames.length > 0 ? `Farm: ${visibleNames.join(", ")}${hiddenSuffix}` : "";
    }

    private static isLootAvailableInZone(dropZones: string[], zoneId: string): boolean {
        return dropZones.length === 0 || dropZones.includes(zoneId);
    }

    private static formatBestProgress(bestScore: number, targetSurvivalSeconds: number): string {
        const targetSeconds = Math.max(0, Math.floor(targetSurvivalSeconds ?? 0));
        if (targetSeconds <= 0) return `Best: ${bestScore}s`;

        const progressPercent = Math.min(100, Math.max(0, Math.floor((bestScore / targetSeconds) * 100)));
        return `Best: ${bestScore}/${targetSeconds}s (${progressPercent}%)`;
    }

    private static resolvePrerequisiteZone(settings: GameSettings, zoneId: string): ZoneSettings | null {
        return (settings.zones ?? []).find((zone) => zone.exits.some((exit) => exit.targetZoneId === zoneId)) ?? null;
    }

    private static resolveZoneName(zone: ZoneSettings): string {
        return zone.name?.trim() ? zone.name : zone.zoneId;
    }

    private static resolveRecommendedZoneId(settings: GameSettings, userData: UserData): string {
        const currentZone = (settings.zones ?? []).find((zone) => zone.zoneId === userData.game.currentZoneId);
        const currentRequiredLevel = currentZone?.requiredLevel ?? 0;
        const candidates = (settings.zones ?? [])
            .filter((zone) => zone.zoneId !== userData.game.currentZoneId)
            .filter((zone) => zone.isUnlocked && userData.game.unlockedZones.includes(zone.zoneId))
            .filter((zone) => zone.requiredLevel <= userData.game.level)
            .filter((zone) => currentRequiredLevel < zone.requiredLevel)
            .sort((left, right) => left.requiredLevel - right.requiredLevel);

        return candidates[0]?.zoneId ?? "";
    }

    private static resolveIconLabel(name: string, zoneId: string): string {
        const source = name.trim() ? name : zoneId;
        const words = source
            .replace(/_/g, " ")
            .split(" ")
            .filter((part) => part.length > 0);

        if (2 <= words.length) return `${words[0][0]}${words[1][0]}`.toUpperCase();

        return source.slice(0, 2).toUpperCase();
    }
}
