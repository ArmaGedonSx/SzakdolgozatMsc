import { Collider2D } from "cc";
import { Enemy } from "../Unit/Enemy/Enemy";
import { Weapon } from "../Unit/Player/Weapon/Weapon";

export class WeaponCollisionSystem {
    private weapon: Weapon;
    private hitEnemies = new Set<Enemy>();

    public constructor(weapon: Weapon) {
        this.weapon = weapon;
        weapon.Collider.ContactBeginEvent.on(this.onWeaponContactBegin, this);
        weapon.WeaponStrikeEvent.on(this.resetHitEnemies, this);
    }

    private onWeaponContactBegin(otherCollider: Collider2D): void {
        const enemy = otherCollider.getComponent(Enemy);
        if (this.hitEnemies.has(enemy)) return;

        this.hitEnemies.add(enemy);
        enemy.dealDamage(this.weapon.rollDamage());
    }

    private resetHitEnemies(): void {
        this.hitEnemies.clear();
    }
}
