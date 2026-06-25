jest.mock(
    "cc",
    () => ({
        Collider2D: class {}
    }),
    { virtual: true }
);
jest.mock("../../../assets/Scripts/Game/Unit/Enemy/Enemy", () => ({ Enemy: class {} }));

import { PlayerProjectileCollisionSystem } from "../../../assets/Scripts/Game/Collision/PlayerProjectileCollisionSystem";

test("PlayerProjectileCollisionSystem applies rolled projectile damage instead of raw base damage", () => {
    const dealDamage = jest.fn();
    const pierce = jest.fn();
    const projectile = {
        rollDamage: jest.fn().mockReturnValue(22),
        pierce
    };

    const system = new PlayerProjectileCollisionSystem([]);
    const projectileCollision = {
        otherCollider: {
            getComponent: () => ({
                dealDamage
            })
        },
        projectile
    } as any;

    (system as any).onProjectileCollision(projectileCollision);

    expect(projectile.rollDamage).toHaveBeenCalled();
    expect(dealDamage).toHaveBeenCalledWith(22);
    expect(pierce).toHaveBeenCalled();
});
