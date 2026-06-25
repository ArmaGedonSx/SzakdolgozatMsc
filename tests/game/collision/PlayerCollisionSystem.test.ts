jest.mock(
    "cc",
    () => ({
        _decorator: {
            ccclass: () => (_target: unknown) => _target,
            property: () => () => undefined
        },
        Component: class {},
        Node: class {},
        Vec3: class {},
        Collider2D: class {},
        ccenum: () => undefined,
        Enum: (value: unknown) => value,
        Contact2DType: {
            BEGIN_CONTACT: "begin-contact",
            END_CONTACT: "end-contact"
        }
    }),
    { virtual: true }
);

import { PlayerCollisionSystem } from "../../../assets/Scripts/Game/Collision/PlayerCollisionSystem";

function createPlayerMock(defense: number) {
    const damage = jest.fn();

    return {
        Collider: {
            on: jest.fn()
        },
        Health: {
            IsAlive: true,
            damage
        },
        Defense: defense
    } as any;
}

test("PlayerCollisionSystem applies defense against enemy contact damage", () => {
    const player = createPlayerMock(3);
    const system = new PlayerCollisionSystem(player, 0, {} as any);
    const enemyCollider = {
        node: {
            getComponent: () => ({
                Damage: 10
            })
        }
    } as any;

    (system as any).resolveEnemyContact(enemyCollider);

    expect(player.Health.damage).toHaveBeenCalledWith(7);
});

test("PlayerCollisionSystem respects enemy attack cooldown for repeated contact damage", () => {
    const player = createPlayerMock(0);
    const system = new PlayerCollisionSystem(player, 0, {} as any);
    const enemyCollider = {
        node: {
            getComponent: () => ({
                Damage: 10,
                AttackCooldown: 1
            })
        }
    } as any;

    (system as any).resolveEnemyContact(enemyCollider);
    (system as any).resolveEnemyContact(enemyCollider);
    system.gameTick(0.5);
    (system as any).resolveEnemyContact(enemyCollider);
    system.gameTick(0.5);
    (system as any).resolveEnemyContact(enemyCollider);

    expect(player.Health.damage).toHaveBeenCalledTimes(2);
    expect(player.Health.damage).toHaveBeenNthCalledWith(1, 10);
    expect(player.Health.damage).toHaveBeenNthCalledWith(2, 10);
});

test("PlayerCollisionSystem applies defense against enemy projectile damage with a minimum of one", () => {
    const player = createPlayerMock(10);
    const pierce = jest.fn();
    const system = new PlayerCollisionSystem(player, 0, {} as any);
    const projectileCollider = {
        node: {
            getComponent: () => ({
                Damage: 4,
                pierce
            })
        }
    } as any;

    (system as any).resolveEnemyProjectileContact(projectileCollider);

    expect(pierce).toHaveBeenCalled();
    expect(player.Health.damage).toHaveBeenCalledWith(1);
});
