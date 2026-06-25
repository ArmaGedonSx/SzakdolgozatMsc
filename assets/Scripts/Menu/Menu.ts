import { approx, BlockInputEvents, Button, Canvas, Color, Component, instantiate, input, Input, KeyCode, Label, Node, Overflow, UITransform, Vec3, _decorator } from "cc";
import { AppRoot } from "../AppRoot/AppRoot";
import { requireAppRootAsync } from "../AppRoot/AppRootUtils";
import { InventoryState, EquipmentSlotKey } from "../Game/Data/InventoryState";
import { MetaUpgradeSettings } from "../Game/Data/GameSettings";
import { OfflineProgressState } from "../Game/Data/OfflineProgressState";
import { MetaUpgradesData } from "../Game/Data/UserData";
import { UIButton } from "../Services/UI/Button/UIButton";
import { GameRunner } from "./GameRunner";
import { InventoryPanelLayout } from "./InventoryPanelLayout";
import { InventoryPresentation } from "./InventoryPresentation";
import { ColorTuple, MenuTheme } from "./MenuTheme";
import { MenuQuickActionsPresentation } from "./MenuQuickActionsPresentation";
import { MenuTypography } from "./MenuTypography";
import { MenuModalLauncher } from "./ModalWindows/MenuModalLauncher";
import { OfflineRewardPresentation } from "./OfflineRewardPresentation";
import { PlayerProfilePresentation } from "./PlayerProfilePresentation";
import { ZoneSelectionPresentation } from "./ZoneSelectionPresentation";
import { ZoneSelectionState } from "./ZoneSelectionState";

const { ccclass, property } = _decorator;

@ccclass("Menu")
export class Menu extends Component {
    @property(UIButton) private playBtn: UIButton;
    @property(UIButton) private upgradeBtn: UIButton;
    @property(Node) private upgradeAvailableIndicator: Node;
    @property(Node) private goldCounter: Node;
    @property(Label) private goldLabel: Label;
    @property(UIButton) private audioSettingsBtn: UIButton;
    @property(Canvas) private menuCanvas: Canvas;
    @property(Label) private highscoreLabel: Label;

    private menuModalLauncher: MenuModalLauncher;
    private inventoryBtn: UIButton | null = null;
    private inventoryBtnLabel: Label | null = null;
    private offlineRewardBtn: UIButton | null = null;
    private offlineRewardBtnLabel: Label | null = null;
    private inventoryPanel: Node | null = null;
    private inventorySummaryLabel: Label | null = null;
    private inventoryEquipmentContainer: Node | null = null;
    private inventoryItemsContainer: Node | null = null;
    private inventoryMaterialsTitle: Node | null = null;
    private inventoryMaterialsContainer: Node | null = null;
    private zoneBtn: UIButton | null = null;
    private zoneBtnLabel: Label | null = null;
    private zonePanel: Node | null = null;
    private zoneSummaryLabel: Label | null = null;
    private zoneListContainer: Node | null = null;

    public async start(): Promise<void> {
        await requireAppRootAsync();
        this.menuCanvas.cameraComponent = AppRoot.Instance.MainCamera;

        this.playBtn.InteractedEvent.on(this.startGame, this);
        this.upgradeBtn.InteractedEvent.on(this.openUpgradesWindow, this);
        this.audioSettingsBtn.InteractedEvent.on(this.openAudioSettingsWindow, this);

        this.menuModalLauncher = new MenuModalLauncher(AppRoot.Instance.ModalWindowManager);
        this.createOfflineRewardButton();
        this.createInventoryButton();
        this.createZoneButton();
        this.createInventoryPanel();
        this.createZonePanel();

        this.refreshHighscoreLabel();
        this.refreshQuickActionLabels();

        this.updateGoldIndicators();

        // Cheat code: Press G to add 10000 gold
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    public onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: any): void {
        if (event.keyCode === KeyCode.KEY_G) {
            AppRoot.Instance.LiveUserData.game.goldCoins += 10000;
            AppRoot.Instance.saveUserData();
            this.updateGoldIndicators();
            console.log(`[CHEAT] Added 10000 gold! Total: ${AppRoot.Instance.LiveUserData.game.goldCoins}`);
        }
    }

