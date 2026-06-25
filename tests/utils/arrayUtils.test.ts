import { shuffle } from "../../assets/Scripts/Services/Utils/ArrayUtils";

test("shuffle shuffles the array", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    try {
        const array: number[] = [0, 1, 2, 3, 4, 5, 6];

        const shuffledArray: number[] = shuffle(array);

        expect(shuffledArray).toEqual([1, 2, 3, 4, 5, 6, 0]);
        expect(array).toEqual([0, 1, 2, 3, 4, 5, 6]);
    } finally {
        randomSpy.mockRestore();
    }
});
