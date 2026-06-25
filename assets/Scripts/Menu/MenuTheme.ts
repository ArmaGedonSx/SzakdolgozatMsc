import { ZoneSelectionEntry } from "./ZoneSelectionPresentation";

export type ColorTuple = [number, number, number, number];

export interface MenuCardStyle {
    marker: string;
    titleColor: ColorTuple;
    subtitleColor: ColorTuple;
    disabled: boolean;
}

export class MenuTheme {
    public static forStageTone(tone: ZoneSelectionEntry["tone"]): MenuCardStyle {
        switch (tone) {
            case "current":
                return {
                    marker: "",
                    titleColor: [126, 225, 255, 255],
                    subtitleColor: [188, 238, 255, 255],
                    disabled: true
                };
            case "recommended":
                return {
                    marker: "> ",
                    titleColor: [255, 232, 120, 255],
                    subtitleColor: [255, 244, 190, 255],
                    disabled: false
                };
            case "cleared":
                return {
                    marker: "",
                    titleColor: [132, 230, 142, 255],
                    subtitleColor: [194, 246, 196, 255],
                    disabled: false
                };
            case "locked":
                return {
                    marker: "",
                    titleColor: [150, 150, 150, 255],
                    subtitleColor: [120, 120, 120, 255],
                    disabled: true
                };
            default:
                return {
                    marker: "",
                    titleColor: [235, 235, 220, 255],
                    subtitleColor: [205, 205, 190, 255],
                    disabled: false
                };
        }
    }

    public static forItemRarity(rarity: string): MenuCardStyle {
        switch (rarity) {
            case "uncommon":
                return this.itemStyle([132, 230, 142, 255], [194, 246, 196, 255]);
            case "rare":
                return this.itemStyle([112, 190, 255, 255], [184, 222, 255, 255]);
            case "epic":
                return this.itemStyle([212, 138, 255, 255], [234, 198, 255, 255]);
            case "legendary":
                return this.itemStyle([255, 184, 84, 255], [255, 224, 164, 255]);
            default:
                return this.itemStyle([235, 235, 220, 255], [205, 205, 190, 255]);
        }
    }

    private static itemStyle(titleColor: ColorTuple, subtitleColor: ColorTuple): MenuCardStyle {
        return {
            marker: "",
            titleColor,
            subtitleColor,
            disabled: false
        };
    }
}