    private updateGoldIndicators(): void {
        this.upgradeAvailableIndicator.active = this.isUpgradeAffordable();

        const goldCoins = AppRoot.Instance.LiveUserData.game.goldCoins;
        this.goldCounter.active = 0 < goldCoins;
        this.goldLabel.string = goldCoins.toString();

        if (this.inventoryPanel?.active) {
            this.refreshInventoryPanel();
        }
        this.refreshOfflineRewardButton();
        this.refreshQuickActionLabels();
    }

    private refreshHighscoreLabel(): void {
        const userData = AppRoot.Instance.LiveUserData;
        this.highscoreLabel.string = PlayerProfilePresentation.build(AppRoot.Instance.Settings, userData);
    }

    private isUpgradeAffordable(): boolean {
        const goldCoins: number = AppRoot.Instance.LiveUserData.game.goldCoins;
        const metaUpgrades: MetaUpgradesData = AppRoot.Instance.LiveUserData.game.metaUpgrades;

        const metaUpgradesSettings = AppRoot.Instance.Settings.metaUpgrades;

        const costs: number[] = [];
        this.tryPushLowestCost(metaUpgrades.goldGathererLevel, metaUpgradesSettings.goldGatherer, costs);
        this.tryPushLowestCost(metaUpgrades.healthLevel, metaUpgradesSettings.health, costs);
        this.tryPushLowestCost(metaUpgrades.movementSpeedLevel, metaUpgradesSettings.movementSpeed, costs);
        this.tryPushLowestCost(metaUpgrades.overallDamageLevel, metaUpgradesSettings.overallDamage, costs);
        this.tryPushLowestCost(metaUpgrades.projectilePiercingLevel, metaUpgradesSettings.projectilePiercing, costs);
        this.tryPushLowestCost(metaUpgrades.xpGathererLevel, metaUpgradesSettings.xpGatherer, costs);

        return 0 < costs.length ? Math.min(...costs) <= goldCoins : false;
    }

    private tryPushLowestCost(upgradeLevel: number, metaUpgradeSettings: MetaUpgradeSettings, costs: number[]): void {
        if (upgradeLevel < metaUpgradeSettings.costs.length) {
            costs.push(metaUpgradeSettings.costs[upgradeLevel]);
        }
    }

    private startGame(): void {
        AppRoot.Instance.ScreenFader.playOpen();
        GameRunner.Instance.playGame();
    }

    private async openUpgradesWindow(): Promise<void> {
        await this.menuModalLauncher.openUpgradesWindow();
        this.updateGoldIndicators();
    }

    private openAudioSettingsWindow(): void {
        this.menuModalLauncher.openAudioSettingsWindow();
    }

    private createInventoryButton(): void {
        const inventoryBtnNode = instantiate(this.upgradeBtn.node);
        inventoryBtnNode.name = "InventoryBtn";
        inventoryBtnNode.setParent(this.node);
        inventoryBtnNode.setPosition(new Vec3(0, -101.9145, 0));

        const inventoryLabel = inventoryBtnNode.getComponentInChildren(Label);
        if (inventoryLabel) {
            inventoryLabel.string = "Inventory";
            this.inventoryBtnLabel = inventoryLabel;
        }

        this.inventoryBtn = inventoryBtnNode.getComponent(UIButton);
        this.inventoryBtn?.InteractedEvent.on(this.toggleInventoryPanel, this);
    }

