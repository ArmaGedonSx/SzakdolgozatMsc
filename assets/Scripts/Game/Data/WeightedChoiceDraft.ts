export class WeightedChoiceDraft {
    public static selectWithoutReplacement<T>(
        choices: T[],
        count: number,
        getWeight: (choice: T) => number,
        random: () => number = Math.random
    ): T[] {
        const remaining = choices.filter((choice) => 0 < getWeight(choice));
        const drafted: T[] = [];

        while (drafted.length < count && 0 < remaining.length) {
            const selectedIndex = this.selectIndex(remaining, getWeight, random);
            drafted.push(remaining[selectedIndex]);
            remaining.splice(selectedIndex, 1);
        }

        return drafted;
    }

    private static selectIndex<T>(choices: T[], getWeight: (choice: T) => number, random: () => number): number {
        const totalWeight = choices.reduce((sum, choice) => sum + getWeight(choice), 0);
        let roll = random() * totalWeight;

        for (let index = 0; index < choices.length; index++) {
            roll -= getWeight(choices[index]);
            if (roll <= 0) return index;
        }

        return choices.length - 1;
    }
}
