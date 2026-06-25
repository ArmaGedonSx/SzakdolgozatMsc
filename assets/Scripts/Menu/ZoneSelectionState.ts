import { GameSettings, ZoneSettings } from "../Game/Data/GameSettings";
import { UserData } from "../Game/Data/UserData";

export class ZoneSelectionState {
    public static trySelectZone(settings: GameSettings, userData: UserData, zoneId: string): boolean {
        const zone = (settings.zones ?? []).find((candidate) => candidate.zoneId === zoneId);
        if (!zone || !this.canSelectZone(zone, userData)) return false;

        userData.game.currentZoneId = zone.zoneId;
        return true;
    }

    private static canSelectZone(zone: ZoneSettings, userData: UserData): boolean {
        return zone.isUnlocked && userData.game.unlockedZones.includes(zone.zoneId) && zone.requiredLevel <= userData.game.level;
    }
}
