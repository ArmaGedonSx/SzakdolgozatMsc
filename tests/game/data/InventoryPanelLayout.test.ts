import { InventoryPanelLayout } from "../../../assets/Scripts/Menu/InventoryPanelLayout";
import { MenuTypography } from "../../../assets/Scripts/Menu/MenuTypography";

describe("InventoryPanelLayout", () => {
    it("moves the materials section below visible backpack cards", () => {
        const layout = InventoryPanelLayout.resolve(MenuTypography.inventory, 2);

        expect(layout.materialsTitleY).toBeLessThanOrEqual(-378);
        expect(layout.materialsContainerY).toBeLessThan(layout.materialsTitleY);
    });

    it("keeps the materials section clear of the larger empty backpack placeholder", () => {
        const layout = InventoryPanelLayout.resolve(MenuTypography.inventory, 0);

        expect(layout.materialsTitleY).toBeLessThanOrEqual(-256);
        expect(layout.materialsContainerY).toBe(layout.materialsTitleY - 52);
    });
});
