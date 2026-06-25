import { EnemyProjectileLauncher } from "../Unit/Enemy/ProjectileLauncher.cs/EnemyProjectileLauncher";
import { UpgradeType } from "../Upgrades/UpgradeType";

export class GameSettings {
    public player: PlayerSettings = new PlayerSettings();
    public upgrades: UpgradeSettings = new UpgradeSettings();
    public metaUpgrades: MetaUpgradesSettings = new MetaUpgradesSettings();
    public skills: SkillSettings[] = [];
    public enemyManager: EnemyManagerSettings = new EnemyManagerSettings();
    public items: ItemSettings = new ItemSettings();
    public zones: ZoneSettings[] = [new ZoneSettings()];
    public materials: MaterialSettings[] = [new MaterialSettings()];
    public itemCategories: ItemCategorySettings[] = [new ItemCategorySettings()];
    public equippableItems: EquippableItemSettings[] = [new EquippableItemSettings()];
}

export class PlayerSettings {
    public defaultHP = 0;
    public requiredXP: number[] = [];
    public speed = 0;
    public regenerationDelay = 0;
    public collisionDelay = 0;
    public magnetDuration = 0;
    public weapon: WeaponSettings = new WeaponSettings();
    public haloLauncher: HaloLauncherSettings = new HaloLauncherSettings();
    public horizontalLauncher: WaveLauncherSettings = new WaveLauncherSettings();
    public diagonalLauncher: WaveLauncherSettings = new WaveLauncherSettings();
}

export class WeaponSettings {
    public strikeDelay = 0;
    public damage = 0;
}

export class WaveLauncherSettings {
    public wavesToShootPerUpgrade = 0;
    public launcher = new ProjectileLauncherSettings();
}

export class HaloLauncherSettings {
    public projectilesToSpawn = 0;
    public cooldownDivisorPerUpgrade = 0;
    public launcher = new ProjectileLauncherSettings();
}

export class EnemyLauncherSettings {
    public enemyIds: string[] = [];
    public projectileLifetime = 0;
    public projectileSpeed = 0;
    public projectileDamage = 0;
    public cooldown = 0;
}

export class ProjectileLauncherSettings {
    public projectileLifetime = 0;
    public projectileSpeed = 0;
    public wavesToShoot = 0;
    public wavesDelayMs = 0;
    public cooldown = 0;
}

export class UpgradeSettings {
    public maxWeaponLengthUpgrades = 0;
    public maxWeaponDamageUpgrades = 0;
    public maxHorizontalProjectileUpgrades = 0;
    public maxDiagonalProjectileUpgrades = 0;
    public maxHaloProjectileUpgrades = 0;
    public maxRegenerationUpgrades = 0;
}

export class SkillSettings {
    public skillId = "";
    public upgradeType: UpgradeType = UpgradeType.WeaponLength;
    public name = "";
    public description = "";
    public type: "passive" | "active" = "passive";
    public maxRank = 1;
    public goldCoinCost = 0;
    public materialCosts: Record<string, number> = {};
    public choiceWeight = 1;
    public statBonusPerRank: SkillStatBonusSettings = new SkillStatBonusSettings();
    public lastUpdated = "";
}

export class SkillStatBonusSettings {
    public atk = 0;
    public def = 0;
    public hp = 0;
    public speed = 0;
    public critChance = 0;
    public critMult = 1;
    public goldBonus = 0;
    public xpBonus = 0;
    public idleRate = 0;
}

export class MetaUpgradesSettings {
    public health = new MetaUpgradeSettings();
    public overallDamage = new MetaUpgradeSettings();
    public projectilePiercing = new MetaUpgradeSettings();
    public movementSpeed = new MetaUpgradeSettings();
    public xpGatherer = new MetaUpgradeSettings();
    public goldGatherer = new MetaUpgradeSettings();
}

export class MetaUpgradeSettings {
    public costs: number[] = [];
    public bonuses: number[] = [];
}

export class EnemyManagerSettings {
    public axeLauncher = new EnemyLauncherSettings();
    public magicOrbLauncher = new EnemyLauncherSettings();
    public enemies: EnemySettings[] = [new EnemySettings()];
    public periodicFollowMovers: PeriodicFollowMoverSettings[] = [new PeriodicFollowMoverSettings()];
    public individualEnemySpawners: IndividualEnemySpawnerSettings[] = [new IndividualEnemySpawnerSettings()];
    public circularEnemySpawners: CircularEnemySpawnerSettings[] = [new CircularEnemySpawnerSettings()];
    public waveEnemySpawners: WaveEnemySpawnerSettings[] = [new WaveEnemySpawnerSettings()];
    public zoneEnemySpawns: ZoneEnemySpawnSettings[] = [new ZoneEnemySpawnSettings()];
    public spawnPressure: SpawnPressureSettings = new SpawnPressureSettings();
}

