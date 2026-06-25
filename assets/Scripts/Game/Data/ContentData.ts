import {
    CircularEnemySpawnerSettings,
    EnemyLauncherSettings,
    EnemySettings,
    IndividualEnemySpawnerSettings,
    MetaUpgradesSettings,
    PeriodicFollowMoverSettings,
    SkillSettings,
    UpgradeSettings,
    WaveEnemySpawnerSettings
} from "./GameSettings";

export interface ZoneExitData {
    direction: "north" | "south" | "east" | "west";
    targetZoneId: string;
    spawnX: number;
    spawnY: number;
    minLevel: number;
}

export interface ZoneData {
    zoneId: string;
    name: string;
    requiredLevel: number;
    isUnlocked: boolean;
    targetSurvivalSeconds: number;
    clearRewardGold: number;
    createdAt: string;
    lastUpdated: string;
    exits: ZoneExitData[];
}

export interface EnemyDomainData {
    axeLauncher: EnemyLauncherSettings;
    magicOrbLauncher: EnemyLauncherSettings;
    enemies: EnemySettings[];
    periodicFollowMovers: PeriodicFollowMoverSettings[];
}

export interface EnemySpawnsDomainData {
    individualEnemySpawners: IndividualEnemySpawnerSettings[];
    circularEnemySpawners: CircularEnemySpawnerSettings[];
    waveEnemySpawners: WaveEnemySpawnerSettings[];
    zoneEnemySpawns?: ZoneEnemySpawnData[];
}

export interface ZoneEnemySpawnData {
    spawnId: string;
    zoneId: string;
    enemyId: string;
    weight: number;
    minLevel: number;
    maxLevel: number;
    maxAlive: number;
    spawnInterval: number;
    idleOnly: boolean;
    spawnPattern?: "individual" | "circular" | "wave";
    groupSize?: number;
    milestoneTimeSeconds?: number;
    spawnRegion?: SpawnRegionData;
    lastUpdated?: string;
}

export interface SpawnRegionData {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type UpgradesDomainData = UpgradeSettings;

export type MetaUpgradesDomainData = MetaUpgradesSettings;

export type SkillsDomainData = SkillSettings[];

export type MaterialRarity = "common" | "uncommon" | "rare" | "epic";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type EquipmentSlotType = "mainHand" | "head" | "chest" | "legs" | "feet" | "ring" | "amulet";

export interface MaterialData {
    materialId: string;
    name: string;
    rarity: MaterialRarity;
    description: string;
    icon: string;
    dropZones: string[];
    dropWeight: number;
    lastUpdated: string;
}

export interface ItemCategoryData {
    categoryId: string;
    name: string;
    slot: EquipmentSlotType;
    maxStack: number;
    icon: string;
    lastUpdated: string;
}

export interface ItemStatData {
    atk: number;
    def: number;
    hp: number;
    speed: number;
    critChance: number;
    critMult: number;
    goldBonus: number;
    xpBonus: number;
}

export interface ItemData {
    itemId: string;
    name: string;
    categoryId: string;
    rarity: ItemRarity;
    requiredLevel: number;
    icon: string;
    description: string;
    dropZones: string[];
    dropWeight: number;
    lastUpdated: string;
    stats: ItemStatData;
}
