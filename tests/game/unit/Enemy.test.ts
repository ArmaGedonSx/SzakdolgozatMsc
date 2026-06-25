jest.mock(
    "cc",
    () => ({
        _decorator: {
            ccclass: (): ((target: unknown) => unknown) => (_target: unknown): unknown => _target,
            property: (): (() => undefined) => (): undefined => undefined
        },
        BoxCollider2D: class {},
        Component: class {},
        Material: class {},
        randomRange: (_min: number, max: number) => max,
        Sprite: class {},
        Vec3: class {
            public x: number;
            public y: number;
            public z: number;

            public constructor(x = 0, y = 0, z = 0) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
        }
    }),
    { virtual: true }
);

import { Vec3 } from "cc";
import { EnemySettings } from "../../../assets/Scripts/Game/Data/GameSettings";
import { Enemy } from "../../../assets/Scripts/Game/Unit/Enemy/Enemy";

function createEnemySettings(): EnemySettings {
    const settings = new EnemySettings();
    settings.id = "slime";
    settings.baseHp = 30;
    settings.baseAtk = 8;
    settings.baseSpeed = 0.6;
    settings.aggroRange = 80;
    settings.attackRange = 18;
    settings.attackCooldown = 1.1;
    return settings;
}

function createEnemy(): Enemy {
    const enemy = new Enemy();
    (enemy as any).node = {
        active: false,
        setWorldPosition: jest.fn(),
        worldPosition: new Vec3()
    };
    return enemy;
}

test("Enemy setup exposes data-driven aggro and attack behavior settings", () => {
    const enemy = createEnemy();

    enemy.setup(new Vec3(10, 20, 0), createEnemySettings(), 2);

    expect(enemy.AggroRange).toBe(80);
    expect(enemy.AttackRange).toBe(18);
    expect(enemy.AttackCooldown).toBe(1.1);
});
