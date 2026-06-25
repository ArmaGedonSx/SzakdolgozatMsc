export interface ZoneBackgroundSetData<TPrefab> {
    zoneId: string;
    backgroundPrefabs: TPrefab[];
}

export class ZoneBackgroundResolver {
    public static resolve<TPrefab>(
        defaultPrefabs: TPrefab[],
        zoneSets: ZoneBackgroundSetData<TPrefab>[],
        zoneId: string
    ): TPrefab[] {
        const zoneSet = zoneSets.find((candidate) => candidate.zoneId === zoneId);
        if (zoneSet && 0 < zoneSet.backgroundPrefabs.length) return zoneSet.backgroundPrefabs;

        return defaultPrefabs;
    }
}
