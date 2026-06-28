import { GameHudPresentation } from "../../../assets/Scripts/Game/Data/GameHudPresentation";

test("GameHudPresentation shows survived time and kill count", () => {
    expect(GameHudPresentation.formatRunStatus(123.9, 7, 8)).toBe("123");
});

test("GameHudPresentation clamps invalid values for stable HUD output", () => {
    expect(GameHudPresentation.formatRunStatus(Number.NaN, -2, -4)).toBe("0");
});

test("GameHudPresentation warns before upcoming boss milestones", () => {
    expect(GameHudPresentation.formatRunStatus(19, 2, 5, [30])).toBe("19");
    expect(GameHudPresentation.formatRunStatus(25.1, 2, 5, [30])).toBe("25");
    expect(GameHudPresentation.formatRunStatus(30, 2, 5, [30])).toBe("30");
    expect(GameHudPresentation.formatRunStatus(31, 2, 5, [30])).toBe("31");
});

test("GameHudPresentation warns for the nearest horde or boss event", () => {
    expect(GameHudPresentation.formatRunStatus(15.2, 2, 5, { hordeMilestones: [20], bossMilestones: [30] })).toBe("15");
    expect(GameHudPresentation.formatRunStatus(20, 2, 5, { hordeMilestones: [20], bossMilestones: [30] })).toBe("20");
    expect(GameHudPresentation.formatRunStatus(25.2, 2, 5, { hordeMilestones: [20], bossMilestones: [30] })).toBe("25");
});

test("GameHudPresentation shows stage objective progress when a survival target exists", () => {
    expect(GameHudPresentation.formatRunStatus(42.6, 3, 9, { targetSurvivalSeconds: 120 })).toBe("42");
    expect(GameHudPresentation.formatRunStatus(120, 3, 9, { targetSurvivalSeconds: 120 })).toBe("120");
});
