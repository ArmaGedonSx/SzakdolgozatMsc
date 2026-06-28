import { GameSettings, ZoneSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { InventoryItemData, UserData } from "../../../assets/Scripts/Game/Data/UserData";
import { MenuQuickActionsPresentation } from "../../../assets/Scripts/Menu/MenuQuickActionsPresentation";

function createZone(zoneId: string, name: string): ZoneSettings {
    const zone = new ZoneSettings();
    zone.zoneId = zoneId;
    zone.name = name;
    return zone;
}

function createInventoryItem(itemId: string, quantity: number): InventoryItemData {
    const item = new InventoryItemData();
    item.itemId = itemId;
    item.quantity = quantity;
    return item;
}

test("MenuQuickActionsPresentation summarizes stage and inventory buttons", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", "Main Arena"),
        createZone("zone_shadow_forest", "Shadow Forest"),
        createZone("zone_crystal_caves", "Crystal Caves")
    ];
    const userData = new UserData();
    userData.game.currentZoneId = "zone_shadow_forest";
    userData.game.clearedZones = ["zone_main_arena"];
    userData.game.inventory = [
        createInventoryItem("sword_iron_01", 1),
        createInventoryItem("ring_greed_01", 0),
        createInventoryItem("boots_runner_01", 2)
    ];

    const presentation = MenuQuickActionsPresentation.build(settings, userData);

    expect(presentation.stageButtonLabel).toBe("Stages");
    expect(presentation.inventoryButtonLabel).toBe("Inventory");
});

test("MenuQuickActionsPresentation falls back cleanly for unknown zones and empty bags", () => {
    const settings = new GameSettings();
    settings.zones = [];
    const userData = new UserData();
    userData.game.currentZoneId = "zone_missing";

    const presentation = MenuQuickActionsPresentation.build(settings, userData);

    expect(presentation.stageButtonLabel).toBe("Stages");
    expect(presentation.inventoryButtonLabel).toBe("Inventory");
});

test("MenuQuickActionsPresentation ignores duplicate and unknown cleared zones", () => {
    const settings = new GameSettings();
    settings.zones = [
        createZone("zone_main_arena", "Main Arena"),
        createZone("zone_shadow_forest", "Shadow Forest")
    ];
    const userData = new UserData();
    userData.game.currentZoneId = "zone_main_arena";
    userData.game.clearedZones = ["zone_main_arena", "zone_main_arena", "zone_missing"];

    const presentation = MenuQuickActionsPresentation.build(settings, userData);

    expect(presentation.stageButtonLabel).toBe("Stages");
});
