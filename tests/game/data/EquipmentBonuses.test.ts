import { EquipmentBonusResolver } from "../../../assets/Scripts/Game/Data/EquipmentBonuses";
import { EquippableItemSettings, GameSettings, ItemCategorySettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.itemCategories = [createCategory("weapon", "mainHand"), createCategory("ring", "ring")];
    settings.equippableItems = [
        createItem("sword_iron_01", "weapon", 1, { atk: 12, critChance: 0.05, critMult: 1.5 }),
        createItem("ring_greed_01", "ring", 1, { goldBonus: 0.1 }),
        createItem("ring_legend_01", "ring", 10, { xpBonus: 0.25 })
    ];
    return settings;
}

function createCategory(categoryId: string, slot: string): ItemCategorySettings {
    const category = new ItemCategorySettings();
    category.categoryId = categoryId;
    category.slot = slot;
    return category;
}

function createItem(itemId: string, categoryId: string, requiredLevel: number, stats: Partial<EquippableItemSettings["stats"]>): EquippableItemSettings {
    const item = new EquippableItemSettings();
    item.itemId = itemId;
    item.categoryId = categoryId;
    item.requiredLevel = requiredLevel;
    Object.assign(item.stats, stats);
    return item;
}

test("EquipmentBonusResolver sums stats from equipped items the player can use", () => {
    const settings = createSettings();
    const userData = new UserData();
    userData.game.level = 3;
    userData.game.equipment.mainHand = "sword_iron_01";
    userData.game.equipment.ring1 = "ring_greed_01";
    userData.game.equipment.ring2 = "ring_legend_01";

    const bonuses = EquipmentBonusResolver.resolve(settings, userData);

    expect(bonuses.atk).toBe(12);
    expect(bonuses.critChance).toBe(0.05);
    expect(bonuses.critMult).toBe(1.5);
    expect(bonuses.goldBonus).toBe(0.1);
    expect(bonuses.xpBonus).toBe(0);
});
