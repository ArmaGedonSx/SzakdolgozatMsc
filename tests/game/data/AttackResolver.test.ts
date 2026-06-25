import { AttackResolver } from "../../../assets/Scripts/Game/Data/AttackResolver";

test("AttackResolver keeps base damage when crit roll fails", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.9);

    expect(AttackResolver.resolveOutgoingDamage(10, 0.25, 1.5)).toBe(10);
    randomSpy.mockRestore();
});

test("AttackResolver multiplies damage when crit roll succeeds", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.1);

    expect(AttackResolver.resolveOutgoingDamage(10, 0.25, 1.5)).toBe(15);
    randomSpy.mockRestore();
});