    private createOfflineRewardButton(): void {
        const offlineRewardBtnNode = instantiate(this.upgradeBtn.node);
        offlineRewardBtnNode.name = "OfflineRewardBtn";
        offlineRewardBtnNode.setParent(this.node);
        offlineRewardBtnNode.setPosition(new Vec3(0, -50, 0));

        const offlineRewardLabel = offlineRewardBtnNode.getComponentInChildren(Label);
        if (offlineRewardLabel) {
            this.offlineRewardBtnLabel = offlineRewardLabel;
        }

        this.offlineRewardBtn = offlineRewardBtnNode.getComponent(UIButton);
        this.offlineRewardBtn?.InteractedEvent.on(this.claimOfflineReward, this);
        this.refreshOfflineRewardButton();
    }

    private claimOfflineReward(): void {
        OfflineProgressState.collect(AppRoot.Instance.LiveUserData);
        AppRoot.Instance.saveUserData();
        this.updateGoldIndicators();
        this.refreshHighscoreLabel();
    }

    private refreshOfflineRewardButton(): void {
        if (!this.offlineRewardBtn?.node || !this.offlineRewardBtnLabel) return;

        const presentation = OfflineRewardPresentation.build(AppRoot.Instance.LiveUserData);
        this.offlineRewardBtn.node.active = presentation.isVisible;
        this.offlineRewardBtnLabel.string = presentation.buttonLabel;
    }

    private createInventoryPanel(): void {
        const panelNode = new Node("InventoryPanel");
        panelNode.setParent(this.node);
        panelNode.setPosition(new Vec3(0, -8, 0));
        panelNode.active = false;
        this.inventoryPanel = panelNode;

        const type = MenuTypography.inventory;

        this.createInputBlockingBackdrop(panelNode, "InventoryPanelBackdrop", 610, 700);
        this.createPanelBackButton(panelNode, 242, 292, this.closeInventoryPanel);

        const titleLabelNode = instantiate(this.highscoreLabel.node);
        titleLabelNode.name = "InventoryTitle";
        titleLabelNode.setParent(panelNode);
        titleLabelNode.setPosition(new Vec3(0, 292, 0));
        this.applyLabelLayout(titleLabelNode.getComponent(Label), 500, 62, type.panelTitleSize, type.panelTitleLineHeight);
        titleLabelNode.getComponent(Label)!.string = "Inventory";

        const summaryLabelNode = instantiate(this.highscoreLabel.node);
        summaryLabelNode.name = "InventorySummary";
        summaryLabelNode.setParent(panelNode);
        summaryLabelNode.setPosition(new Vec3(0, 236, 0));
        this.inventorySummaryLabel = summaryLabelNode.getComponent(Label);
        this.applyLabelLayout(this.inventorySummaryLabel, 530, 72, type.summarySize, type.summaryLineHeight);

        const equipmentLabelNode = instantiate(this.highscoreLabel.node);
        equipmentLabelNode.name = "InventoryEquipmentTitle";
        equipmentLabelNode.setParent(panelNode);
        equipmentLabelNode.setPosition(new Vec3(0, 196, 0));
        this.applyLabelLayout(equipmentLabelNode.getComponent(Label), 530, 44, type.sectionTitleSize, type.sectionTitleLineHeight);
        equipmentLabelNode.getComponent(Label)!.string = "Equipment";

        const equipmentContainer = new Node("InventoryEquipmentContainer");
        equipmentContainer.setParent(panelNode);
        equipmentContainer.setPosition(new Vec3(0, 136, 0));
        this.inventoryEquipmentContainer = equipmentContainer;

        const itemsLabelNode = instantiate(this.highscoreLabel.node);
        itemsLabelNode.name = "InventoryItemsTitle";
        itemsLabelNode.setParent(panelNode);
        itemsLabelNode.setPosition(new Vec3(0, -38, 0));
        this.applyLabelLayout(itemsLabelNode.getComponent(Label), 530, 44, type.sectionTitleSize, type.sectionTitleLineHeight);
        itemsLabelNode.getComponent(Label)!.string = "Backpack";

        const itemsContainer = new Node("InventoryItemsContainer");
        itemsContainer.setParent(panelNode);
        itemsContainer.setPosition(new Vec3(0, -112, 0));
        this.inventoryItemsContainer = itemsContainer;

        const materialsLabelNode = instantiate(this.highscoreLabel.node);
        materialsLabelNode.name = "InventoryMaterialsTitle";
        materialsLabelNode.setParent(panelNode);
        materialsLabelNode.setPosition(new Vec3(0, -244, 0));
        this.inventoryMaterialsTitle = materialsLabelNode;
        this.applyLabelLayout(materialsLabelNode.getComponent(Label), 530, 44, type.sectionTitleSize, type.sectionTitleLineHeight);
        materialsLabelNode.getComponent(Label)!.string = "Materials";

        const materialsContainer = new Node("InventoryMaterialsContainer");
        materialsContainer.setParent(panelNode);
        materialsContainer.setPosition(new Vec3(0, -296, 0));
        this.inventoryMaterialsContainer = materialsContainer;

        this.refreshInventoryPanel();
    }

