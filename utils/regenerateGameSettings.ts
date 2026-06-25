/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { merge, unset } from "lodash";
import {
    EnemyDomainData,
    EnemySpawnsDomainData,
    ItemCategoryData,
    ItemData,
    MaterialData,
    MetaUpgradesDomainData,
    SkillsDomainData,
    UpgradesDomainData,
    ZoneData
} from "../assets/Scripts/Game/Data/ContentData";
import { ContentValidator } from "../assets/Scripts/Game/Data/ContentValidator";
import { GameSettings, ZoneEnemySpawnSettings } from "../assets/Scripts/Game/Data/GameSettings";
import { DefaultSkillContent } from "../assets/Scripts/Game/Data/DefaultSkillContent";
import { LegacySpawnMigration } from "../assets/Scripts/Game/Data/LegacySpawnMigration";

regenerateGameSettings();
function regenerateGameSettings(): void {
    const settingsPath: string = process.argv[2];

    const templateSettings: GameSettings = new GameSettings();
    const savedSettingsJson: string = readFileSync(settingsPath, "utf8");
    const savedSettings: GameSettings = <GameSettings>JSON.parse(savedSettingsJson);
    deleteUnusedProperties(templateSettings, savedSettings);
    const result: GameSettings = merge(templateSettings, savedSettings);
    applyDomainData(result, settingsPath);
    ensureValidContent(result);

    writeFileSync(settingsPath, JSON.stringify(result, null, 2) + "\n");
}

function deleteUnusedProperties(templateSettings: GameSettings, savedSettings: GameSettings): void {
    const templateKeys: string[] = getAllKeys(templateSettings);
    const usedSettings: string[] = getAllKeys(savedSettings);

    usedSettings.forEach((key) => {
        if (key.match(/.\d+/)) return; // ignore arrays

        if (!templateKeys.includes(key)) {
            console.log("Removing unused property " + key);
            unset(savedSettings, key);
        }
    });
}

function getAllKeys(objectWithKeys: any, prefix = ""): string[] {
    if (typeof objectWithKeys === "string") return [];

    const keys: string[] = [];
    const objectKeys: string[] = Object.keys(objectWithKeys);

    for (let i = 0; i < objectKeys.length; i++) {
        keys.push(...getAllKeys(objectWithKeys[objectKeys[i]], `${prefix}${objectKeys[i]}.`));
        keys.push(`${prefix}${objectKeys[i]}`);
    }

    return keys;
}

function applyDomainData(result: GameSettings, settingsPath: string): void {
    const dataDir = dirname(settingsPath);
    const enemiesPath = join(dataDir, "Enemies.json");
    const enemySpawnsPath = join(dataDir, "EnemySpawns.json");
    const skillsPath = join(dataDir, "Skills.json");
    const upgradesPath = join(dataDir, "Upgrades.json");
    const metaUpgradesPath = join(dataDir, "MetaUpgrades.json");
    const zonesPath = join(dataDir, "Zones.json");
    const materialsPath = join(dataDir, "Materials.json");
    const itemCategoriesPath = join(dataDir, "ItemCategories.json");
    const itemsPath = join(dataDir, "Items.json");

    const enemies = tryReadJson<EnemyDomainData>(enemiesPath);
    if (enemies) {
        result.enemyManager.axeLauncher = enemies.axeLauncher;
        result.enemyManager.magicOrbLauncher = enemies.magicOrbLauncher;
        result.enemyManager.enemies = enemies.enemies;
        result.enemyManager.periodicFollowMovers = enemies.periodicFollowMovers;
    }

    const enemySpawnsSource = tryReadJson<EnemySpawnsDomainData>(enemySpawnsPath);
    const enemySpawns = enemySpawnsSource ? LegacySpawnMigration.withZoneEnemySpawns(enemySpawnsSource, "zone_main_arena") : null;
    if (enemySpawns) {
        result.enemyManager.individualEnemySpawners = enemySpawns.individualEnemySpawners;
        result.enemyManager.circularEnemySpawners = enemySpawns.circularEnemySpawners;
        result.enemyManager.waveEnemySpawners = enemySpawns.waveEnemySpawners;
        result.enemyManager.zoneEnemySpawns = (enemySpawns.zoneEnemySpawns ?? []).map((spawn) => {
            const normalized = new ZoneEnemySpawnSettings();
            Object.assign(normalized, spawn);
            normalized.spawnPattern = spawn.spawnPattern ?? "individual";
            normalized.groupSize = Math.max(1, spawn.groupSize ?? 1);
            return normalized;
        });
    }

    const upgrades = tryReadJson<UpgradesDomainData>(upgradesPath);
    if (upgrades) {
        result.upgrades = upgrades;
    }

    const skills = tryReadJson<SkillsDomainData>(skillsPath);
    result.skills = DefaultSkillContent.normalize(skills ?? [], result.upgrades);

    const metaUpgrades = tryReadJson<MetaUpgradesDomainData>(metaUpgradesPath);
    if (metaUpgrades) {
        result.metaUpgrades = metaUpgrades;
    }

    const zones = tryReadJson<ZoneData[]>(zonesPath);
    if (zones) {
        result.zones = zones;
    }

    const materials = tryReadJson<MaterialData[]>(materialsPath);
    if (materials) {
        result.materials = materials;
    }

    const itemCategories = tryReadJson<ItemCategoryData[]>(itemCategoriesPath);
    if (itemCategories) {
        result.itemCategories = itemCategories;
    }

    const equippableItems = tryReadJson<ItemData[]>(itemsPath);
    if (equippableItems) {
        result.equippableItems = equippableItems;
    }
}

function tryReadJson<T>(path: string): T | null {
    try {
        return JSON.parse(readFileSync(path, "utf8")) as T;
    } catch {
        return null;
    }
}

function ensureValidContent(settings: GameSettings): void {
    const issues = ContentValidator.validate(settings);
    if (issues.length === 0) return;

    const message = issues.map((issue) => `[${issue.severity}] ${issue.path}: ${issue.message}`).join("\n");
    throw new Error(`Content validation failed:\n${message}`);
}
