import { approx, BlockInputEvents, Button, Canvas, Color, Component, instantiate, input, Input, KeyCode, Label, Node, Overflow, UITransform, Vec3, _decorator } from "cc";
import { AppRoot } from "../AppRoot/AppRoot";
import { requireAppRootAsync } from "../AppRoot/AppRootUtils";
import { MetaUpgradeSettings } from "../Game/Data/GameSettings";
import { MetaUpgradesData } from "../Game/Data/UserData";
import { UIButton } from "../Services/UI/Button/UIButton";
import { GameRunner } from "./GameRunner";
import { ColorTuple, MenuTheme } from "./MenuTheme";
import { MenuGoldPresentation } from "./MenuGoldPresentation";
import { MenuQuickActionsPresentation } from "./MenuQuickActionsPresentation";
import { MenuTypography } from "./MenuTypography";
import { MenuModalLauncher } from "./ModalWindows/MenuModalLauncher";
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
    private profileStatusLabel: Label | null = null;
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
        this.createProfileStatusLabel();
        this.createZoneButton();
        this.layoutMainMenuControls();
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
        this.goldCounter.active = true;
        this.goldLabel.string = MenuGoldPresentation.format(goldCoins);
        this.goldLabel.fontSize = 24;
        this.goldLabel.lineHeight = 26;
        this.goldLabel.overflow = Overflow.SHRINK;
        this.goldLabel.node.setScale(new Vec3(1, 1, 1));
        this.goldLabel.getComponent(UITransform)?.setContentSize(128, 30);

        this.refreshQuickActionLabels();
    }

    private refreshHighscoreLabel(): void {
        const userData = AppRoot.Instance.LiveUserData;
        this.highscoreLabel.string = PlayerProfilePresentation.buildZoneTitle(AppRoot.Instance.Settings, userData);
        this.highscoreLabel.node.setScale(new Vec3(1, 1, 1));
        this.highscoreLabel.fontSize = 28;
        this.highscoreLabel.lineHeight = 30;
        this.highscoreLabel.overflow = Overflow.SHRINK;
        this.highscoreLabel.getComponent(UITransform)?.setContentSize(430, 34);

        if (this.profileStatusLabel) {
            this.profileStatusLabel.string = PlayerProfilePresentation.buildStatusLine(AppRoot.Instance.Settings, userData);
            this.profileStatusLabel.fontSize = 16;
            this.profileStatusLabel.lineHeight = 18;
            this.profileStatusLabel.overflow = Overflow.SHRINK;
            this.profileStatusLabel.getComponent(UITransform)?.setContentSize(430, 24);
        }
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

    private layoutMainMenuControls(): void {
        this.highscoreLabel.node.setPosition(new Vec3(0, 84, 0));
        this.profileStatusLabel?.node.setPosition(new Vec3(0, 55, 0));
        this.goldCounter.setPosition(new Vec3(0, 26, 0));

        this.applyMainMenuButtonLayout(this.playBtn.node, -38);
        this.applyMainMenuButtonLayout(this.upgradeBtn.node, -116);
        if (this.zoneBtn?.node) this.applyMainMenuButtonLayout(this.zoneBtn.node, -194);
        this.applyMainMenuButtonLayout(this.audioSettingsBtn.node, -272);

        this.audioSettingsBtn.node.active = true;
    }

    private applyMainMenuButtonLayout(node: Node, y: number): void {
        node.setPosition(new Vec3(0, y, 0));
        node.setScale(new Vec3(1, 1, 1));
        node.getComponent(UITransform)?.setContentSize(300, 58);

        const label = node.getComponentInChildren(Label);
        if (!label) return;

        label.fontSize = 29;
        label.lineHeight = 31;
        label.overflow = Overflow.SHRINK;
        label.getComponent(UITransform)?.setContentSize(260, 38);
    }

    private createProfileStatusLabel(): void {
        if (this.profileStatusLabel) return;

        const statusLabelNode = instantiate(this.highscoreLabel.node);
        statusLabelNode.name = "ProfileStatusLine";
        statusLabelNode.setParent(this.node);
        statusLabelNode.setScale(new Vec3(1, 1, 1));
        this.profileStatusLabel = statusLabelNode.getComponent(Label);
    }

    private applyLabelLayout(label: Label | null, width: number, height: number, fontSize: number, lineHeight: number): void {
        if (!label) return;

        const transform = label.getComponent(UITransform);
        transform?.setContentSize(width, height);
        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.overflow = Overflow.SHRINK;
    }

    private applyLabelColor(label: Label, color: ColorTuple): void {
        label.color = new Color(color[0], color[1], color[2], color[3]);
    }

    private removeClonedUpgradeIndicator(node: Node): void {
        const indicatorName = this.upgradeAvailableIndicator?.name;
        if (!indicatorName) return;

        const clonedIndicator = node.getChildByName(indicatorName);
        if (clonedIndicator && clonedIndicator !== this.upgradeAvailableIndicator) {
            clonedIndicator.destroy();
        }
    }

    private createInputBlockingBackdrop(parent: Node, name: string, width: number, height: number): Node {
        const backdropNode = instantiate(this.upgradeBtn.node);
        backdropNode.name = name;
        backdropNode.setParent(parent);
        backdropNode.setPosition(new Vec3(0, 0, 0));
        backdropNode.setScale(new Vec3(1, 1, 1));
        backdropNode.getChildByName("Label")?.destroy();
        this.removeClonedUpgradeIndicator(backdropNode);
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
        this.removeClonedUpgradeIndicator(backButtonNode);

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
        zoneBtnNode.setPosition(new Vec3(0, -194, 0));
        this.removeClonedUpgradeIndicator(zoneBtnNode);

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
            this.removeClonedUpgradeIndicator(buttonNode);
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
