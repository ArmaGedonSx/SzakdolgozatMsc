import * as fs from "fs";
import * as path from "path";

const weaponSourcePath = path.resolve(__dirname, "../../../assets/Scripts/Game/Unit/Player/Weapon/Weapon.ts");
const colliderSourcePath = path.resolve(__dirname, "../../../assets/Scripts/Game/Unit/Player/Weapon/UpgradableCollider.ts");
const swingAnimationPath = path.resolve(__dirname, "../../../assets/Media/Animation/Game/Weapon/WeaponSwing.anim");

test("weapon swing is a slower full-circle four-blade attack", () => {
    const weaponSource = fs.readFileSync(weaponSourcePath, "utf8");
    const colliderSource = fs.readFileSync(colliderSourcePath, "utf8");
    const animation = JSON.parse(fs.readFileSync(swingAnimationPath, "utf8"));

    expect(weaponSource).toContain("STRIKE_ANIMATION_SPEED = 0.75");
    expect(colliderSource).toContain("ACTIVE_BLADE_COUNT = 4");
    expect(resolveRootRotationDegrees(animation)).toBe(360);
});

function resolveRootRotationDegrees(animation: any[]): number {
    const vectorTrack = animation.find((entry) => entry.__type__ === "cc.animation.VectorTrack");
    const zChannel = vectorTrack._channels[2];
    const curve = animation[zChannel.__id__]._curve;
    const values = animation[curve.__id__]._values.map((value: { value: number }) => value.value);

    return Math.abs(values[values.length - 1] - values[0]);
}
