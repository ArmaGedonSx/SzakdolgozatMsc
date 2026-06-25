import { ZoneEnemySpawnSettings, ZoneSettings } from "./GameSettings";

export class ZoneSpawnProgression {
    public static normalize(spawns: ZoneEnemySpawnSettings[], zones: ZoneSettings[]): ZoneEnemySpawnSettings[] {
        const sortedZones = [...zones].sort((left, right) => left.requiredLevel - right.requiredLevel);

        return spawns.map((spawn) => {
            const zone = sortedZones.find((candidate) => candidate.zoneId === spawn.zoneId);
            if (!zone) return spawn;

            const nextZone = sortedZones.find((candidate) => zone.requiredLevel < candidate.requiredLevel);
            const recommendedMin = zone.requiredLevel;
            const recommendedMax = nextZone ? nextZone.requiredLevel - 1 : 999;

            const normalized = new ZoneEnemySpawnSettings();
            Object.assign(normalized, spawn);

            if (spawn.minLevel <= recommendedMin) {
                normalized.minLevel = recommendedMin;
            }

            if (recommendedMax < spawn.maxLevel) {
                normalized.maxLevel = recommendedMax;
            }

            return normalized;
        });
    }
}