    private applyLabelLayout(label: Label | null, width: number, height: number, fontSize: number, lineHeight: number): void {
        if (!label) return;

        const transform = label.getComponent(UITransform);
        transform?.setContentSize(width, height);
        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.overflow = Overflow.SHRINK;
    }

    private toggleInventoryPanel(): void {
        if (!this.inventoryPanel) return;

        this.inventoryPanel.active = !this.inventoryPanel.active;
        if (this.inventoryPanel.active && this.zonePanel) {
            this.zonePanel.active = false;
        }
        if (this.inventoryPanel.active) {
            this.refreshInventoryPanel();
        }
    }

    private closeInventoryPanel(): void {
        if (this.inventoryPanel) {
            this.inventoryPanel.active = false;
        }
    }

    private refreshInventoryPanel(): void {
        if (!this.inventorySummaryLabel || !this.inventoryEquipmentContainer || !this.inventoryItemsContainer || !this.inventoryMaterialsTitle || !this.inventoryMaterialsContainer) return;

        const presentation = InventoryPresentation.build(AppRoot.Instance.Settings, AppRoot.Instance.LiveUserData);
        const type = MenuTypography.inventory;
        this.inventorySummaryLabel.string = `${presentation.summary}\n${presentation.gearBonusSummary}`;
        this.rebuildInventoryButtons(this.inventoryEquipmentContainer, presentation.equipment, this.onEquipmentClicked.bind(this), 2, 0, 58);
        const itemEntries: any[] = presentation.items.length > 0 ? presentation.items : [{ placeholderId: "empty_bag", label: presentation.emptyBagLabel, isEmpty: true }];
        const materialEntries: any[] = presentation.materials.length > 0 ? presentation.materials : [{ placeholderId: "empty_materials", label: presentation.emptyMaterialsLabel, isEmpty: true }];
        const layout = InventoryPanelLayout.resolve(type, itemEntries.length);
        this.inventoryMaterialsTitle.setPosition(new Vec3(0, layout.materialsTitleY, 0));
        this.inventoryMaterialsContainer.setPosition(new Vec3(0, layout.materialsContainerY, 0));
        this.rebuildInventoryButtons(this.inventoryItemsContainer, itemEntries, this.onInventoryItemClicked.bind(this), 1, 0, type.itemRowHeight);
        this.rebuildInventoryButtons(this.inventoryMaterialsContainer, materialEntries, () => undefined, 1, 0, presentation.materials.length > 0 ? type.itemRowHeight : 58);
    }

    private onEquipmentClicked(slot: EquipmentSlotKey): void {
        InventoryState.unequipItem(AppRoot.Instance.LiveUserData, slot);
        AppRoot.Instance.saveUserData();
        this.refreshInventoryPanel();
        this.refreshQuickActionLabels();
    }

