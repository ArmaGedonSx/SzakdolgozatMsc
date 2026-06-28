import { Color, Component, Label, NodeEventType, Overflow, Sprite, UITransform, Vec3, _decorator } from "cc";
import { AppRoot } from "../../../AppRoot/AppRoot";
import { ISignal } from "../../../Services/EventSystem/ISignal";
import { Signal } from "../../../Services/EventSystem/Signal";
import { SkillChoicePresentation } from "../../Data/SkillChoicePresentation";
import { SkillChoiceSettings } from "../../Data/SkillChoiceSettings";
import { UpgradeType } from "../../Upgrades/UpgradeType";
const { ccclass, property } = _decorator;

@ccclass("LevelUpSkill")
export class LevelUpSkill extends Component {
    @property(Label) private skillTitle: Label;
    @property(Label) private skillDescription: Label;
    @property(Sprite) private skillIcon: Sprite;
    private chooseSkillEvent: Signal<UpgradeType> = new Signal<UpgradeType>();
    private skillType: UpgradeType;

    public init(skill: SkillChoiceSettings): void {
        const presentation = SkillChoicePresentation.build(skill);
        this.skillType = skill.upgradeType;
        this.skillTitle.string = presentation.title;
        this.skillDescription.string = presentation.description;
        this.applyReadableCardTypography();
        this.skillIcon.spriteFrame = AppRoot.Instance.GameAssets.UpgradeIcons.getIcon(skill.upgradeType);
        this.node.on(NodeEventType.TOUCH_START, this.chooseSkill, this);
    }

    public get ChooseSkillEvent(): ISignal<UpgradeType> {
        return this.chooseSkillEvent;
    }

    private chooseSkill(): void {
        this.chooseSkillEvent.trigger(this.skillType);
    }

    private applyReadableCardTypography(): void {
        this.skillTitle.node.setPosition(new Vec3(0, 71, 0));
        this.skillTitle.fontSize = 24;
        this.skillTitle.lineHeight = 20;
        this.skillTitle.overflow = Overflow.SHRINK;
        this.skillTitle.color = new Color(25, 37, 58, 255);
        this.skillTitle.getComponent(UITransform)?.setContentSize(132, 42);

        this.skillDescription.node.setPosition(new Vec3(0, -84, 0));
        this.skillDescription.fontSize = 24;
        this.skillDescription.lineHeight = 21;
        this.skillDescription.overflow = Overflow.SHRINK;
        this.skillDescription.color = new Color(238, 248, 255, 255);
        this.skillDescription.getComponent(UITransform)?.setContentSize(138, 76);
    }
}
