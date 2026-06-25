import { RewardDropResolver } from "../../../assets/Scripts/Game/Data/RewardDrops";

test("RewardDropResolver grants whole reward drops and rolls the fractional remainder", () => {
    expect(RewardDropResolver.resolveDropCount(2.25, () => 0.2)).toBe(3);
    expect(RewardDropResolver.resolveDropCount(2.25, () => 0.3)).toBe(2);
});

test("RewardDropResolver never creates drops for zero or negative rewards", () => {
    expect(RewardDropResolver.resolveDropCount(0, () => 0)).toBe(0);
    expect(RewardDropResolver.resolveDropCount(-1, () => 0)).toBe(0);
});

test("RewardDropResolver treats invalid rewards as no reward", () => {
    expect(RewardDropResolver.resolveDropCount(Number.NaN, () => 0)).toBe(0);
    expect(RewardDropResolver.resolveDropCount(Number.POSITIVE_INFINITY, () => 0)).toBe(0);
});