    private onInventoryItemClicked(itemId: string): void {
        const equipped = InventoryState.equipItem(AppRoot.Instance.Settings, AppRoot.Instance.LiveUserData, itemId);
        if (!equipped) return;

        AppRoot.Instance.saveUserData();
        this.refreshInventoryPanel();
        this.refreshQuickActionLabels();
    }

    private rebuildInventoryButtons<T>(
        container: Node,
        entries: T[],
        onClick: (value: any) => void,
        columns: number,
        startOffsetY: number,
        rowHeight: number
    ): void {
        container.destroyAllChildren();

        const hasCardSubtitle = entries.some((entry: any) => !!entry.subtitle);
        const hasCompactBadge = entries.some((entry: any) => !!entry.materialId);
        const type = MenuTypography.inventory;
        const buttonWidth = hasCardSubtitle ? 510 : 238;
        const buttonSpacingX = 254;

        entries.forEach((entry: any, index: number) => {
            const buttonNode = instantiate(this.upgradeBtn.node);
            buttonNode.setParent(container);
            buttonNode.setScale(new Vec3(1, 1, 1));
            buttonNode.name = entry.placeholderId ? `InventoryPlaceholder_${entry.placeholderId}` : entry.materialId ? `InventoryMaterial_${entry.materialId}` : entry.itemId ? `InventoryItem_${entry.itemId}` : `InventorySlot_${entry.slot}`;

            const row = Math.floor(index / columns);
            const column = index % columns;
            const x = columns === 1 ? 0 : column === 0 ? -buttonSpacingX / 2 : buttonSpacingX / 2;
            const y = startOffsetY - row * rowHeight;
            buttonNode.setPosition(new Vec3(x, y, 0));
            const buttonHeight = entry.subtitle ? type.itemCardHeight : 52;
            buttonNode.getComponent(UITransform)?.setContentSize(buttonWidth, buttonHeight);

            const label = buttonNode.getComponentInChildren(Label);
            const style = entry.rarity ? MenuTheme.forItemRarity(entry.rarity) : null;
            if (label) {
                label.string = this.resolveInventoryButtonTitle(entry);
                label.node.setPosition(new Vec3(entry.subtitle ? 78 : entry.materialId ? 28 : 0, entry.subtitle ? 50 : 0, 0));
                label.fontSize = entry.subtitle ? type.itemTitleSize : type.equipmentTitleSize;
                label.lineHeight = entry.subtitle ? type.itemTitleLineHeight : type.equipmentLineHeight;
                label.overflow = Overflow.SHRINK;
                if (style) this.applyLabelColor(label, style.titleColor);
                label.getComponent(UITransform)?.setContentSize(entry.subtitle ? type.itemTitleWidth : hasCompactBadge ? 166 : 214, entry.subtitle ? type.itemTitleHeight : 36);
            }

            if (entry.materialId && !entry.subtitle) {
                this.createCardIconBadge(buttonNode, entry.iconLabel ?? "MAT", [235, 235, 220, 255], -88, 0, 40, 16);
            } else if (entry.subtitle) {
                this.createCardIconBadge(buttonNode, entry.iconLabel ?? (entry.materialId ? "MAT" : "ITM"), style?.titleColor ?? [235, 235, 220, 255], -208, 0, type.itemBadgeSize, type.itemBadgeFontSize);

                const subtitleLabelNode = instantiate(this.highscoreLabel.node);
                subtitleLabelNode.name = `${buttonNode.name}_Subtitle`;
                subtitleLabelNode.setParent(buttonNode);
                subtitleLabelNode.setPosition(new Vec3(78, 2, 0));

                const subtitleLabel = subtitleLabelNode.getComponent(Label);
                if (subtitleLabel) {
                    subtitleLabel.string = entry.subtitle;
                    subtitleLabel.fontSize = type.itemSubtitleSize;
                    subtitleLabel.lineHeight = type.itemSubtitleLineHeight;
                    subtitleLabel.overflow = Overflow.SHRINK;
                    if (style) this.applyLabelColor(subtitleLabel, style.subtitleColor);
                    subtitleLabel.getComponent(UITransform)?.setContentSize(type.itemSubtitleWidth, type.itemSubtitleHeight);
                }

                const statLabelNode = instantiate(this.highscoreLabel.node);
                statLabelNode.name = `${buttonNode.name}_Stats`;
                statLabelNode.setParent(buttonNode);
                statLabelNode.setPosition(new Vec3(78, -58, 0));

                const statLabel = statLabelNode.getComponent(Label);
                if (statLabel) {
                    statLabel.string = [entry.materialId ? "" : entry.statLine, entry.description].filter((line) => !!line).join("\n");
                    statLabel.fontSize = type.itemStatSize;
                    statLabel.lineHeight = type.itemStatLineHeight;
                    statLabel.overflow = Overflow.SHRINK;
                    if (style) this.applyLabelColor(statLabel, style.subtitleColor);
                    statLabel.getComponent(UITransform)?.setContentSize(type.itemStatWidth, type.itemStatHeight);
                }
            }

            const button = buttonNode.getComponent(UIButton);
            const shouldEnable = this.isInventoryButtonEnabled(entry);
            if (!shouldEnable) {
                const buttonComponent = buttonNode.getComponent(Button);
                if (buttonComponent) {
                    buttonComponent.enabled = false;
                }
                return;
            }

            button?.InteractedEvent.on(() => onClick(entry.slot ?? entry.itemId ?? entry.materialId), this);
        });
    }

