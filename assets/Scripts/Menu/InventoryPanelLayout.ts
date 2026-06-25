import { InventoryTypographyScale } from "./MenuTypography";

export interface InventoryPanelLayoutData {
    materialsTitleY: number;
    materialsContainerY: number;
}

export class InventoryPanelLayout {
    private static readonly itemsContainerY = -112;
    private static readonly defaultMaterialsTitleY = -244;
    private static readonly defaultMaterialsContainerY = -296;
    private static readonly gapAfterBackpack = 74;
    private static readonly materialsContainerOffset = 52;

    public static resolve(type: InventoryTypographyScale, backpackEntryCount: number): InventoryPanelLayoutData {
        const visibleBackpackRows = Math.max(1, Math.ceil(Math.max(0, backpackEntryCount)));
        const lastBackpackCardCenterY = this.itemsContainerY - (visibleBackpackRows - 1) * type.itemRowHeight;
        const lastBackpackCardBottomY = lastBackpackCardCenterY - type.itemCardHeight / 2;
        const materialsTitleY = Math.min(this.defaultMaterialsTitleY, lastBackpackCardBottomY - this.gapAfterBackpack);

        return {
            materialsTitleY,
            materialsContainerY: materialsTitleY - this.materialsContainerOffset
        };
    }
}
