import { EnemySpawnsDomainData, ZoneEnemySpawnData } from "./ContentData";
import { DefaultZoneContent } from "./DefaultZoneContent";
import { ZoneEnemySpawnSettings } from "./GameSettings";

export class LegacySpawnMigration {
    public static withZoneEnemySpawns(enemySpawns: EnemySpawnsDomainData, defaultZoneId: string): EnemySpawnsDomainData {
        const zoneEnemySpawns = new Map<string, ZoneEnemySpawnSettings>();

        for (const existingSpawn of enemySpawns.zoneEnemySpawns ?? []) {
            const normalized = this.normalizeZoneSpawn(existingSpawn);
            zoneEnemySpawns.set(normalized.spawnId, normalized);
        }

        enemySpawns.individualEnemySpawners.forEach((spawner, index) => {
            const spawn = this.createZoneSpawnFromLegacySpawner(
                "individual",
                spawner.common.enemyId,
                spawner.common.startDelay,
                spawner.common.stopDelay,
                spawner.common.cooldown,
                index,
                defaultZoneId,
                1
            );
            if (!zoneEnemySpawns.has(spawn.spawnId)) zoneEnemySpawns.set(spawn.spawnId, spawn);
        });

        enemySpawns.circularEnemySpawners.forEach((spawner, index) => {
            const spawn = this.createZoneSpawnFromLegacySpawner(
                "circular",
                spawner.common.enemyId,
                spawner.common.startDelay,
                spawner.common.stopDelay,
                spawner.common.cooldown,
                index,
                defaultZoneId,
                spawner.enemiesToSpawn
            );
            if (!zoneEnemySpawns.has(spawn.spawnId)) zoneEnemySpawns.set(spawn.spawnId, spawn);
        });

        enemySpawns.waveEnemySpawners.forEach((spawner, index) => {
            const spawn = this.createZoneSpawnFromLegacySpawner(
                "wave",
                spawner.common.enemyId,
                spawner.common.startDelay,
                spawner.common.stopDelay,
                spawner.common.cooldown,
                index,
                defaultZoneId,
                spawner.enemiesToSpawn
            );
            if (!zoneEnemySpawns.has(spawn.spawnId)) zoneEnemySpawns.set(spawn.spawnId, spawn);
        });

        return {
            ...enemySpawns,
            zoneEnemySpawns: Array.from(zoneEnemySpawns.values())
        };
    }

    private static createZoneSpawnFromLegacySpawner(
        spawnPattern: "individual" | "circular" | "wave",
        enemyId: string,
        startDelay: number,
        stopDelay: number,
        cooldown: number,
        index: number,
        defaultZoneId: string,
        groupSize: number
    ): ZoneEnemySpawnSettings {
        const spawn = new ZoneEnemySpawnSettings();
        spawn.spawnId = `legacy_${spawnPattern}_${index}_${enemyId.toLowerCase()}`;
        spawn.zoneId = defaultZoneId === "zone_main_arena" ? DefaultZoneContent.resolveLegacyZoneId(startDelay) : defaultZoneId;
        spawn.enemyId = enemyId;
        spawn.weight = 1;
        spawn.minLevel = 1;
        spawn.maxLevel = 999;
        spawn.idleOnly = false;
        spawn.spawnPattern = spawnPattern;
        spawn.groupSize = Math.max(1, groupSize);
        spawn.spawnInterval = Math.max(1, Math.round(cooldown * 1000));
        spawn.maxAlive = this.estimateMaxAlive(startDelay, stopDelay, cooldown);
        spawn.lastUpdated = "";
        return spawn;
    }

    private static normalizeZoneSpawn(spawn: ZoneEnemySpawnData): ZoneEnemySpawnSettings {
        const normalized = new ZoneEnemySpawnSettings();
        Object.assign(normalized, spawn);
        normalized.spawnPattern = spawn.spawnPattern ?? "individual";
        normalized.groupSize = Math.max(1, spawn.groupSize ?? 1);
        Object.assign(normalized.spawnRegion, spawn.spawnRegion ?? {});
        normalized.lastUpdated = spawn.lastUpdated ?? "";
        return normalized;
    }

    private static estimateMaxAlive(startDelay: number, stopDelay: number, cooldown: number): number {
        if (stopDelay === -1) return 999;
        if (cooldown <= 0) return 1;

        const activeDuration = Math.max(0, stopDelay - startDelay);
        return Math.max(1, Math.min(50, Math.ceil(activeDuration / cooldown)));
    }
}
