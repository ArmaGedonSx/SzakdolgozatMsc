jest.mock(
    "cc",
    () => ({
        Node: class {},
        Vec3: class {
            public x: number;
            public y: number;
            public z: number;

            public constructor(x = 0, y = 0, z = 0) {
                this.x = x;
                this.y = y;
                this.z = z;
            }

            public static subtract(out: any, left: any, right: any): any {
                out.x = left.x - right.x;
                out.y = left.y - right.y;
                out.z = (left.z ?? 0) - (right.z ?? 0);
                return out;
            }

            public normalize(): this {
                const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                if (length > 0) {
                    this.x /= length;
                    this.y /= length;
                    this.z /= length;
                }
                return this;
            }
        }
    }),
    { virtual: true }
);

import { Vec3 } from "cc";
import { FollowTargetEnemyMover } from "../../../assets/Scripts/Game/Unit/Enemy/EnemyMover/FollowTargetEnemyMover";

function createEnemy(x: number, y: number, aggroRange: number) {
    return {
        AggroRange: aggroRange,
        node: {
            worldPosition: new Vec3(x, y, 0)
        },
        gameTick: jest.fn()
    } as any;
}

test("FollowTargetEnemyMover keeps enemies idle outside their data-driven aggro range", () => {
    const targetNode = { worldPosition: new Vec3(100, 0, 0) } as any;
    const enemy = createEnemy(0, 0, 80);
    const mover = new FollowTargetEnemyMover(targetNode);

    mover.addEnemy(enemy);
    mover.gameTick(0.5);

    expect(enemy.gameTick).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0 }), 0.5);
});

test("FollowTargetEnemyMover follows when the target is inside aggro range", () => {
    const targetNode = { worldPosition: new Vec3(30, 0, 0) } as any;
    const enemy = createEnemy(0, 0, 80);
    const mover = new FollowTargetEnemyMover(targetNode);

    mover.addEnemy(enemy);
    mover.gameTick(0.5);

    expect(enemy.gameTick).toHaveBeenCalledWith(expect.objectContaining({ x: 1, y: 0 }), 0.5);
});

test("FollowTargetEnemyMover keeps zero aggro range as legacy always-follow behavior", () => {
    const targetNode = { worldPosition: new Vec3(100, 0, 0) } as any;
    const enemy = createEnemy(0, 0, 0);
    const mover = new FollowTargetEnemyMover(targetNode);

    mover.addEnemy(enemy);
    mover.gameTick(0.5);

    expect(enemy.gameTick).toHaveBeenCalledWith(expect.objectContaining({ x: 1, y: 0 }), 0.5);
});