export class SpawnPressureSettings {
    public enabled = false;
    public rampStartSeconds = 60;
    public secondsPerStep = 45;
    public maxSteps = 4;
    public cooldownReductionPerStep = 0.1;
    public levelBonusPerStep = 0;
}

export class PeriodicFollowMoverSettings {
    public enemyIdToAffect = "";
    public followTime = 0;
    public waitTime = 0;
}

export class GeneralEnemySpawnerSettings {
    public enemyId = "";
    public startDelay = 0;
    public stopDelay = 0;
    public cooldown = 0;
}

export class WaveEnemySpawnerSettings implements ISpawner {
    public common = new GeneralEnemySpawnerSettings();
    public enemiesToSpawn = 0;
}

export class CircularEnemySpawnerSettings implements ISpawner {
    public common = new GeneralEnemySpawnerSettings();
    public enemiesToSpawn = 0;
}

export class IndividualEnemySpawnerSettings implements ISpawner {
    public common = new GeneralEnemySpawnerSettings();
}

export interface ISpawner {
    common: GeneralEnemySpawnerSettings;
}

export class EnemySettings {
    public id = "";
    public name = "";
    public moveType = "";
    public graphicsType = "";
    public spriteAsset = "";
    public baseHp = 0;
    public baseAtk = 0;
    public baseSpeed = 0;
    public hpScaling = 1;
    public atkScaling = 1;
    public rewardScaling = 1;
    public aggroRange = 0;
    public attackRange = 0;
    public attackCooldown = 0;
    public lastUpdated = "";
    public health = 0;
    public damage = 0;
    public speed = 0;
    public lifetime = 0;

    public xpReward = 0;
    public goldReward = 0;
    public healthPotionRewardChance = 0;
    public magnetRewardChance = 0;
    public chestRewardChance = 0;
}

export class ZoneEnemySpawnSettings {
    public spawnId = "";
    public zoneId = "";
    public enemyId = "";
    public weight = 0;
    public minLevel = 1;
    public maxLevel = 1;
    public maxAlive = 1;
    public spawnInterval = 1000;
    public idleOnly = false;
    public spawnPattern: "individual" | "circular" | "wave" = "individual";
    public groupSize = 1;
    public milestoneTimeSeconds = 0;
    public spawnRegion: SpawnRegionSettings = new SpawnRegionSettings();
    public lastUpdated = "";
}

export class SpawnRegionSettings {
    public x = 0;
    public y = 0;
    public w = 0;
    public h = 0;
}

export class ItemSettings {
    public healthPerPotion = 0;
}

export class ZoneExitSettings {
    public direction = "north";
    public targetZoneId = "";
    public spawnX = 0;
    public spawnY = 0;
    public minLevel = 0;
}

export class ZoneSettings {
    public zoneId = "";
    public name = "";
    public requiredLevel = 0;
    public isUnlocked = false;
    public targetSurvivalSeconds = 0;
    public clearRewardGold = 0;
    public createdAt = "";
    public lastUpdated = "";
    public exits: ZoneExitSettings[] = [];
}

export class MaterialSettings {
    public materialId = "";
    public name = "";
    public rarity = "";
    public description = "";
    public icon = "";
    public dropZones: string[] = [];
    public dropWeight = 0;
    public lastUpdated = "";
}

export class ItemCategorySettings {
    public categoryId = "";
    public name = "";
    public slot = "";
    public maxStack = 1;
    public icon = "";
    public lastUpdated = "";
}

export class ItemStatSettings {
    public atk = 0;
    public def = 0;
    public hp = 0;
    public speed = 0;
    public critChance = 0;
    public critMult = 1;
    public goldBonus = 0;
    public xpBonus = 0;
}

export class EquippableItemSettings {
    public itemId = "";
    public name = "";
    public categoryId = "";
    public rarity = "";
    public requiredLevel = 0;
    public icon = "";
    public description = "";
    public dropZones: string[] = [];
    public dropWeight = 0;
    public lastUpdated = "";
    public stats: ItemStatSettings = new ItemStatSettings();
}
