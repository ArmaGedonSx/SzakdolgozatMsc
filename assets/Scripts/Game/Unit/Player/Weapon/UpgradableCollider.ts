import { BoxCollider2D, Collider2D, Component, Contact2DType, instantiate, Node, Vec3, _decorator } from "cc";
import { ISignal } from "../../../../Services/EventSystem/ISignal";
import { Signal } from "../../../../Services/EventSystem/Signal";

const { ccclass, property } = _decorator;

@ccclass("UpgradableCollider")
export class UpgradableCollider extends Component {
    @property(BoxCollider2D) private colliders: BoxCollider2D[] = [];
    private static readonly ACTIVE_BLADE_COUNT = 4;

    private contactBeginEvent: Signal<Collider2D> = new Signal<Collider2D>();
    private currentUpgradeLevel = 0;
    private runtimeBladeNodes: Node[] = [];

    public init(): void {
        for (const collider of this.colliders) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onColliderContactBegin, this);
        }

        this.setUpgradeLevel();
    }

    public get ContactBeginEvent(): ISignal<Collider2D> {
        return this.contactBeginEvent;
    }

    public upgrade(): void {
        if (this.currentUpgradeLevel == this.colliders.length - 1) throw new Error("Already at max upgrade! " + this.currentUpgradeLevel);

        this.currentUpgradeLevel++;
        this.setUpgradeLevel();
    }

    private setUpgradeLevel(): void {
        this.clearRuntimeBlades();

        for (const collider of this.colliders) {
            collider.node.active = false;
        }

        const activeCollider = this.colliders[this.currentUpgradeLevel];
        activeCollider.node.active = true;
        this.setBladeAngle(activeCollider.node, 0);

        for (let index = 1; index < UpgradableCollider.ACTIVE_BLADE_COUNT; index++) {
            const bladeNode = instantiate(activeCollider.node);
            bladeNode.name = `${activeCollider.node.name}-Orbit-${index}`;
            bladeNode.setParent(activeCollider.node.parent);
            this.setBladeAngle(bladeNode, index * 90);

            const bladeCollider = bladeNode.getComponent(BoxCollider2D);
            bladeCollider.on(Contact2DType.BEGIN_CONTACT, this.onColliderContactBegin, this);
            this.runtimeBladeNodes.push(bladeNode);
        }
    }

    private setBladeAngle(bladeNode: Node, angle: number): void {
        bladeNode.setRotationFromEuler(new Vec3(-180, -180, angle));
    }

    private clearRuntimeBlades(): void {
        for (const bladeNode of this.runtimeBladeNodes) {
            bladeNode.destroy();
        }
        this.runtimeBladeNodes = [];
    }

    private onColliderContactBegin(thisCollider: Collider2D, otherCollider: Collider2D): void {
        this.contactBeginEvent.trigger(otherCollider);
    }
}
