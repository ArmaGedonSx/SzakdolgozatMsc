import { DamageResolver } from "../../../assets/Scripts/Game/Data/DamageResolver";

test("DamageResolver subtracts defense from incoming damage", () => {
    expect(DamageResolver.resolveIncomingDamage(10, 3)).toBe(7);
});

test("DamageResolver keeps at least one point of damage", () => {
    expect(DamageResolver.resolveIncomingDamage(4, 10)).toBe(1);
});
