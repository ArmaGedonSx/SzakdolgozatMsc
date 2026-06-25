export class UserData {
    public playerId = "";
    public displayName = "Player";
    public createdAt = new Date(0).toISOString();
    public lastUpdated = new Date(0).toISOString();
    public soundVolume = 1;
    public musicVolume = 1;
    public game = new GameData();
}

export class GameData {
    public gold = 0;
    public goldCoins = 0;
    public metaUpgrades = new MetaUpgradesData();
    public skillTree = new PlayerSkillTreeData();
    public highscore = 0;
    public zoneHighscores: ZoneHighscoreData = {};
    public level = 1;
    public xp = 0;
    public xpToNext = 10;
    public hp = 50;
    public maxHp = 50;
    public currentZoneId = "zone_main_arena";
    public posX = 0;
    public posY = 0;
    public unlockedZones: string[] = ["zone_main_arena"];
    public clearedZones: string[] = [];
    public lastOnline = new Date(0).toISOString();
    public offlineGold = 0;
    public idleRate = 1;
    public lastRunSummary = "";
    public materials = new PlayerMaterialsData();
    public equipment = new PlayerEquipmentData();
    public inventory: InventoryItemData[] = [];
}

export class MetaUpgradesData {
    public healthLevel = 0;
    public overallDamageLevel = 0;
    public projectilePiercingLevel = 0;
    public movementSpeedLevel = 0;
    public xpGathererLevel = 0;
    public goldGathererLevel = 0;
}

export class PlayerSkillProgressData {
    public rank = 0;
    public unlockedAt = "";
}

export class PlayerSkillTreeData {
    [skillId: string]: PlayerSkillProgressData;
}

export class ZoneHighscoreData {
    [zoneId: string]: number;
}

export class PlayerMaterialsData {
    [materialId: string]: number;
}

export class PlayerEquipmentData {
    public mainHand: string | null = null;
    public head: string | null = null;
    public chest: string | null = null;
    public legs: string | null = null;
    public feet: string | null = null;
    public ring1: string | null = null;
    public ring2: string | null = null;
    public amulet: string | null = null;
}

export class InventoryItemData {
    public itemId = "";
    public quantity = 0;
    public slotIndex = 0;
}
