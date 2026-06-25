import { sys } from "cc";
import { merge } from "lodash";
import { UserData } from "../Game/Data/UserData";

export class SaveSystem {
    private userDataIdentifier = "user-dse";
    public save(userData: UserData): void {
        this.prepareForPersistence(userData);
        sys.localStorage.setItem(this.userDataIdentifier, JSON.stringify(userData));
    }

    public load(): UserData {
        const data: string = sys.localStorage.getItem(this.userDataIdentifier);

        if (!data) return new UserData();

        try {
            // Merge persisted values onto defaults so newly added save fields get sane values.
            const merged = merge(new UserData(), JSON.parse(data)) as UserData;
            this.ensureProfileDefaults(merged);
            return merged;
        } catch (error) {
            return new UserData();
        }
    }

    private prepareForPersistence(userData: UserData): void {
        this.ensureProfileDefaults(userData);
        userData.game.gold = userData.game.goldCoins;
        const now = new Date().toISOString();
        userData.lastUpdated = now;
        userData.game.lastOnline = now;
    }

    private ensureProfileDefaults(userData: UserData): void {
        const now = new Date().toISOString();

        if (!userData.playerId) {
            userData.playerId = this.createPlayerId();
        }
        if (!userData.displayName) {
            userData.displayName = "Player";
        }
        if (!userData.createdAt || userData.createdAt === new Date(0).toISOString()) {
            userData.createdAt = now;
        }
        if (!userData.lastUpdated || userData.lastUpdated === new Date(0).toISOString()) {
            userData.lastUpdated = now;
        }
        if (!userData.game.lastOnline || userData.game.lastOnline === new Date(0).toISOString()) {
            userData.game.lastOnline = now;
        }
        userData.game.goldCoins = Math.max(0, userData.game.goldCoins || userData.game.gold || 0);
        userData.game.gold = userData.game.goldCoins;
        userData.game.clearedZones = Array.isArray(userData.game.clearedZones) ? userData.game.clearedZones : [];
    }

    private createPlayerId(): string {
        return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
}
