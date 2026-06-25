import { MenuTypography } from "../../../assets/Scripts/Menu/MenuTypography";

describe("MenuTypography", () => {
    it("uses a readable inventory hierarchy from panel title to item detail text", () => {
        const inventory = MenuTypography.inventory;

        expect(inventory.panelTitleSize).toBeGreaterThan(inventory.sectionTitleSize);
        expect(inventory.sectionTitleSize).toBeGreaterThanOrEqual(inventory.summarySize);
        expect(inventory.itemTitleSize).toBeGreaterThan(inventory.itemSubtitleSize);
        expect(inventory.itemTitleSize).toBeGreaterThanOrEqual(42);
        expect(inventory.itemSubtitleSize).toBeGreaterThanOrEqual(32);
        expect(inventory.itemStatSize).toBeGreaterThanOrEqual(30);
        expect(inventory.summarySize).toBeGreaterThanOrEqual(32);
        expect(inventory.equipmentTitleSize).toBeGreaterThanOrEqual(34);
    });

    it("keeps inventory item cards and badges large enough for quick scanning", () => {
        const inventory = MenuTypography.inventory;

        expect(inventory.itemCardHeight).toBeGreaterThanOrEqual(164);
        expect(inventory.itemRowHeight).toBeGreaterThanOrEqual(inventory.itemCardHeight + 20);
        expect(inventory.itemBadgeSize).toBeGreaterThanOrEqual(100);
        expect(inventory.itemBadgeFontSize).toBeGreaterThanOrEqual(32);
    });

    it("keeps inventory text boxes tall enough for the larger hierarchy", () => {
        const inventory = MenuTypography.inventory;

        expect(inventory.itemTitleHeight).toBeGreaterThanOrEqual(inventory.itemTitleLineHeight + 8);
        expect(inventory.itemSubtitleHeight).toBeGreaterThanOrEqual(inventory.itemSubtitleLineHeight + 6);
        expect(inventory.itemStatHeight).toBeGreaterThanOrEqual(inventory.itemStatLineHeight + 6);
        expect(inventory.itemStatHeight).toBeGreaterThanOrEqual(inventory.itemStatLineHeight * 2 + 6);
    });

    it("uses readable stage card typography for survivor-style stage selection", () => {
        const stage = MenuTypography.stage;

        expect(stage.panelTitleSize).toBeGreaterThan(stage.summarySize);
        expect(stage.cardTitleSize).toBeGreaterThan(stage.cardSubtitleSize);
        expect(stage.summarySize).toBeGreaterThanOrEqual(28);
        expect(stage.cardTitleSize).toBeGreaterThanOrEqual(30);
        expect(stage.cardSubtitleSize).toBeGreaterThanOrEqual(24);
        expect(stage.cardHeight).toBeGreaterThanOrEqual(92);
        expect(stage.cardRowHeight).toBeGreaterThanOrEqual(stage.cardHeight + 14);
        expect(stage.badgeSize).toBeGreaterThanOrEqual(72);
    });
});
