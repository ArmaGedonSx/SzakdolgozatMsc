import { EquippableItemSettings, GameSettings, ItemCategorySettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { InventoryItemData, UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { InventoryState } from "../../../assets/Scripts/Game/Data/InventoryState";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.itemCategories = [
        createCategory("weapon", "mainHand"),
        createCategory("ring", "ring"),
        createCategory("head", "head")
    ];
    settings.equippableItems = [
        createItem("sword_iron_01", "weapon", 1),
        createItem("ring_greed_01", "ring", 1),
        createItem("helmet_leather_01", "head", 1)
    ];
    return settings;
}

function createCategory(categoryId: string, slot: string): ItemCategorySettings {
    const category = new ItemCategorySettings();
    category.categoryId = categoryId;
    category.slot = slot;
    category.maxStack = categoryId === "ring" ? 2 : 1;
    return category;
}

function createItem(itemId: string, categoryId: string, requiredLevel: number): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.categoryId = categoryId;
    item.requiredLevel = requiredLevel;
    return item;
}

function createInventoryItem(itemId: string, quantity: number, slotIndex: number): InventoryItemData {
    const item = new InventoryItemData();
    item.itemId = itemId;
    item.quantity = quantity;
    item.slotIndex = slotIndex;
    return item;
}

test("InventoryState.normalize removes invalid entries, merges duplicates and equips a starter weapon", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.inventory = [
        createInventoryItem("ring_greed_01", 1, 0),
        createInventoryItem("ring_greed_01", 2, 4),
        createInventoryItem("broken_item", 1, 2),
        createInventoryItem("helmet_leather_01", 0, 3)
    ];
    userData.game.equipment.mainHand = null;
    userData.game.equipment.head = "ghost_helmet";

    const result = InventoryState.normalize(settings, userData);

    expect(userData.game.inventory).toEqual([
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 0 }),
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 1, slotIndex: 1 }),
        expect.objectContaining({ itemId: "sword_iron_01", quantity: 1, slotIndex: 2 })
    ]);
    expect(userData.game.equipment.mainHand).toBe("sword_iron_01");
    expect(userData.game.equipment.head).toBeNull();
    expect(result.removedInventoryItems).toEqual(expect.arrayContaining(["broken_item", "helmet_leather_01"]));
    expect(result.clearedEquipmentSlots).toContain("head");
    expect(result.autoEquippedSlots).toContain("mainHand");
});

test("InventoryState.equipItem fills ring slots in order", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.inventory = [createInventoryItem("ring_greed_01", 1, 0)];

    const firstEquip = InventoryState.equipItem(settings, userData, "ring_greed_01");
    const secondEquip = InventoryState.equipItem(settings, userData, "ring_greed_01");

    expect(firstEquip).toBe(true);
    expect(secondEquip).toBe(true);
    expect(userData.game.equipment.ring1).toBe("ring_greed_01");
    expect(userData.game.equipment.ring2).toBe("ring_greed_01");
});

test("InventoryState.normalize clears equipped items above the player level", () => {
    const settings = createSettings();
    settings.equippableItems.push(createItem("helmet_steel_01", "head", 3));
    const userData = new UserData();
    userData.game.level = 1;
    userData.game.equipment.head = "helmet_steel_01";
    userData.game.inventory = [createInventoryItem("helmet_steel_01", 1, 0)];

    const result = InventoryState.normalize(settings, userData);

    expect(userData.game.equipment.head).toBeNull();
    expect(result.clearedEquipmentSlots).toContain("head");
});

test("InventoryState.normalize respects category maxStack when merging inventory", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.inventory = [
        createInventoryItem("ring_greed_01", 1, 0),
        createInventoryItem("ring_greed_01", 4, 1)
    ];

    InventoryState.normalize(settings, userData);

    expect(userData.game.inventory).toEqual([
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 0 }),
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 1 }),
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 1, slotIndex: 2 }),
        expect.objectContaining({ itemId: "sword_iron_01", quantity: 1, slotIndex: 3 })
    ]);
});

test("InventoryState.addItem fills existing partial stacks before creating a new slot", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.inventory = [
        createInventoryItem("ring_greed_01", 1, 0),
        createInventoryItem("ring_greed_01", 2, 1)
    ];

    InventoryState.addItem(settings, userData, "ring_greed_01", 3);

    expect(userData.game.inventory).toEqual([
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 0 }),
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 1 }),
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 2 })
    ]);
});
