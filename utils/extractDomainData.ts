import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { GameSettings, ZoneEnemySpawnSettings } from "../assets/Scripts/Game/Data/GameSettings";
import { DefaultZoneContent } from "../assets/Scripts/Game/Data/DefaultZoneContent";
import { DefaultLootContent } from "../assets/Scripts/Game/Data/DefaultLootContent";
import { DefaultEnemyProgression } from "../assets/Scripts/Game/Data/DefaultEnemyProgression";
import { DefaultSkillContent } from "../assets/Scripts/Game/Data/DefaultSkillContent";
import { ZoneSpawnProgression } from "../assets/Scripts/Game/Data/ZoneSpawnProgression";
import {
    EnemyDomainData,
    EnemySpawnsDomainData,
    MetaUpgradesDomainData,
    SkillsDomainData,
    UpgradesDomainData,
    ZoneData
} from "../assets/Scripts/Game/Data/ContentData";
import { LegacySpawnMigration } from "../assets/Scripts/Game/Data/LegacySpawnMigration";

extractDomainData();

function extractDomainData(): void {
    const settingsPath = process.argv[2];

    if (!settingsPath) {
        throw new Error("Usage: ts-node utils/extractDomainData.ts <assets/Data/GameSettings.json>");
    }

    const baseDir = dirname(settingsPath);
    const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as GameSettings;

    const enemies: EnemyDomainData = {
        axeLauncher: settings.enemyManager.axeLauncher,
        magicOrbLauncher: settings.enemyManager.magicOrbLauncher,
        enemies: DefaultEnemyProgression.normalize(settings.enemyManager.enemies),
        periodicFollowMovers: settings.enemyManager.periodicFollowMovers
    };

    const enemySpawnsSource: EnemySpawnsDomainData = {
        individualEnemySpawners: settings.enemyManager.individualEnemySpawners,
        circularEnemySpawners: settings.enemyManager.circularEnemySpawners,
        waveEnemySpawners: settings.enemyManager.waveEnemySpawners,
        zoneEnemySpawns: settings.enemyManager.zoneEnemySpawns
    };
    const skills: SkillsDomainData = DefaultSkillContent.normalize(settings.skills ?? [], settings.upgrades);
    const upgrades: UpgradesDomainData = settings.upgrades;
    const metaUpgrades: MetaUpgradesDomainData = settings.metaUpgrades;

    const zoneSource = settings.zones && 1 < settings.zones.length ? settings.zones : DefaultZoneContent.createDefaultZones();
    const zones: ZoneData[] = zoneSource.map((zone) => ({
        zoneId: zone.zoneId,
        name: zone.name,
        requiredLevel: zone.requiredLevel,
        isUnlocked: zone.isUnlocked,
        createdAt: zone.createdAt,
        lastUpdated: zone.lastUpdated,
        exits: zone.exits.map((exit) => ({
            direction: exit.direction as "north" | "south" | "east" | "west",
            targetZoneId: exit.targetZoneId,
            spawnX: exit.spawnX,
            spawnY: exit.spawnY,
            minLevel: exit.minLevel
        }))
    }));
    const enemySpawns = LegacySpawnMigration.withZoneEnemySpawns(enemySpawnsSource, "zone_main_arena");
    const runtimeZoneSpawns = (enemySpawns.zoneEnemySpawns ?? []).map((spawn) => {
        const normalized = new ZoneEnemySpawnSettings();
        Object.assign(normalized, spawn);
        normalized.spawnPattern = spawn.spawnPattern ?? "individual";
        normalized.groupSize = Math.max(1, spawn.groupSize ?? 1);
        return normalized;
    });
    enemySpawns.zoneEnemySpawns = ZoneSpawnProgression.normalize(runtimeZoneSpawns, zoneSource);
    const materials = DefaultLootContent.normalizeMaterials(settings.materials);
    const equippableItems = DefaultLootContent.normalizeItems(settings.equippableItems);

    writeJson(join(baseDir, "Enemies.json"), enemies);
    writeJson(join(baseDir, "EnemySpawns.json"), enemySpawns);
    writeJson(join(baseDir, "Skills.json"), skills);
    writeJson(join(baseDir, "Upgrades.json"), upgrades);
    writeJson(join(baseDir, "MetaUpgrades.json"), metaUpgrades);
    writeJson(join(baseDir, "Zones.json"), zones);
    writeJson(join(baseDir, "Materials.json"), materials);
    writeJson(join(baseDir, "ItemCategories.json"), settings.itemCategories);
    writeJson(join(baseDir, "Items.json"), equippableItems);
}

function writeJson(filePath: string, content: unknown): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
}