    private resolveInventoryButtonTitle(entry: any): string {
        if (entry.slot) {
            return `${entry.label}: ${entry.itemLabel}`;
        }

        if (entry.materialId) {
            return entry.label;
        }

        if (entry.placeholderId) {
            return entry.label;
        }

        const actionSuffix = entry.actionLabel ? ` - ${entry.actionLabel}` : "";
        return `${entry.label}${actionSuffix}`;
    }

    private isInventoryButtonEnabled(entry: any): boolean {
        if (entry.placeholderId) return false;
        if (entry.materialId) return false;
        if (entry.isEmpty ?? false) return false;
        if (entry.isEquipped ?? false) return false;
        if (entry.canEquip === false) return false;

        return true;
    }

    private applyLabelColor(label: Label, color: ColorTuple): void {
        label.color = new Color(color[0], color[1], color[2], color[3]);
    }

    private createInputBlockingBackdrop(parent: Node, name: string, width: number, height: number): Node {
        const backdropNode = instantiate(this.upgradeBtn.node);
        backdropNode.name = name;
        backdropNode.setParent(parent);
        backdropNode.setPosition(new Vec3(0, 0, 0));
        backdropNode.setScale(new Vec3(1, 1, 1));
        backdropNode.getChildByName("Label")?.destroy();
        backdropNode.getComponent(UIButton)!.enabled = false;
        backdropNode.getComponent(Button)!.enabled = false;
        backdropNode.getComponent(UITransform)?.setContentSize(width, height);

        if (!backdropNode.getComponent(BlockInputEvents)) {
            backdropNode.addComponent(BlockInputEvents);
        }

        return backdropNode;
    }

    private createPanelBackButton(parent: Node, x: number, y: number, onClick: () => void): void {
        const backButtonNode = instantiate(this.upgradeBtn.node);
        backButtonNode.name = `${parent.name}BackButton`;
        backButtonNode.setParent(parent);
        backButtonNode.setPosition(new Vec3(x, y, 0));
        backButtonNode.getComponent(UITransform)?.setContentSize(94, 38);

        const label = backButtonNode.getComponentInChildren(Label);
        if (label) {
            label.string = "Back";
            label.fontSize = 20;
            label.lineHeight = 20;
            label.overflow = Overflow.SHRINK;
        }

        backButtonNode.getComponent(UIButton)?.InteractedEvent.on(() => onClick.call(this), this);
    }

