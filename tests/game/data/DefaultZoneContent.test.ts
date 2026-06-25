import { DefaultZoneContent } from "../../../assets/Scripts/Game/Data/DefaultZoneContent";

test("DefaultZoneContent provides a chained multi-zone scaffold", () => {
    const zones = DefaultZoneContent.createDefaultZones();

    expect(zones.map((zone) => zone.zoneId)).toEqual([
        "zone_main_arena",
        "zone_shadow_forest",
        "zone_crystal_caves",
        "zone_ancient_ruins"
    ]);
    expect(zones.map((zone) => zone.requiredLevel)).toEqual([1, 3, 6, 10]);
    expect(zones[0].exits[0].targetZoneId).toBe("zone_shadow_forest");
    expect(zones[1].exits[0].targetZoneId).toBe("zone_crystal_caves");
    expect(zones[2].exits[0].targetZoneId).toBe("zone_ancient_ruins");
});

test("DefaultZoneContent maps legacy spawn timing bands to zone ids", () => {
    expect(DefaultZoneContent.resolveLegacyZoneId(0)).toBe("zone_main_arena");
    expect(DefaultZoneContent.resolveLegacyZoneId(220)).toBe("zone_shadow_forest");
    expect(DefaultZoneContent.resolveLegacyZoneId(650)).toBe("zone_crystal_caves");
    expect(DefaultZoneContent.resolveLegacyZoneId(980)).toBe("zone_ancient_ruins");
});
