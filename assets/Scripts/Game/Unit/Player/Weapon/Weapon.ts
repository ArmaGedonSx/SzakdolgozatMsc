import { Animation, AnimationState, Component, _decorator } from "cc";
import { ISignal } from "../../../../Services/EventSystem/ISignal";
import { Signal } from "../../../../Services/EventSystem/Signal";
import { GameTimer } from "../../../../Services/GameTimer";
import { AttackResolver } from "../../../Data/AttackResolver";

import { UpgradableCollider } from "./UpgradableCollider";
const { ccclass, property } = _decorator;

@ccclass("Weapon")
export class Weapon extends Component {
    private static readonly STRIKE_ANIMATION_SPEED = 0.75;

    @property(Animation) private weaponAnimation: Animation;
    @property(UpgradableCollider) private upgradableCollider: UpgradableCollider;

    private weaponStrikeEvent = new Signal<Weapon>();

    private strikeTimer: GameTimer;
    private strikeState: AnimationState;
    private damage: number;
    private critChance = 0;
    private critMult = 1;

    public init(strikeDelay: number, damage: number, critChance = 0, critMult = 1): void {
        this.strikeTimer = new GameTimer(strikeDelay);
        this.damage = damage;
        this.critChance = critChance;
        this.critMult = critMult;
        this.node.active = false;

        this.weaponAnimation.on(Animation.EventType.FINISHED, this.endStrike, this);
        this.strikeState = this.weaponAnimation.getState(this.weaponAnimation.clips[0].name);
        this.strikeState.speed = Weapon.STRIKE_ANIMATION_SPEED;

        this.upgradableCollider.init();
    }

    public gameTick(deltaTime: number): void {
        this.strikeTimer.gameTick(deltaTime);
        if (this.strikeTimer.tryFinishPeriod()) {
            this.strike();
        }
    }

    public get WeaponStrikeEvent(): ISignal<Weapon> {
        return this.weaponStrikeEvent;
    }

    public get Collider(): UpgradableCollider {
        return this.upgradableCollider;
    }

    public get Damage(): number {
        return this.damage;
    }

    public rollDamage(): number {
        return AttackResolver.resolveOutgoingDamage(this.damage, this.critChance, this.critMult);
    }

    public upgradeWeaponDamage(): void {
        this.damage++;
    }
    public upgradeWeaponLength(): void {
        this.upgradableCollider.upgrade();
    }

    private strike(): void {
        this.node.active = true;
        this.weaponAnimation.play(this.strikeState.name);
        this.weaponStrikeEvent.trigger(this);
    }

    private endStrike(): void {
        this.node.active = false;
    }
}