    private createZoneButton(): void {
        const zoneBtnNode = instantiate(this.upgradeBtn.node);
        zoneBtnNode.name = "ZoneBtn";
        zoneBtnNode.setParent(this.node);
        zoneBtnNode.setPosition(new Vec3(0, -151.9145, 0));

        const zoneLabel = zoneBtnNode.getComponentInChildren(Label);
        if (zoneLabel) {
            zoneLabel.string = "Stages";
            this.zoneBtnLabel = zoneLabel;
        }

        this.zoneBtn = zoneBtnNode.getComponent(UIButton);
        this.zoneBtn?.InteractedEvent.on(this.toggleZonePanel, this);
    }

    private createZonePanel(): void {
        const panelNode = new Node("ZonePanel");
        panelNode.setParent(this.node);
        panelNode.setPosition(new Vec3(0, -8, 0));
        panelNode.active = false;
        this.zonePanel = panelNode;

        const type = MenuTypography.stage;

        this.createInputBlockingBackdrop(panelNode, "ZonePanelBackdrop", 590, 620);
        this.createPanelBackButton(panelNode, 236, 252, this.closeZonePanel);

        const titleLabelNode = instantiate(this.highscoreLabel.node);
        titleLabelNode.name = "ZoneTitle";
        titleLabelNode.setParent(panelNode);
        titleLabelNode.setPosition(new Vec3(0, 252, 0));
        this.applyLabelLayout(titleLabelNode.getComponent(Label), 460, 56, type.panelTitleSize, type.panelTitleLineHeight);
        titleLabelNode.getComponent(Label)!.string = "Stages";

        const summaryLabelNode = instantiate(this.highscoreLabel.node);
        summaryLabelNode.name = "ZoneSummary";
        summaryLabelNode.setParent(panelNode);
        summaryLabelNode.setPosition(new Vec3(0, 198, 0));
        this.zoneSummaryLabel = summaryLabelNode.getComponent(Label);
        this.applyLabelLayout(this.zoneSummaryLabel, 520, 64, type.summarySize, type.summaryLineHeight);

        const zoneListContainer = new Node("ZoneListContainer");
        zoneListContainer.setParent(panelNode);
        zoneListContainer.setPosition(new Vec3(0, 126, 0));
        this.zoneListContainer = zoneListContainer;

        this.refreshZonePanel();
    }

    private toggleZonePanel(): void {
        if (!this.zonePanel) return;

        this.zonePanel.active = !this.zonePanel.active;
        if (this.zonePanel.active && this.inventoryPanel) {
            this.inventoryPanel.active = false;
        }
        if (this.zonePanel.active) {
            this.refreshZonePanel();
        }
    }

    private closeZonePanel(): void {
        if (this.zonePanel) {
            this.zonePanel.active = false;
        }
    }

