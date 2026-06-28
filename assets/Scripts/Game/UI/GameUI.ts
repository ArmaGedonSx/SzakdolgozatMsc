import { Color, Component, Label, Node, Overflow, ProgressBar, resources, Sprite, SpriteFrame, UITransform, Vec3, Widget, _decorator } from "cc";
import { GameHudPresentation, RunEventMilestones } from "../Data/GameHudPresentation";
import { UIButton } from "../../Services/UI/Button/UIButton";
import { GameResult } from "../Game";
import { ItemManager } from "../Items/ItemManager";
import { ItemType } from "../Items/ItemType";
import { GameModalLauncher } from "../ModalWIndows/GameModalLauncher";
import { Player } from "../Unit/Player/Player";
import { UnitLevel } from "../Unit/UnitLevel";

const { ccclass, property } = _decorator;

@ccclass("GameUI")
export class GameUI extends Component {
    private static readonly TOP_BAR_SPRITE_PATH = "UI/HUD/hud_top_bar/spriteFrame";

    @property(ProgressBar) private xpBar: ProgressBar;
    @property(Label) private timeAliveText: Label;
    @property(Label) private goldLabel: Label;
    @property(UIButton) private pauseBtn: UIButton;

    private playerLevel: UnitLevel;
    private modalLauncher: GameModalLauncher;
    private gameResult: GameResult;
    private hudTopBarNode: Node | null = null;
    private levelLabel: Label | null = null;

    public init(player: Player, modalLauncher: GameModalLauncher, itemManager: ItemManager, gameResult: GameResult): void {
        this.playerLevel = player.Level;
        this.modalLauncher = modalLauncher;
        this.gameResult = gameResult;

        this.playerLevel.XpAddedEvent.on(this.updateProgressBar, this);
        this.playerLevel.LevelUpEvent.on(this.updateProgressBar, this);

        itemManager.PickupEvent.on(this.tryUpdateGoldLabel, this);

        this.xpBar.progress = 0;
        this.goldLabel.string = this.gameResult.goldCoins.toString();
        this.createHudTopBarFrame();
        this.createLevelLabel();
        this.applyCompactHudLayout();
        this.updateProgressBar();

        this.pauseBtn.InteractedEvent.on(this.showPauseWindow, this);
    }

    private applyCompactHudLayout(): void {
        this.applyXpBarLayout();
        this.timeAliveText.node.setPosition(new Vec3(0, 248, 0));
        this.applyHudLabel(this.timeAliveText, 22, 24, 80, 26);

        const goldCounter = this.goldLabel.node.parent;
        goldCounter?.setPosition(new Vec3(-204, 300, 0));
        goldCounter?.setScale(new Vec3(1, 1, 1));
        goldCounter?.getChildByName("GoldSprite")?.setScale(new Vec3(0, 0, 1));
        this.goldLabel.node.setPosition(new Vec3(0, 0, 0));
        this.applyHudLabel(this.goldLabel, 24, 26, 42, 30);
        this.goldLabel.color = new Color(255, 210, 58, 255);

        this.levelLabel?.node.setPosition(new Vec3(0, 298, 0));
        if (this.levelLabel) this.applyHudLabel(this.levelLabel, 18, 20, 92, 22);

        this.pauseBtn.node.setPosition(new Vec3(197, 300, 0));
        this.pauseBtn.node.setScale(new Vec3(0.78, 0.78, 1));
        this.pauseBtn.node.getComponent(UITransform)?.setContentSize(34, 28);
    }

