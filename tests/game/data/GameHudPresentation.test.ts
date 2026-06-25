import { GameHudPresentation } from "../../../assets/Scripts/Game/Data/GameHudPresentation";

test("GameHudPresentation shows survived time, current level and kill count", () => {
    expect(GameHudPresentation.formatRunStatus(123.9, 7, 8)).toBe("123s | Lv. 7 | Kills: 8");
});

test("GameHudPresentation clamps invalid values for stable HUD output", () => {
    expect(GameHudPresentation.formatRunStatus(Number.NaN, -2, -4)).toBe("0s | Lv. 1 | Kills: 0");
});

test("GameHudPresentation warns before upcoming boss milestones", () => {
    expect(GameHudPresentation.formatRunStatus(19, 2, 5, [30])).toBe("19s | Lv. 2 | Kills: 5");
    expect(GameHudPresentation.formatRunStatus(25.1, 2, 5, [30])).toBe("25s | Lv. 2 | Kills: 5 | Boss in 5s");
    expect(GameHudPresentation.formatRunStatus(30, 2, 5, [30])).toBe("30s | Lv. 2 | Kills: 5 | Boss incoming!");
    expect(GameHudPresentation.formatRunStatus(31, 2, 5, [30])).toBe("31s | Lv. 2 | Kills: 5");
});

test("GameHudPresentation warns for the nearest horde or boss event", () => {
    expect(GameHudPresentation.formatRunStatus(15.2, 2, 5, { hordeMilestones: [20], bossMilestones: [30] })).toBe(
        "15s | Lv. 2 | Kills: 5 | Horde in 5s"
    );
    expect(GameHudPresentation.formatRunStatus(20, 2, 5, { hordeMilestones: [20], bossMilestones: [30] })).toBe(
        "20s | Lv. 2 | Kills: 5 | Horde incoming!"
    );
    expect(GameHudPresentation.formatRunStatus(25.2, 2, 5, { hordeMilestones: [20], bossMilestones: [30] })).toBe(
        "25s | Lv. 2 | Kills: 5 | Boss in 5s"
    );
});

test("GameHudPresentation shows stage objective progress when a survival target exists", () => {
    expect(GameHudPresentation.formatRunStatus(42.6, 3, 9, { targetSurvivalSeconds: 120 })).toBe(
        "42s | Goal: 78s | Lv. 3 | Kills: 9"
    );
    expect(GameHudPresentation.formatRunStatus(120, 3, 9, { targetSurvivalSeconds: 120 })).toBe(
        "120s | Stage clear! | Lv. 3 | Kills: 9"
    );
});
