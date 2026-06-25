jest.mock(
    "cc",
    () => ({
        Collider2D: class {}
    }),
    { virtual: true }
);
jest.mock("../../../assets/Scripts/Game/Unit/Enemy/Enemy", () => ({ Enemy: class {} }));
jest.mock("../../../assets/Scripts/Game/Unit/Player/Weapon/Weapon", () => ({ Weapon: class {} }));

import { WeaponCollisionSystem } from "../../../assets/Scripts/Game/Collision/WeaponCollisionSystem";

test("WeaponCollisionSystem applies rolled weapon damage instead of raw base damage", () => {
    const dealDamage = jest.fn();
    const weapon = {
        Collider: {
            ContactBeginEvent: {
                on: jest.fn()
            }
        },
        WeaponStrikeEvent: {
            on: jest.fn()
        },
        rollDamage: jest.fn().mockReturnValue(18)
    } as any;

    const system = new WeaponCollisionSystem(weapon);
    const enemyCollider = {
        getComponent: () => ({
            dealDamage
        })
    } as any;

    (system as any).onWeaponContactBegin(enemyCollider);

    expect(weapon.rollDamage).toHaveBeenCalled();
    expect(dealDamage).toHaveBeenCalledWith(18);
});

test("WeaponCollisionSystem only damages the same enemy once per weapon strike", () => {
    const dealDamage = jest.fn();
    let strikeHandler: () => void = () => undefined;
    const weapon = {
        Collider: {
            ContactBeginEvent: {
                on: jest.fn()
            }
        },
        WeaponStrikeEvent: {
            on: jest.fn((handler, thisArg) => {
                strikeHandler = () => handler.call(thisArg);
            })
        },
        rollDamage: jest.fn().mockReturnValue(18)
    } as any;
    const system = new WeaponCollisionSystem(weapon);
    const enemy = { dealDamage };
    const enemyCollider = {
        getComponent: () => enemy
    } as any;

    strikeHandler();
    (system as any).onWeaponContactBegin(enemyCollider);
    (system as any).onWeaponContactBegin(enemyCollider);
    strikeHandler();
    (system as any).onWeaponContactBegin(enemyCollider);

    expect(weapon.rollDamage).toHaveBeenCalledTimes(2);
    expect(dealDamage).toHaveBeenCalledTimes(2);
});
