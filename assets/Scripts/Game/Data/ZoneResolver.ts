import { GameSettings, ZoneSettings } from "./GameSettings";
import { UserData } from "./UserData";

export class ZoneResolver {
    public static resolveCurrentZone(settings: GameSettings, userData: UserData): ZoneSettings {
        const configuredZones = settings.zones ?? [];
        if (configuredZones.length === 0) {
            throw new Error("No zones configured in GameSettings.");
        }

        const accessibleZones = this.resolveAccessibleZones(configuredZones, userData);
        for (const zone of accessibleZones) {
            if (!userData.game.unlockedZones.includes(zone.zoneId)) {
                userData.game.unlockedZones.push(zone.zoneId);
            }
        }

        const selectedZone = accessibleZones.find((zone) => zone.zoneId === userData.game.currentZoneId);
        const fallbackZone = accessibleZones.sort((left, right) => left.requiredLevel - right.requiredLevel).at(-1) ?? configuredZones[0];
        userData.game.currentZoneId = (selectedZone ?? fallbackZone).zoneId;

        return selectedZone ?? fallbackZone;
    }

    private static resolveAccessibleZones(configuredZones: ZoneSettings[], userData: UserData): ZoneSettings[] {
        if (!configuredZones.some((zone) => 0 < zone.exits.length)) {
            return configuredZones.filter((zone) => this.isZoneAccessible(zone, userData));
        }

        const zonesById = new Map(configuredZones.map((zone) => [zone.zoneId, zone]));
        const accessibleZoneIds = new Set<string>();
        const queue: ZoneSettings[] = [];
        const seedZoneIds = new Set<string>([configuredZones[0]?.zoneId, userData.game.currentZoneId, ...userData.game.unlockedZones].filter(Boolean));

        seedZoneIds.forEach((zoneId) => {
            const zone = zonesById.get(zoneId);
            if (!zone || !this.isZoneAccessible(zone, userData) || accessibleZoneIds.has(zone.zoneId)) return;

            accessibleZoneIds.add(zone.zoneId);
            queue.push(zone);
        });

        while (0 < queue.length) {
            const zone = queue.shift();
            for (const exit of zone.exits) {
                const targetZone = zonesById.get(exit.targetZoneId);
                if (!targetZone || accessibleZoneIds.has(targetZone.zoneId)) continue;
                if (!targetZone.isUnlocked) continue;

                const requiredLevel = Math.max(0, exit.minLevel || targetZone.requiredLevel);
                if (userData.game.level < requiredLevel) continue;

                accessibleZoneIds.add(targetZone.zoneId);
                queue.push(targetZone);
            }
        }

        return configuredZones.filter((zone) => accessibleZoneIds.has(zone.zoneId));
    }

    private static isZoneAccessible(zone: ZoneSettings, userData: UserData): boolean {
        return zone.isUnlocked && userData.game.level >= zone.requiredLevel;
    }
}