    private createHudTopBarFrame(): void {
        if (this.hudTopBarNode) return;

        const parent = this.xpBar.node.parent ?? this.node;
        const existingFrame = parent.getChildByName("HudTopBarFrame");
        if (existingFrame) {
            existingFrame.setPosition(new Vec3(0, 300, 0));
            existingFrame.setScale(new Vec3(1, 1, 1));
            existingFrame.getComponent(UITransform)?.setContentSize(510, 110);
            existingFrame.setSiblingIndex(0);
            this.hudTopBarNode = existingFrame;
            return;
        }

        const frameNode = new Node("HudTopBarFrame");
        frameNode.setParent(parent);
        frameNode.setPosition(new Vec3(0, 300, 0));
        frameNode.setScale(new Vec3(1, 1, 1));
        frameNode.addComponent(UITransform).setContentSize(510, 110);
        frameNode.setSiblingIndex(0);

        const sprite = frameNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        resources.load(GameUI.TOP_BAR_SPRITE_PATH, SpriteFrame, (error, spriteFrame) => {
            if (error || !spriteFrame) {
                console.warn(`[GameUI] Failed to load HUD top bar sprite: ${GameUI.TOP_BAR_SPRITE_PATH}`, error);
                return;
            }

            sprite.spriteFrame = spriteFrame;
        });

        this.hudTopBarNode = frameNode;
    }

    private createLevelLabel(): void {
        if (this.levelLabel) return;

        const parent = this.xpBar.node.parent ?? this.node;
        const existingLevelNode = parent.getChildByName("LevelText");
        const levelNode = existingLevelNode ?? new Node("LevelText");
        if (!existingLevelNode) {
            levelNode.setParent(parent);
            levelNode.addComponent(UITransform).setContentSize(88, 24);
        }

        const label = levelNode.getComponent(Label) ?? levelNode.addComponent(Label);
        label.font = this.timeAliveText.font;
        label.horizontalAlign = this.timeAliveText.horizontalAlign;
        label.verticalAlign = this.timeAliveText.verticalAlign;
        label.cacheMode = this.timeAliveText.cacheMode;
        label.spacingX = 0.5;
        label.color = new Color(255, 247, 191, 255);
        levelNode.setSiblingIndex(parent.children.length - 1);

        this.levelLabel = label;
    }

    private applyHudLabel(label: Label, fontSize: number, lineHeight: number, width: number, height: number): void {
        label.fontSize = fontSize;
        label.lineHeight = lineHeight;
        label.overflow = Overflow.SHRINK;
        label.getComponent(UITransform)?.setContentSize(width, height);
    }

    private applyXpBarLayout(): void {
        const xpWidget = this.xpBar.node.getComponent(Widget);
        if (xpWidget) xpWidget.enabled = false;
        this.xpBar.node.setPosition(new Vec3(0, 300, 0));
        this.xpBar.node.setScale(new Vec3(1, 1, 1));
        this.xpBar.node.getComponent(UITransform)?.setContentSize(252, 16);
        this.xpBar.totalLength = 246;

        const background = this.xpBar.node.getChildByName("Background-001");
        if (background) {
            background.active = false;
            const backgroundWidget = background.getComponent(Widget);
            if (backgroundWidget) backgroundWidget.enabled = false;
            background.setPosition(new Vec3(0, -10, 0));
            background.setScale(new Vec3(1, 1, 1));
            background.getComponent(UITransform)?.setContentSize(0, 0);
        }

        const movableBar = this.xpBar.node.getChildByName("MovableBar");
        movableBar?.setPosition(new Vec3(-123, -3, 0));
        movableBar?.setScale(new Vec3(1, 1, 1));
        movableBar?.getComponent(UITransform)?.setContentSize(246, 8);
    }

    private updateProgressBar(): void {
        this.xpBar.progress = this.playerLevel.XP / this.playerLevel.RequiredXP;
        if (this.levelLabel) this.levelLabel.string = `Lv ${this.playerLevel.CurrentLevel}`;
    }

    private tryUpdateGoldLabel(itemType: ItemType): void {
        if (itemType !== ItemType.Gold) return;

        this.goldLabel.string = this.gameResult.goldCoins.toString();
    }

    private showPauseWindow(): void {
        console.log("Show pause window");
        this.modalLauncher.showPauseModal();
    }

    public updateTimeAlive(timeAlive: number, milestones: RunEventMilestones = {}): void {
        this.timeAliveText.string = GameHudPresentation.formatRunStatus(timeAlive, this.playerLevel.CurrentLevel, this.gameResult.kills, milestones);
    }
}
