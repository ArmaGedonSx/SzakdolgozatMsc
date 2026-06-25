import { EquippableItemSettings, GameSettings, ItemCategorySettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { ItemDropResolver } from "../../../assets/Scripts/Game/Data/ItemDrops";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.itemCategories = [createCategory("weapon", "mainHand", 1), createCategory("ring", "ring", 2)];
    settings.equippableItems = [
        createItem("sword_iron_01", "weapon", ["zone_main_arena"], 3),
        createItem("ring_greed_01", "ring", ["zone_main_arena"], 1),
        createItem("ring_swamp_01", "ring", ["zone_swamp"], 5)
    ];
    return settings;
}

function createCategory(categoryId: string, slot: string, maxStack: number): ItemCategorySettings {
    const category = new ItemCategorySettings();
    category.categoryId = categoryId;
    category.slot = slot;
    category.maxStack = maxStack;
    return category;
}

function createItem(itemId: string, categoryId: string, dropZones: string[], dropWeight: number): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.categoryId = categoryId;
    item.dropZones = dropZones;
    item.dropWeight = dropWeight;
    return item;
}

test("ItemDropResolver chooses only items available in the current zone", () => {
    const settings = createSettings();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.2);

    const drop = ItemDropResolver.tryResolveDrop(settings, "zone_main_arena");

    expect(drop).toBe("sword_iron_01");
    randomSpy.mockRestore();
});

test("ItemDropResolver can resolve later weighted entries and applies collected items through inventory stacking", () => {
    const settings = createSettings();
    const userData = new UserData();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.95);

    const drop = ItemDropResolver.tryResolveDrop(settings, "zone_main_arena");
    ItemDropResolver.applyCollectedItems(settings, userData, {
        ring_greed_01: 3,
        sword_iron_01: 1,
        ignored_zero: 0
    });

    expect(drop).toBe("ring_greed_01");
    expect(userData.game.inventory).toEqual([
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 2, slotIndex: 0 }),
        expect.objectContaining({ itemId: "ring_greed_01", quantity: 1, slotIndex: 1 }),
        expect.objectContaining({ itemId: "sword_iron_01", quantity: 1, slotIndex: 2 })
    ]);
    randomSpy.mockRestore();
});
