import { EquippableItemSettings, GameSettings } from "./GameSettings";
import { UserData } from "./UserData";

export class EquipmentBonuses {
    public atk = 0;
    public def = 0;
    public hp = 0;
    public speed = 0;
    public critChance = 0;
    public critMult = 1;
    public goldBonus = 0;
    public xpBonus = 0;
}

export class EquipmentBonusResolver {
    public static resolve(settings: GameSettings, userData: UserData): EquipmentBonuses {
        const bonuses = new EquipmentBonuses();
        const equippedItemIds = [
            userData.game.equipment.mainHand,
            userData.game.equipment.head,
            userData.game.equipment.chest,
            userData.game.equipment.legs,
            userData.game.equipment.feet,
            userData.game.equipment.ring1,
            userData.game.equipment.ring2,
            userData.game.equipment.amulet
        ].filter((itemId): itemId is string => !!itemId);

        for (const itemId of equippedItemIds) {
            const item = settings.equippableItems.find((candidate) => candidate.itemId === itemId);
            if (!item) continue;
            if (userData.game.level < item.requiredLevel) continue;

            this.addItemStats(bonuses, item);
        }

        return bonuses;
    }

    private static addItemStats(bonuses: EquipmentBonuses, item: EquippableItemSettings): void {
        bonuses.atk += item.stats.atk;
        bonuses.def += item.stats.def;
        bonuses.hp += item.stats.hp;
        bonuses.speed += item.stats.speed;
        bonuses.critChance += item.stats.critChance;
        bonuses.critMult *= item.stats.critMult;
        bonuses.goldBonus += item.stats.goldBonus;
        bonuses.xpBonus += item.stats.xpBonus;
    }
}
