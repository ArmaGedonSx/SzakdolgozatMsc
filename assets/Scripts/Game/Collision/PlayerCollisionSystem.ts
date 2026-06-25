import { Collider2D, Contact2DType, Node } from "cc";
import { ISignal } from "../../Services/EventSystem/ISignal";
import { Signal } from "../../Services/EventSystem/Signal";
import { GameTimer } from "../../Services/GameTimer";
import { GroupType } from "../GroupType";
import { Item } from "../Items/Item";
import { ItemManager } from "../Items/ItemManager";
import { Projectile } from "../Projectile/Projectile";
import { DamageResolver } from "../Data/DamageResolver";
import { Enemy } from "../Unit/Enemy/Enemy";
import { Player } from "../Unit/Player/Player";

export class PlayerCollisionSystem {
    private playerContacts: Collider2D[] = [];
    private enemyContactCooldowns: Map<Collider2D, number> = new Map<Collider2D, number>();
    private collisionTimer: GameTimer;

    private groupToResolver: Map<number, (collider: Collider2D) => void> = new Map<number, (collider: Collider2D) => void>();

    private itemPickedUpEvent = new Signal<Node>();

    public constructor(private player: Player, collisionDelay: number, private itemManager: ItemManager) {
        this.player = player;

        player.Collider.on(Contact2DType.BEGIN_CONTACT, this.onPlayerContactBegin, this);
        player.Collider.on(Contact2DType.END_CONTACT, this.onPlayerContactEnd, this);

        this.collisionTimer = new GameTimer(collisionDelay);

        this.groupToResolver.set(GroupType.ENEMY, this.resolveEnemyContact.bind(this));
        this.groupToResolver.set(GroupType.ENEMY_PROJECTILE, this.resolveEnemyProjectileContact.bind(this));
        this.groupToResolver.set(GroupType.ITEM, this.resolveItemContact.bind(this));
    }

    public gameTick(deltaTime: number): void {
        this.tickEnemyContactCooldowns(deltaTime);
        this.collisionTimer.gameTick(deltaTime);
        if (this.collisionTimer.tryFinishPeriod()) {
            this.resolveAllContacts();
        }
    }

    public get ItemPickedUpEvent(): ISignal<Node> {
        return this.itemPickedUpEvent;
    }

    private onPlayerContactBegin(_selfCollider: Collider2D, otherCollider: Collider2D): void {
        this.playerContacts.push(otherCollider);
        this.resolveContact(otherCollider);
    }

    private onPlayerContactEnd(_selfCollider: Collider2D, otherCollider: Collider2D): void {
        const index: number = this.playerContacts.indexOf(otherCollider);
        if (index != -1) {
            this.playerContacts.splice(index, 1);
        }
        this.enemyContactCooldowns.delete(otherCollider);
    }

    private resolveAllContacts(): void {
        for (let i = 0; i < this.playerContacts.length; i++) {
            this.resolveContact(this.playerContacts[i]);
        }
    }

    private resolveContact(otherCollider: Collider2D): void {
        if (!this.player.Health.IsAlive) return;

        if (this.groupToResolver.has(otherCollider.group)) {
            this.groupToResolver.get(otherCollider.group)(otherCollider);
        } else {
            console.log("Collided with undefined group: " + otherCollider.group);
        }
    }

    private resolveEnemyContact(enemyCollider: Collider2D): void {
        if ((this.enemyContactCooldowns.get(enemyCollider) ?? 0) > 0) return;

        const enemy = enemyCollider.node.getComponent(Enemy);
        const damage: number = enemy.Damage;
        console.log("Collided with enemy: Damage: " + damage);
        this.player.Health.damage(DamageResolver.resolveIncomingDamage(damage, this.player.Defense));
        this.setEnemyContactCooldown(enemyCollider, enemy.AttackCooldown);
    }

    private tickEnemyContactCooldowns(deltaTime: number): void {
        for (const [enemyCollider, timeLeft] of this.enemyContactCooldowns) {
            const nextTimeLeft = timeLeft - deltaTime;
            if (nextTimeLeft <= 0) {
                this.enemyContactCooldowns.delete(enemyCollider);
            } else {
                this.enemyContactCooldowns.set(enemyCollider, nextTimeLeft);
            }
        }
    }

    private setEnemyContactCooldown(enemyCollider: Collider2D, attackCooldown: number): void {
        const cooldown = Math.max(0, attackCooldown || 0);
        if (cooldown > 0) {
            this.enemyContactCooldowns.set(enemyCollider, cooldown);
        }
    }

    private resolveEnemyProjectileContact(enemyCollider: Collider2D): void {
        const projectile = enemyCollider.node.getComponent(Projectile);
        const damage: number = projectile.Damage;
        projectile.pierce();
        console.log("Collided with enemy projectile: Damage: " + damage);

        this.player.Health.damage(DamageResolver.resolveIncomingDamage(damage, this.player.Defense));
    }

    private resolveItemContact(xpCollider: Collider2D): void {
        console.log("Collided with item");
        this.itemManager.pickupItem(xpCollider.node.getComponent(Item));
    }
}
