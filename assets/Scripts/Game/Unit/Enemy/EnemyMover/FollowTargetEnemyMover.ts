import { Vec3 } from "cc";
import { EnemyMover } from "./EnemyMover";

export class FollowTargetEnemyMover extends EnemyMover {
    public gameTick(deltaTime: number): void {
        this.enemies.forEach((enemy) => {
            let direction: Vec3 = new Vec3();
            direction = Vec3.subtract(direction, this.targetNode.worldPosition, enemy.node.worldPosition);
            if (!this.isInsideAggroRange(enemy, direction)) {
                enemy.gameTick(new Vec3(), deltaTime);
                return;
            }

            enemy.gameTick(direction.normalize(), deltaTime);
        });
    }

    private isInsideAggroRange(enemy: { AggroRange: number }, directionToTarget: Vec3): boolean {
        const aggroRange = Math.max(0, enemy.AggroRange || 0);
        if (aggroRange <= 0) return true;

        const distanceSquared = directionToTarget.x * directionToTarget.x + directionToTarget.y * directionToTarget.y;
        return distanceSquared <= aggroRange * aggroRange;
    }
}
