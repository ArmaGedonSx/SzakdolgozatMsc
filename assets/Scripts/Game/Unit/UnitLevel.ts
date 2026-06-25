import { ISignal } from "../../Services/EventSystem/ISignal";
import { Signal } from "../../Services/EventSystem/Signal";

export class UnitLevel {
    private xp = 0;
    private currentLevel = 0;
    private levelUpEvent: Signal<number> = new Signal<number>();
    private xpAddedEvent: Signal<number> = new Signal<number>();

    public constructor(private requiredXPs: number[], private xpMultiplier: number, currentLevel = 0, xp = 0) {
        this.currentLevel = Math.max(0, currentLevel);
        this.xp = Math.max(0, xp);
    }

    public addXp(points: number): void {
        this.xp += points * this.xpMultiplier;
        this.xpAddedEvent.trigger(this.xp);
        this.tryLevelUp();
    }

    public get XP(): number {
        return this.xp;
    }

    public get CurrentLevel(): number {
        return this.currentLevel + 1;
    }

    public get RequiredXP(): number {
        return this.requiredXPs[this.currentLevel] ?? 0;
    }

    public get LevelUpEvent(): ISignal<number> {
        return this.levelUpEvent;
    }

    public get XpAddedEvent(): ISignal<number> {
        return this.xpAddedEvent;
    }

    private tryLevelUp(): void {
        if (this.requiredXPs.length <= this.currentLevel) return;
        if (this.xp < this.requiredXPs[this.currentLevel]) return;

        this.xp -= this.requiredXPs[this.currentLevel];
        this.currentLevel++;

        this.levelUpEvent.trigger(this.currentLevel);

        this.tryLevelUp();
    }
}