    private refreshZonePanel(): void {
        if (!this.zoneSummaryLabel || !this.zoneListContainer) return;

        const presentation = ZoneSelectionPresentation.build(AppRoot.Instance.Settings, AppRoot.Instance.LiveUserData);
        const type = MenuTypography.stage;
        this.zoneSummaryLabel.string = presentation.summary;
        this.zoneListContainer.destroyAllChildren();

        presentation.zones.forEach((entry, index) => {
            const style = MenuTheme.forStageTone(entry.tone);
            const buttonNode = instantiate(this.upgradeBtn.node);
            buttonNode.name = `ZoneOption_${entry.zoneId}`;
            buttonNode.setParent(this.zoneListContainer);
            buttonNode.setScale(new Vec3(1, 1, 1));
            buttonNode.setPosition(new Vec3(0, -index * type.cardRowHeight, 0));
            buttonNode.getComponent(UITransform)?.setContentSize(500, type.cardHeight);

            const label = buttonNode.getComponentInChildren(Label);
            if (label) {
                label.string = `${style.marker}${entry.name} - ${entry.actionLabel}`;
                label.node.setPosition(new Vec3(58, 24, 0));
                label.fontSize = entry.isCurrent ? type.currentCardTitleSize : type.cardTitleSize;
                label.lineHeight = type.cardTitleLineHeight;
                label.overflow = Overflow.SHRINK;
                this.applyLabelColor(label, style.titleColor);
                label.getComponent(UITransform)?.setContentSize(type.cardTitleWidth, type.cardTitleHeight);
            }

            this.createCardIconBadge(buttonNode, entry.iconLabel, style.titleColor, -202, 0, type.badgeSize, type.badgeFontSize);

            const subtitleLabelNode = instantiate(this.highscoreLabel.node);
            subtitleLabelNode.name = `ZoneOptionSubtitle_${entry.zoneId}`;
            subtitleLabelNode.setParent(buttonNode);
            subtitleLabelNode.setPosition(new Vec3(58, -24, 0));

            const subtitleLabel = subtitleLabelNode.getComponent(Label);
            if (subtitleLabel) {
                subtitleLabel.string = entry.subtitle;
                subtitleLabel.fontSize = type.cardSubtitleSize;
                subtitleLabel.lineHeight = type.cardSubtitleLineHeight;
                subtitleLabel.overflow = Overflow.SHRINK;
                this.applyLabelColor(subtitleLabel, style.subtitleColor);
                subtitleLabel.getComponent(UITransform)?.setContentSize(type.cardSubtitleWidth, type.cardSubtitleHeight);
            }

            const buttonComponent = buttonNode.getComponent(Button);
            const button = buttonNode.getComponent(UIButton);
            if (!entry.isSelectable || style.disabled) {
                if (buttonComponent) buttonComponent.enabled = false;
                if (button) button.enabled = false;
                return;
            }

            button?.InteractedEvent.on(() => this.onZoneClicked(entry.zoneId), this);
        });
    }

    private onZoneClicked(zoneId: string): void {
        const selected = ZoneSelectionState.trySelectZone(AppRoot.Instance.Settings, AppRoot.Instance.LiveUserData, zoneId);
        if (!selected) return;

        AppRoot.Instance.saveUserData();
        this.refreshHighscoreLabel();
        this.refreshQuickActionLabels();
        this.refreshZonePanel();
    }

    private refreshQuickActionLabels(): void {
        const presentation = MenuQuickActionsPresentation.build(AppRoot.Instance.Settings, AppRoot.Instance.LiveUserData);
        if (this.inventoryBtnLabel) {
            this.inventoryBtnLabel.string = presentation.inventoryButtonLabel;
        }
        if (this.zoneBtnLabel) {
            this.zoneBtnLabel.string = presentation.stageButtonLabel;
        }
    }

    private createCardIconBadge(parent: Node, text: string, color: ColorTuple, x: number, y: number, size: number, fontSize?: number): void {
        const badgeNode = instantiate(this.upgradeBtn.node);
        badgeNode.name = `${parent.name}_IconBadge`;
        badgeNode.setParent(parent);
        badgeNode.setPosition(new Vec3(x, y, 0));
        badgeNode.getComponent(UITransform)?.setContentSize(size, size);

        const button = badgeNode.getComponent(UIButton);
        if (button) button.enabled = false;
        const buttonComponent = badgeNode.getComponent(Button);
        if (buttonComponent) buttonComponent.enabled = false;

        const label = badgeNode.getComponentInChildren(Label);
        if (label) {
            label.string = text;
            label.fontSize = fontSize ?? Math.max(16, Math.floor(size * 0.32));
            label.lineHeight = label.fontSize;
            label.overflow = Overflow.SHRINK;
            this.applyLabelColor(label, color);
            label.getComponent(UITransform)?.setContentSize(size - 8, size - 8);
        }
    }
}
