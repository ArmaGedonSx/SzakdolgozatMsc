import { GameSettings, MaterialSettings } from "./GameSettings";
import { UserData } from "./UserData";

export class MaterialDropResolver {
    public static tryResolveDrop(settings: GameSettings, zoneId: string): string | null {
        const availableMaterials = settings.materials.filter((material) => this.isAvailableInZone(material, zoneId) && 0 < material.dropWeight);
        if (availableMaterials.length === 0) return null;

        const totalWeight = availableMaterials.reduce((sum, material) => sum + material.dropWeight, 0);
        let roll = Math.random() * totalWeight;

        for (const material of availableMaterials) {
            roll -= material.dropWeight;
            if (roll <= 0) {
                return material.materialId;
            }
        }

        return availableMaterials[availableMaterials.length - 1].materialId;
    }

    public static applyCollectedMaterials(userData: UserData, collectedMaterials: Record<string, number>): void {
        for (const [materialId, quantity] of Object.entries(collectedMaterials)) {
            if (quantity <= 0) continue;
            userData.game.materials[materialId] = (userData.game.materials[materialId] ?? 0) + quantity;
        }
    }

    private static isAvailableInZone(material: MaterialSettings, zoneId: string): boolean {
        return material.dropZones.length === 0 || material.dropZones.includes(zoneId);
    }
}
