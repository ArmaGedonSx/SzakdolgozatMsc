import { MenuGoldPresentation } from "../../../assets/Scripts/Menu/MenuGoldPresentation";

test("MenuGoldPresentation keeps small gold values exact", () => {
    expect(MenuGoldPresentation.format(950)).toBe("950");
});

test("MenuGoldPresentation compacts large gold values for the main menu", () => {
    expect(MenuGoldPresentation.format(1782675465)).toBe("1.8B");
    expect(MenuGoldPresentation.format(1250000)).toBe("1.3M");
    expect(MenuGoldPresentation.format(12500)).toBe("12.5K");
});

test("MenuGoldPresentation clamps invalid gold values", () => {
    expect(MenuGoldPresentation.format(-5)).toBe("0");
});
