import { GameSettings, ISpawner } from "./GameSettings";
import { UpgradeType } from "../Upgrades/UpgradeType";

export class ContentValidationIssue {
    public severity: "error" | "warning" = "error";
    public path = "";
    public message = "";
}

export class ContentValidator {
    private static readonly MATERIAL_RARITIES = ["common", "uncommon", "rare", "epic"];
    private static readonly ITEM_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
    private static readonly EQUIPMENT_SLOTS = ["mainHand", "head", "chest", "legs", "feet", "ring", "amulet"];
    private static readonly EXIT_DIRECTIONS = ["north", "south", "east", "west"];

    public static validate(settings: GameSettings): ContentValidationIssue[] {
        const issues: ContentValidationIssue[] = [];
        const zoneIds = this.validateUniqueIds(issues, settings.zones.map((zone) => zone.zoneId), "zoneId", "zones", "zoneId");
        const materialIds = this.validateUniqueIds(issues, settings.materials.map((material) => material.materialId), "materialId", "materials", "materialId");
        const categoryIds = this.validateUniqueIds(
            issues,
            settings.itemCategories.map((category) => category.categoryId),
            "categoryId",
            "itemCategories",
            "categoryId"
        );
        this.validateUniqueIds(issues, settings.equippableItems.map((item) => item.itemId), "itemId", "equippableItems", "itemId");
        const enemyIds = this.validateUniqueIds(issues, settings.enemyManager.enemies.map((enemy) => enemy.id), "enemy id", "enemyManager.enemies", "id");
        const skillUpgradeTypes = new Set<UpgradeType>();
        this.validateUniqueIds(issues, settings.skills.map((skill) => skill.skillId), "skillId", "skills", "skillId");

        settings.zones.forEach((zone, zoneIndex) => {
            this.validateIsoTimestamp(issues, `zones[${zoneIndex}].createdAt`, "createdAt", zone.createdAt);
            this.validateIsoTimestamp(issues, `zones[${zoneIndex}].lastUpdated`, "lastUpdated", zone.lastUpdated);
            if (zone.targetSurvivalSeconds < 0) {
                this.pushIssue(issues, `zones[${zoneIndex}].targetSurvivalSeconds`, "Zone targetSurvivalSeconds cannot be negative");
            }
            if (zone.clearRewardGold < 0) {
                this.pushIssue(issues, `zones[${zoneIndex}].clearRewardGold`, "Zone clearRewardGold cannot be negative");
            }
            zone.exits.forEach((exit, exitIndex) => {
                if (!this.EXIT_DIRECTIONS.includes(exit.direction)) {
                    this.pushIssue(issues, `zones[${zoneIndex}].exits[${exitIndex}].direction`, `Unknown exit direction "${exit.direction}"`);
                }
                if (!zoneIds.has(exit.targetZoneId)) {
                    this.pushIssue(issues, `zones[${zoneIndex}].exits[${exitIndex}].targetZoneId`, `Unknown zone reference "${exit.targetZoneId}"`);
                }
            });
        });

        settings.materials.forEach((material, materialIndex) => {
            this.validateIsoTimestamp(issues, `materials[${materialIndex}].lastUpdated`, "lastUpdated", material.lastUpdated);
            if (!this.MATERIAL_RARITIES.includes(material.rarity)) {
                this.pushIssue(issues, `materials[${materialIndex}].rarity`, `Unknown material rarity "${material.rarity}"`);
            }
            material.dropZones.forEach((zoneId, zoneIndex) => {
                if (!zoneIds.has(zoneId)) {
                    this.pushIssue(issues, `materials[${materialIndex}].dropZones[${zoneIndex}]`, `Unknown zone reference "${zoneId}"`);
                }
            });
            if (material.dropWeight < 0) {
                this.pushIssue(issues, `materials[${materialIndex}].dropWeight`, "Material dropWeight cannot be negative");
            }
        });

        settings.equippableItems.forEach((item, itemIndex) => {
            this.validateIsoTimestamp(issues, `equippableItems[${itemIndex}].lastUpdated`, "lastUpdated", item.lastUpdated);
            if (!categoryIds.has(item.categoryId)) {
                this.pushIssue(issues, `equippableItems[${itemIndex}].categoryId`, `Unknown item category reference "${item.categoryId}"`);
            }
            if (!this.ITEM_RARITIES.includes(item.rarity)) {
                this.pushIssue(issues, `equippableItems[${itemIndex}].rarity`, `Unknown item rarity "${item.rarity}"`);
            }
            item.dropZones.forEach((zoneId, zoneIndex) => {
                if (!zoneIds.has(zoneId)) {
                    this.pushIssue(issues, `equippableItems[${itemIndex}].dropZones[${zoneIndex}]`, `Unknown zone reference "${zoneId}"`);
                }
            });
            if (item.dropWeight < 0) {
                this.pushIssue(issues, `equippableItems[${itemIndex}].dropWeight`, "Item dropWeight cannot be negative");
            }
            this.validateCritStats(issues, `equippableItems[${itemIndex}].stats`, item.stats.critChance, item.stats.critMult);
        });

        settings.skills.forEach((skill, skillIndex) => {
            this.validateIsoTimestamp(issues, `skills[${skillIndex}].lastUpdated`, "lastUpdated", skill.lastUpdated);
            if (!Object.values(UpgradeType).includes(skill.upgradeType)) {
                this.pushIssue(issues, `skills[${skillIndex}].upgradeType`, `Unknown upgrade type "${skill.upgradeType}"`);
            } else if (skillUpgradeTypes.has(skill.upgradeType)) {
                this.pushIssue(issues, `skills[${skillIndex}].upgradeType`, `Duplicate upgrade type "${skill.upgradeType}"`);
            } else {
                skillUpgradeTypes.add(skill.upgradeType);
            }
            if (!["passive", "active"].includes(skill.type)) {
                this.pushIssue(issues, `skills[${skillIndex}].type`, `Unknown skill type "${skill.type}"`);
            }
            if (skill.maxRank <= 0) {
                this.pushIssue(issues, `skills[${skillIndex}].maxRank`, "Skill maxRank must be greater than zero");
            }
            if (skill.goldCoinCost < 0) {
                this.pushIssue(issues, `skills[${skillIndex}].goldCoinCost`, "Skill goldCoinCost cannot be negative");
            }
            for (const [materialId, cost] of Object.entries(skill.materialCosts ?? {})) {
                if (!materialIds.has(materialId)) {
                    this.pushIssue(issues, `skills[${skillIndex}].materialCosts.${materialId}`, `Unknown material reference "${materialId}"`);
                }
                if (cost < 0) {
                    this.pushIssue(issues, `skills[${skillIndex}].materialCosts.${materialId}`, "Skill material cost cannot be negative");
                }
            }
            if (skill.choiceWeight < 0) {
                this.pushIssue(issues, `skills[${skillIndex}].choiceWeight`, "Skill choiceWeight cannot be negative");
            }
            this.validateCritStats(
                issues,
                `skills[${skillIndex}].statBonusPerRank`,
                skill.statBonusPerRank.critChance,
                skill.statBonusPerRank.critMult
            );
        });

        settings.itemCategories.forEach((category, categoryIndex) => {
            this.validateIsoTimestamp(issues, `itemCategories[${categoryIndex}].lastUpdated`, "lastUpdated", category.lastUpdated);
            if (!this.EQUIPMENT_SLOTS.includes(category.slot)) {
                this.pushIssue(issues, `itemCategories[${categoryIndex}].slot`, `Unknown equipment slot "${category.slot}"`);
            }
        });

        settings.enemyManager.enemies.forEach((enemy, index) => {
            this.validateIsoTimestamp(issues, `enemyManager.enemies[${index}].lastUpdated`, "lastUpdated", enemy.lastUpdated);
        });

        this.validateSpawnerEnemyRefs(issues, settings.enemyManager.individualEnemySpawners, "enemyManager.individualEnemySpawners", enemyIds);
        this.validateSpawnerEnemyRefs(issues, settings.enemyManager.circularEnemySpawners, "enemyManager.circularEnemySpawners", enemyIds);
        this.validateSpawnerEnemyRefs(issues, settings.enemyManager.waveEnemySpawners, "enemyManager.waveEnemySpawners", enemyIds);
        this.validateSpawnPressure(issues, settings);
        settings.enemyManager.zoneEnemySpawns.forEach((spawn, index) => {
            this.validateIsoTimestamp(issues, `enemyManager.zoneEnemySpawns[${index}].lastUpdated`, "lastUpdated", spawn.lastUpdated);
            if (!zoneIds.has(spawn.zoneId)) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].zoneId`, `Unknown zone reference "${spawn.zoneId}"`);
            }
            if (!enemyIds.has(spawn.enemyId)) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].enemyId`, `Unknown enemy reference "${spawn.enemyId}"`);
            }
            if (spawn.weight <= 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].weight`, "zoneEnemySpawn weight must be greater than zero");
            }
            if (spawn.maxAlive <= 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].maxAlive`, "zoneEnemySpawn maxAlive must be greater than zero");
            }
            if (spawn.spawnInterval <= 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].spawnInterval`, "zoneEnemySpawn spawnInterval must be greater than zero");
            }
            if (spawn.maxLevel < spawn.minLevel) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].maxLevel`, "zoneEnemySpawn maxLevel cannot be less than minLevel");
            }
            if (!["individual", "circular", "wave"].includes(spawn.spawnPattern)) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].spawnPattern`, "zoneEnemySpawn spawnPattern is invalid");
            }
            if (spawn.groupSize <= 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].groupSize`, "zoneEnemySpawn groupSize must be greater than zero");
            }
            if (spawn.milestoneTimeSeconds < 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].milestoneTimeSeconds`, "zoneEnemySpawn milestoneTimeSeconds cannot be negative");
            }
            if (spawn.spawnRegion && spawn.spawnRegion.w < 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].spawnRegion.w`, "zoneEnemySpawn spawnRegion.w cannot be negative");
            }
            if (spawn.spawnRegion && spawn.spawnRegion.h < 0) {
                this.pushIssue(issues, `enemyManager.zoneEnemySpawns[${index}].spawnRegion.h`, "zoneEnemySpawn spawnRegion.h cannot be negative");
            }
        });

        return issues;
    }

    private static validateSpawnerEnemyRefs(issues: ContentValidationIssue[], spawners: ISpawner[], path: string, enemyIds: Set<string>): void {
        spawners.forEach((spawner, spawnerIndex) => {
            if (!enemyIds.has(spawner.common.enemyId)) {
                this.pushIssue(issues, `${path}[${spawnerIndex}].common.enemyId`, `Unknown enemy reference "${spawner.common.enemyId}"`);
            }
        });
    }

    private static validateUniqueIds(
        issues: ContentValidationIssue[],
        values: string[],
        label: string,
        collectionPath: string,
        fieldName: string
    ): Set<string> {
        const uniqueValues = new Set<string>();

        values.forEach((value, index) => {
            const fieldPath = `${collectionPath}[${index}].${fieldName}`;
            if (!value) {
                this.pushIssue(issues, fieldPath, `Missing ${label}`);
                return;
            }

            if (uniqueValues.has(value)) {
                this.pushIssue(issues, fieldPath, `Duplicate ${label} "${value}"`);
                return;
            }

            uniqueValues.add(value);
        });

        return uniqueValues;
    }

    private static pushIssue(issues: ContentValidationIssue[], path: string, message: string): void {
        const issue = new ContentValidationIssue();
        issue.path = path;
        issue.message = message;
        issues.push(issue);
    }

    private static validateIsoTimestamp(issues: ContentValidationIssue[], path: string, label: string, value: string): void {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
            this.pushIssue(issues, path, `${label} must be an ISO 8601 timestamp`);
        }
    }

    private static validateSpawnPressure(issues: ContentValidationIssue[], settings: GameSettings): void {
        const pressure = settings.enemyManager.spawnPressure;
        if (!pressure) return;

        if (pressure.rampStartSeconds < 0) {
            this.pushIssue(
                issues,
                "enemyManager.spawnPressure.rampStartSeconds",
                "spawnPressure rampStartSeconds cannot be negative"
            );
        }
        if (pressure.secondsPerStep <= 0) {
            this.pushIssue(
                issues,
                "enemyManager.spawnPressure.secondsPerStep",
                "spawnPressure secondsPerStep must be greater than zero"
            );
        }
        if (pressure.maxSteps < 0) {
            this.pushIssue(issues, "enemyManager.spawnPressure.maxSteps", "spawnPressure maxSteps cannot be negative");
        }
        if (pressure.cooldownReductionPerStep < 0 || 0.9 < pressure.cooldownReductionPerStep) {
            this.pushIssue(
                issues,
                "enemyManager.spawnPressure.cooldownReductionPerStep",
                "spawnPressure cooldownReductionPerStep must be between 0 and 0.9"
            );
        }
        if (pressure.levelBonusPerStep < 0) {
            this.pushIssue(
                issues,
                "enemyManager.spawnPressure.levelBonusPerStep",
                "spawnPressure levelBonusPerStep cannot be negative"
            );
        }
    }

    private static validateCritStats(
        issues: ContentValidationIssue[],
        pathPrefix: string,
        critChance: number,
        critMult: number
    ): void {
        if (critChance < 0 || 1 < critChance) {
            this.pushIssue(issues, `${pathPrefix}.critChance`, "critChance must be between 0 and 1");
        }
        if (critMult < 1) {
            this.pushIssue(issues, `${pathPrefix}.critMult`, "critMult must be at least 1");
        }
    }
}
