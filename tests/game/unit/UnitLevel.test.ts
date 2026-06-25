import { UnitLevel } from "../../../assets/Scripts/Game/Unit/UnitLevel";

test("UnitLevel can start from saved progression values", () => {
    const level = new UnitLevel([10, 20, 30], 1, 2, 7);

    expect(level.CurrentLevel).toBe(3);
    expect(level.XP).toBe(7);
    expect(level.RequiredXP).toBe(30);
});

test("UnitLevel exposes updated progression after gaining xp", () => {
    const level = new UnitLevel([10, 20, 30], 1, 0, 5);

    level.addXp(10);

    expect(level.CurrentLevel).toBe(2);
    expect(level.XP).toBe(5);
    expect(level.RequiredXP).toBe(20);
});
