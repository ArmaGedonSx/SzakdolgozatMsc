import { WeightedChoiceDraft } from "../../../assets/Scripts/Game/Data/WeightedChoiceDraft";

interface Choice {
    id: string;
    weight: number;
}

test("WeightedChoiceDraft chooses by configured weights without replacement", () => {
    const choices: Choice[] = [
        { id: "common", weight: 1 },
        { id: "featured", weight: 3 },
        { id: "rare", weight: 1 }
    ];

    const drafted = WeightedChoiceDraft.selectWithoutReplacement(choices, 2, (choice) => choice.weight, () => 0.3);

    expect(drafted.map((choice) => choice.id)).toEqual(["featured", "common"]);
});

test("WeightedChoiceDraft skips non-positive weights", () => {
    const choices: Choice[] = [
        { id: "disabled", weight: 0 },
        { id: "enabled", weight: 1 }
    ];

    const drafted = WeightedChoiceDraft.selectWithoutReplacement(choices, 2, (choice) => choice.weight, () => 0);

    expect(drafted.map((choice) => choice.id)).toEqual(["enabled"]);
});
