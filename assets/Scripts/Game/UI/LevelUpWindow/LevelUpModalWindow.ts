import { instantiate, Node, Prefab, Vec3, _decorator } from "cc";
import { ModalWindow } from "../../../Services/ModalWindowSystem/ModalWindow";
import { delay } from "../../../Services/Utils/AsyncUtils";
import { SkillChoiceSettings } from "../../Data/SkillChoiceSettings";
import { UpgradeType } from "../../Upgrades/UpgradeType";
import { LevelUpSkill } from "./LevelUpSkill";

const { ccclass, property } = _decorator;

@ccclass("LevelUpModalWindow")
export class LevelUpModalWindow extends ModalWindow<LevelUpModalWindowParams, UpgradeType> {
    @property(Prefab) private skillPrefab: Prefab;
    @property(Node) private skillParent: Node;

    protected async setup(params: LevelUpModalWindowParams): Promise<void> {
        const upgradeChoices = params.availableUpgrades;
        const xPositions: number[] = [-172, 0, 172];
        await delay(300);
        for (let i = 0; i < upgradeChoices.length; i++) {
            await delay(500);
            const skill: LevelUpSkill = instantiate(this.skillPrefab).getComponent(LevelUpSkill);
            skill.node.setParent(this.skillParent);
            skill.node.setPosition(new Vec3(xPositions[i]));
            skill.init(upgradeChoices[i]);
            skill.ChooseSkillEvent.on(this.chooseSkill, this);
        }
    }

    private chooseSkill(upgradeType: UpgradeType): void {
        this.dismiss(upgradeType);
    }
}

export class LevelUpModalWindowParams {
    public availableUpgrades: SkillChoiceSettings[];
}
