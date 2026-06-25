import { ZoneBackgroundResolver, ZoneBackgroundSetData } from "../../../assets/Scripts/Game/Data/ZoneBackgroundResolver";

test("ZoneBackgroundResolver returns the matching zone prefab set", () => {
    const defaultPrefabs = ["default-a", "default-b"];
    const zoneSets: ZoneBackgroundSetData<string>[] = [
        { zoneId: "zone_main_arena", backgroundPrefabs: ["main-a"] },
        { zoneId: "zone_shadow_forest", backgroundPrefabs: ["forest-a", "forest-b"] }
    ];

    const resolved = ZoneBackgroundResolver.resolve(defaultPrefabs, zoneSets, "zone_shadow_forest");

    expect(resolved).toEqual(["forest-a", "forest-b"]);
});

test("ZoneBackgroundResolver falls back to default prefabs when the zone has no configured set", () => {
    const defaultPrefabs = ["default-a", "default-b"];
    const zoneSets: ZoneBackgroundSetData<string>[] = [{ zoneId: "zone_shadow_forest", backgroundPrefabs: ["forest-a"] }];

    const resolved = ZoneBackgroundResolver.resolve(defaultPrefabs, zoneSets, "zone_crystal_caves");

    expect(resolved).toEqual(defaultPrefabs);
});

test("ZoneBackgroundResolver ignores empty zone sets", () => {
    const defaultPrefabs = ["default-a"];
    const zoneSets: ZoneBackgroundSetData<string>[] = [{ zoneId: "zone_shadow_forest", backgroundPrefabs: [] }];

    const resolved = ZoneBackgroundResolver.resolve(defaultPrefabs, zoneSets, "zone_shadow_forest");

    expect(resolved).toEqual(defaultPrefabs);
});
