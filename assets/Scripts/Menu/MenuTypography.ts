export interface InventoryTypographyScale {
    panelTitleSize: number;
    panelTitleLineHeight: number;
    summarySize: number;
    summaryLineHeight: number;
    sectionTitleSize: number;
    sectionTitleLineHeight: number;
    equipmentTitleSize: number;
    equipmentLineHeight: number;
    itemTitleSize: number;
    itemTitleLineHeight: number;
    itemSubtitleSize: number;
    itemSubtitleLineHeight: number;
    itemStatSize: number;
    itemStatLineHeight: number;
    itemCardHeight: number;
    itemRowHeight: number;
    itemBadgeSize: number;
    itemBadgeFontSize: number;
    itemTitleWidth: number;
    itemSubtitleWidth: number;
    itemStatWidth: number;
    itemTitleHeight: number;
    itemSubtitleHeight: number;
    itemStatHeight: number;
}

export interface StageTypographyScale {
    panelTitleSize: number;
    panelTitleLineHeight: number;
    summarySize: number;
    summaryLineHeight: number;
    cardTitleSize: number;
    currentCardTitleSize: number;
    cardTitleLineHeight: number;
    cardSubtitleSize: number;
    cardSubtitleLineHeight: number;
    cardHeight: number;
    cardRowHeight: number;
    badgeSize: number;
    badgeFontSize: number;
    cardTitleWidth: number;
    cardSubtitleWidth: number;
    cardTitleHeight: number;
    cardSubtitleHeight: number;
}

export class MenuTypography {
    public static readonly inventory: InventoryTypographyScale = {
        panelTitleSize: 56,
        panelTitleLineHeight: 58,
        summarySize: 32,
        summaryLineHeight: 35,
        sectionTitleSize: 38,
        sectionTitleLineHeight: 41,
        equipmentTitleSize: 34,
        equipmentLineHeight: 36,
        itemTitleSize: 42,
        itemTitleLineHeight: 44,
        itemSubtitleSize: 32,
        itemSubtitleLineHeight: 34,
        itemStatSize: 30,
        itemStatLineHeight: 32,
        itemCardHeight: 198,
        itemRowHeight: 220,
        itemBadgeSize: 102,
        itemBadgeFontSize: 33,
        itemTitleWidth: 352,
        itemSubtitleWidth: 352,
        itemStatWidth: 352,
        itemTitleHeight: 54,
        itemSubtitleHeight: 42,
        itemStatHeight: 72
    };

    public static readonly stage: StageTypographyScale = {
        panelTitleSize: 48,
        panelTitleLineHeight: 50,
        summarySize: 28,
        summaryLineHeight: 30,
        cardTitleSize: 30,
        currentCardTitleSize: 32,
        cardTitleLineHeight: 32,
        cardSubtitleSize: 24,
        cardSubtitleLineHeight: 26,
        cardHeight: 96,
        cardRowHeight: 112,
        badgeSize: 74,
        badgeFontSize: 24,
        cardTitleWidth: 350,
        cardSubtitleWidth: 350,
        cardTitleHeight: 36,
        cardSubtitleHeight: 32
    };
}
