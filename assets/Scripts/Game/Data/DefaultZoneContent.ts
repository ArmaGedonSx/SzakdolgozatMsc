import { ZoneExitSettings, ZoneSettings } from "./GameSettings";

export class DefaultZoneContent {
    public static createDefaultZones(): ZoneSettings[] {
        return [
            this.createZone("zone_main_arena", "Main Arena", 1, "zone_shadow_forest"),
            this.createZone("zone_shadow_forest", "Shadow Forest", 3, "zone_crystal_caves"),
            this.createZone("zone_crystal_caves", "Crystal Caves", 6, "zone_ancient_ruins"),
            this.createZone("zone_ancient_ruins", "Ancient Ruins", 10)
        ];
    }

    public static resolveLegacyZoneId(startDelay: number): string {
        if (startDelay < 200) return "zone_main_arena";
        if (startDelay < 600) return "zone_shadow_forest";
        if (startDelay < 900) return "zone_crystal_caves";
        return "zone_ancient_ruins";
    }

    private static createZone(zoneId: string, name: string, requiredLevel: number, nextZoneId?: string): ZoneSettings {
        const zone = new ZoneSettings();
        zone.zoneId = zoneId;
        zone.name = name;
        zone.requiredLevel = requiredLevel;
        zone.isUnlocked = true;
        zone.createdAt = "2026-06-19T00:00:00.000Z";
        zone.lastUpdated = "2026-06-19T00:00:00.000Z";

        if (nextZoneId) {
            const exit = new ZoneExitSettings();
            exit.direction = "east";
            exit.targetZoneId = nextZoneId;
            zone.exits = [exit];
        }

        return zone;
    }
}
