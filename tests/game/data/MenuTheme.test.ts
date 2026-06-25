import { MenuTheme } from "../../../assets/Scripts/Menu/MenuTheme";

test("MenuTheme returns distinct stage card styles by state", () => {
    expect(MenuTheme.forStageTone("recommended")).toEqual({
        marker: "> ",
        titleColor: [255, 232, 120, 255],
        subtitleColor: [255, 244, 190, 255],
        disabled: false
    });
    expect(MenuTheme.forStageTone("current")).toEqual(expect.objectContaining({
        marker: "",
        titleColor: [126, 225, 255, 255],
        disabled: true
    }));
    expect(MenuTheme.forStageTone("locked")).toEqual(expect.objectContaining({
        titleColor: [150, 150, 150, 255],
        disabled: true
    }));
    expect(MenuTheme.forStageTone("cleared")).toEqual(expect.objectContaining({
        titleColor: [132, 230, 142, 255],
        disabled: false
    }));
});

test("MenuTheme returns readable item rarity styles", () => {
    expect(MenuTheme.forItemRarity("common").titleColor).toEqual([235, 235, 220, 255]);
    expect(MenuTheme.forItemRarity("uncommon").titleColor).toEqual([132, 230, 142, 255]);
    expect(MenuTheme.forItemRarity("rare").titleColor).toEqual([112, 190, 255, 255]);
    expect(MenuTheme.forItemRarity("epic").titleColor).toEqual([212, 138, 255, 255]);
    expect(MenuTheme.forItemRarity("").titleColor).toEqual([235, 235, 220, 255]);
});
