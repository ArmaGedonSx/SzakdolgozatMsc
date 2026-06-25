import { ZoneEnemySpawnSettings } from "./GameSettings";

export interface SpawnPosition {
    x: number;
    y: number;
}

export class ZoneSpawnPositionResolver {
    public static resolveIndividualSpawn(spawn: ZoneEnemySpawnSettings): SpawnPosition {
        const region = spawn.spawnRegion;
        if (region && 0 < region.w && 0 < region.h) {
            return {
                x: region.x + Math.random() * region.w,
                y: region.y + Math.random() * region.h
            };
        }

        return {
            x: (300 + Math.random() * 300) * (Math.random() < 0.5 ? -1 : 1),
            y: (300 + Math.random() * 300) * (Math.random() < 0.5 ? -1 : 1)
        };
    }

    public static resolveCircularSpawns(spawn: ZoneEnemySpawnSettings): SpawnPosition[] {
        const groupSize = Math.max(1, spawn.groupSize);
        const region = spawn.spawnRegion;

        if (region && 0 < region.w && 0 < region.h) {
            const centerX = region.x + region.w / 2;
            const centerY = region.y + region.h / 2;
            const radiusX = region.w / 2;
            const radiusY = region.h / 2;
            const angle = (2 * Math.PI) / groupSize;

            return Array.from({ length: groupSize }, (_, index) => ({
                x: centerX + Math.sin(angle * index) * radiusX,
                y: centerY + Math.cos(angle * index) * radiusY
            }));
        }

        const angle = (2 * Math.PI) / groupSize;
        return Array.from({ length: groupSize }, (_, index) => ({
            x: Math.sin(angle * index) * 600,
            y: Math.cos(angle * index) * 600
        }));
    }

    public static resolveWaveSpawns(spawn: ZoneEnemySpawnSettings): SpawnPosition[] {
        const groupSize = Math.max(1, spawn.groupSize);
        const region = spawn.spawnRegion;
        const side = Math.ceil(Math.sqrt(groupSize));

        if (region && 0 < region.w && 0 < region.h) {
            const stepX = side === 1 ? 0 : region.w / (side - 1);
            const stepY = side === 1 ? 0 : region.h / (side - 1);

            return Array.from({ length: groupSize }, (_, index) => ({
                x: region.x + stepX * (index % side),
                y: region.y + stepY * Math.floor(index / side)
            }));
        }

        const defaultPosX = (500 + Math.random() * 100) * (Math.random() < 0.5 ? -1 : 1);
        const defaultPosY = Math.random() * 500 * (Math.random() < 0.5 ? -1 : 1);

        return Array.from({ length: groupSize }, (_, index) => ({
            x: defaultPosX + (-20 + Math.random() * 40) + 50 * (index % side),
            y: defaultPosY + (-20 + Math.random() * 40) + 50 * Math.floor(index / side)
        }));
    }
}
