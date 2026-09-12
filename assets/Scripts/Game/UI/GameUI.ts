import { Color, Component, Label, Node, Overflow, ProgressBar, Sprite, UITransform, Vec3, Widget, _decorator } from "cc";
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
    @property(ProgressBar) private xpBar: ProgressBar;
    @property(Label) private timeAliveText: Label;
    @property(Label) private goldLabel: Label;
    @property(UIButton) private pauseBtn: UIButton;

    private playerLevel: UnitLevel;
    private modalLauncher: GameModalLauncher;
    private gameResult: GameResult;
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
        this.setupHudHeaderPanel();
        this.createLevelLabel();
        this.applyCleanHudLayout();
        this.updateProgressBar();

        this.pauseBtn.InteractedEvent.on(this.showPauseWindow, this);
    }

    private setupHudHeaderPanel(): void {
        const parent = this.xpBar.node.parent ?? this.node;
        const frameNode = parent.getChildByName("HudTopBarFrame");
        if (!frameNode) return;

        frameNode.active = true;
        frameNode.setPosition(new Vec3(0, 307, 0));
        frameNode.setScale(new Vec3(1, 1, 1));
        frameNode.setSiblingIndex(0);

        const transform = frameNode.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(500, 66);
        }

        const sprite = frameNode.getComponent(Sprite);
        if (sprite) {
            sprite.type = Sprite.Type.SLICED;
            // Authentic Chronos window slate blue (matching WndBg in Pause and Upgrade windows)
            sprite.color = new Color(30, 44, 68, 235);
        }
    }

    private applyCleanHudLayout(): void {
        this.applyXpBarLayout();

        // Baseline for all top HUD elements below XP bar
        const hudItemY = 296;

        // 1. Timer: central heartbeat of survivor gameplay
        this.timeAliveText.node.setPosition(new Vec3(0, hudItemY, 0));
        this.applyHudLabel(this.timeAliveText, 34, 36, 110, 36);
        this.timeAliveText.color = new Color(255, 255, 255, 255);

        // 2. Level: player progression on the left (warm golden amber)
        this.levelLabel?.node.setPosition(new Vec3(-175, hudItemY, 0));
        if (this.levelLabel) {
            this.applyHudLabel(this.levelLabel, 24, 26, 80, 28);
            this.levelLabel.color = new Color(255, 224, 102, 255);
        }

        // 3. Gold counter: loot & economy on the right-center (authentic Chronos #ffc611 gold)
        const goldCounter = this.goldLabel.node.parent;
        goldCounter?.setPosition(new Vec3(120, hudItemY, 0));
        goldCounter?.setScale(new Vec3(1, 1, 1));

        const goldSprite = goldCounter?.getChildByName("GoldSprite");
        if (goldSprite) {
            goldSprite.active = true;
            goldSprite.setScale(new Vec3(1, 1, 1));
            goldSprite.setPosition(new Vec3(-18, 0, 0));
            goldSprite.getComponent(UITransform)?.setContentSize(26, 26);
            const sprite = goldSprite.getComponent(Sprite);
            if (sprite) {
                sprite.color = new Color(255, 255, 255, 255);
            }
        }

        this.goldLabel.node.setPosition(new Vec3(8, 0, 0));
        this.goldLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.applyHudLabel(this.goldLabel, 24, 26, 76, 28);
        this.goldLabel.color = new Color(255, 198, 17, 255);

        // 4. Pause button: system controls on the far right (native Chronos sapphire button)
        this.pauseBtn.node.setPosition(new Vec3(208, hudItemY, 0));
        this.pauseBtn.node.setScale(new Vec3(1, 1, 1));
        this.pauseBtn.node.getComponent(UITransform)?.setContentSize(38, 34);

        const pauseSprite = this.pauseBtn.node.getComponent(Sprite);
        if (pauseSprite) {
            pauseSprite.type = Sprite.Type.SLICED;
            pauseSprite.color = new Color(255, 255, 255, 255);
        }

        const pauseSquare = this.pauseBtn.node.getChildByName("Square");
        if (pauseSquare) {
            pauseSquare.setPosition(new Vec3(0, 0, 0));
            pauseSquare.setScale(new Vec3(1, 1, 1));
            const pauseLabel = pauseSquare.getComponent(Label);
            if (pauseLabel) {
                pauseLabel.fontSize = 18;
                pauseLabel.lineHeight = 20;
                pauseLabel.color = new Color(255, 255, 255, 255);
            }
        }
    }

    private createLevelLabel(): void {
        if (this.levelLabel) return;

        const parent = this.xpBar.node.parent ?? this.node;
        const existingLevelNode = parent.getChildByName("LevelText");
        const levelNode = existingLevelNode ?? new Node("LevelText");
        if (!existingLevelNode) {
            levelNode.setParent(parent);
            levelNode.addComponent(UITransform).setContentSize(80, 28);
        }

        const label = levelNode.getComponent(Label) ?? levelNode.addComponent(Label);
        label.font = this.timeAliveText.font;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.cacheMode = this.timeAliveText.cacheMode;
        label.spacingX = 0.5;
        label.color = new Color(255, 224, 102, 255);
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

        const barWidth = 480;
        const barHeight = 14;

        this.xpBar.node.setPosition(new Vec3(0, 328, 0));
        this.xpBar.node.setScale(new Vec3(1, 1, 1));
        this.xpBar.node.getComponent(UITransform)?.setContentSize(barWidth, barHeight);
        this.xpBar.totalLength = barWidth;

        const background = this.xpBar.node.getChildByName("Background");
        if (background) {
            background.active = false;
        }

        const background001 = this.xpBar.node.getChildByName("Background-001");
        if (background001) {
            background001.active = true;
            const bgWidget = background001.getComponent(Widget);
            if (bgWidget) bgWidget.enabled = false;
            background001.setPosition(new Vec3(0, 0, 0));
            background001.setScale(new Vec3(1, 1, 1));
            background001.getComponent(UITransform)?.setAnchorPoint(0.5, 0.5);
            background001.getComponent(UITransform)?.setContentSize(barWidth, barHeight);
            const sprite = background001.getComponent(Sprite);
            if (sprite) {
                sprite.type = Sprite.Type.SLICED;
                // Native ExpBarBg frame color
                sprite.color = new Color(207, 207, 207, 255);
            }
        }

        const movableBar = this.xpBar.node.getChildByName("MovableBar");
        if (movableBar) {
            movableBar.active = true;
            movableBar.setPosition(new Vec3(-barWidth / 2, 0, 0));
            movableBar.setScale(new Vec3(1, 1, 1));
            movableBar.getComponent(UITransform)?.setAnchorPoint(0, 0.5);
            movableBar.getComponent(UITransform)?.setContentSize(barWidth, barHeight - 4);
            const barSprite = movableBar.getComponent(Sprite);
            if (barSprite) {
                barSprite.type = Sprite.Type.SLICED;
                // Native ExpBarFill cyan glow
                barSprite.color = new Color(255, 255, 255, 255);
            }
        }
    }

    private updateProgressBar(): void {
        this.xpBar.progress = this.playerLevel.XP / this.playerLevel.RequiredXP;
        if (this.levelLabel) this.levelLabel.string = `Lv. ${this.playerLevel.CurrentLevel}`;
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
