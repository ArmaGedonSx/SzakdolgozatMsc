import { EquippableItemSettings, GameSettings, ItemCategorySettings, MaterialSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { InventoryItemData, UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { InventoryPresentation } from "../../../assets/Scripts/Menu/InventoryPresentation";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.itemCategories = [
        createCategory("weapon", "mainHand"),
        createCategory("head", "head"),
        createCategory("ring", "ring")
    ];
    settings.equippableItems = [
        createItem("sword_iron_01", "Iron Sword", "weapon"),
        createItem("helmet_leather_01", "Leather Cap", "head"),
        createItem("ring_greed_01", "Ring of Greed", "ring")
    ];
    settings.materials = [createMaterial("iron_ore", "Iron Ore")];
    return settings;
}

function createCategory(categoryId: string, slot: string): ItemCategorySettings {
    const category = new ItemCategorySettings();
    category.categoryId = categoryId;
    category.name = categoryId === "weapon" ? "Weapon" : categoryId === "head" ? "Headgear" : "Ring";
    category.slot = slot;
    category.icon = `icon_${categoryId}`;
    return category;
}

function createItem(itemId: string, name: string, categoryId: string): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.name = name;
    item.categoryId = categoryId;
    item.icon = `icon_${itemId}`;
    item.description = `${name} description`;
    item.rarity = itemId === "ring_greed_01" ? "uncommon" : "common";
    item.requiredLevel = itemId === "ring_greed_01" ? 3 : 1;
    item.stats.atk = itemId === "sword_iron_01" ? 12 : 0;
    item.stats.def = itemId === "helmet_leather_01" ? 2 : 0;
    item.stats.goldBonus = itemId === "ring_greed_01" ? 0.1 : 0;
    return item;
}

function createMaterial(materialId: string, name: string): MaterialSettings {
    const material = new MaterialSettings();
    material.materialId = materialId;
    material.name = name;
    material.rarity = "common";
    material.icon = `icon_${materialId}`;
    material.description = `${name} description`;
    return material;
}

function createInventoryItem(itemId: string, quantity: number, slotIndex: number): InventoryItemData {
    const item = new InventoryItemData();
    item.itemId = itemId;
    item.quantity = quantity;
    item.slotIndex = slotIndex;
    return item;
}

test("InventoryPresentation.build summarizes equipment, bag items and materials", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.equipment.mainHand = "sword_iron_01";
    userData.game.equipment.head = "helmet_leather_01";
    userData.game.equipment.ring1 = "ring_greed_01";
    userData.game.inventory = [
        createInventoryItem("helmet_leather_01", 1, 1),
        createInventoryItem("sword_iron_01", 1, 0)
    ];
    userData.game.materials.iron_ore = 12;

    const presentation = InventoryPresentation.build(settings, userData);

    expect(presentation.summary).toBe("Equipped: 2 | Bag stacks: 2 | Materials: 1");
    expect(presentation.gearBonusSummary).toBe("Gear: ATK +12, DEF +2");
    expect(presentation.emptyBagLabel).toBe("");
    expect(presentation.emptyMaterialsLabel).toBe("");
    expect(presentation.details).toContain("Weapon: Iron Sword");
    expect(presentation.details).toContain("Ring 1: Ring of Greed");
    expect(presentation.details).toContain("Head: Leather Cap");
    expect(presentation.details).toContain("Iron Sword x1 (equipped)");
    expect(presentation.details).toContain("Leather Cap x1 (equipped)");
    expect(presentation.details).toContain("Iron Ore x12");
    expect(presentation.materials).toEqual([
        {
            materialId: "iron_ore",
            label: "Iron Ore x12",
            subtitle: "Common material",
            description: "Iron Ore description",
            rarity: "common",
            statLine: "Common material",
            iconLabel: "IRO",
            quantity: 12
        }
    ]);
    expect(presentation.items[0]).toEqual(expect.objectContaining({
        itemId: "sword_iron_01",
        subtitle: "Common | Weapon | Lv. 1",
        actionLabel: "Equipped",
        rarity: "common",
        slotLabel: "Weapon",
        statLine: "ATK +12",
        description: "Iron Sword description",
        iconKey: "icon_sword_iron_01",
        iconLabel: "WPN"
    }));
    expect(presentation.items[1]).toEqual(expect.objectContaining({
        itemId: "helmet_leather_01",
        subtitle: "Common | Headgear | Lv. 1",
        actionLabel: "Equipped",
        isEquipped: true,
        rarity: "common",
        slotLabel: "Headgear",
        statLine: "DEF +2",
        description: "Leather Cap description",
        iconKey: "icon_helmet_leather_01",
        iconLabel: "HD"
    }));
});

test("InventoryPresentation.build falls back cleanly when the player has no items", () => {
    const settings = createSettings();
    const userData = new UserData();

    const presentation = InventoryPresentation.build(settings, userData);

    expect(presentation.summary).toBe("Equipped: 0 | Bag stacks: 0 | Materials: 0");
    expect(presentation.gearBonusSummary).toBe("Gear: No active bonuses");
    expect(presentation.emptyBagLabel).toBe("No gear in backpack");
    expect(presentation.emptyMaterialsLabel).toBe("No materials collected");
    expect(presentation.materials).toEqual([]);
    expect(presentation.details).toContain("Bag\nEmpty");
    expect(presentation.details).toContain("Materials\nNone");
});

test("InventoryPresentation.build carries item and material descriptions into readable details", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.inventory = [createInventoryItem("sword_iron_01", 1, 0)];
    userData.game.materials.iron_ore = 4;

    const presentation = InventoryPresentation.build(settings, userData);

    expect(presentation.items[0].description).toBe("Iron Sword description");
    expect(presentation.materials[0].description).toBe("Iron Ore description");
    expect(presentation.materials[0].subtitle).toBe("Common material");
    expect(presentation.materials[0].statLine).toBe("Common material");
    expect(presentation.details).toContain("Iron Sword x1 - Iron Sword description");
    expect(presentation.details).toContain("Iron Ore x4 - Iron Ore description");
});

test("InventoryPresentation.build marks items above player level as locked", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.level = 1;
    userData.game.inventory = [createInventoryItem("ring_greed_01", 1, 0)];

    const presentation = InventoryPresentation.build(settings, userData);

    expect(presentation.items[0]).toEqual(expect.objectContaining({
        itemId: "ring_greed_01",
        subtitle: "Uncommon | Ring | Lv. 3",
        actionLabel: "Locked Lv. 3",
        canEquip: false
    }));
});
