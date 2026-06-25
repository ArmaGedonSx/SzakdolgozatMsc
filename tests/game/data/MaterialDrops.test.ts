import { GameSettings, MaterialSettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { MaterialDropResolver } from "../../../assets/Scripts/Game/Data/MaterialDrops";
import { UserData } from "../../../assets/Scripts/Game/Data/UserData";

function createSettings(): GameSettings {
    const settings = new GameSettings();
    settings.materials = [
        createMaterial("mat_common_ore", ["zone_main_arena"], 3),
        createMaterial("mat_rare_essence", ["zone_main_arena"], 1),
        createMaterial("mat_swamp_herb", ["zone_swamp"], 5)
    ];
    return settings;
}

function createMaterial(materialId: string, dropZones: string[], dropWeight: number): MaterialSettings {
    const material = new MaterialSettings();
    material.materialId = materialId;
    material.dropZones = dropZones;
    material.dropWeight = dropWeight;
    return material;
}

test("MaterialDropResolver chooses only materials available in the current zone", () => {
    const settings = createSettings();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.2);

    const drop = MaterialDropResolver.tryResolveDrop(settings, "zone_main_arena");

    expect(drop).toBe("mat_common_ore");
    randomSpy.mockRestore();
});

test("MaterialDropResolver can resolve later weighted entries and merges collected quantities", () => {
    const settings = createSettings();
    const userData = new UserData();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.95);

    const drop = MaterialDropResolver.tryResolveDrop(settings, "zone_main_arena");
    MaterialDropResolver.applyCollectedMaterials(userData, {
        mat_common_ore: 2,
        mat_rare_essence: 1,
        ignored_zero: 0
    });

    expect(drop).toBe("mat_rare_essence");
    expect(userData.game.materials).toEqual({
        mat_common_ore: 2,
        mat_rare_essence: 1
    });
    randomSpy.mockRestore();
});
