import { approx, Component, Label, NodeEventType, Sprite, _decorator } from "cc";
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
        this.skillIcon.spriteFrame = AppRoot.Instance.GameAssets.UpgradeIcons.getIcon(skill.upgradeType);
        this.node.on(NodeEventType.TOUCH_START, this.chooseSkill, this);
    }

    public get ChooseSkillEvent(): ISignal<UpgradeType> {
        return this.chooseSkillEvent;
    }

    private chooseSkill(): void {
        this.chooseSkillEvent.trigger(this.skillType);
    }
}
