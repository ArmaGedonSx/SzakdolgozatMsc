import { director } from "cc";
import { AppRoot } from "../AppRoot/AppRoot";
import { ZoneResolver } from "../Game/Data/ZoneResolver";
import { UserData } from "../Game/Data/UserData";
import { Game, GameResult } from "../Game/Game";
import { delay } from "../Services/Utils/AsyncUtils";
import { GameRunCompletion } from "./GameRunCompletion";

export class GameRunner {
    private static instance: GameRunner = new GameRunner();

    private isRunning = false;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    public static get Instance(): GameRunner {
        return this.instance;
    }

    public get IsRunning(): boolean {
        return this.isRunning;
    }

    public async playGame(): Promise<void> {
        this.isRunning = true;
        director.loadScene("Game");
        const userData: UserData = AppRoot.Instance.LiveUserData;
        ZoneResolver.resolveCurrentZone(AppRoot.Instance.Settings, userData);
        while (Game.Instance == null) await delay(10);
        const result: GameResult = await Game.Instance.play(userData, AppRoot.Instance.Settings, AppRoot.Instance.TranslationData);
        GameRunCompletion.apply(AppRoot.Instance.Settings, userData, result);
        AppRoot.Instance.saveUserData();
        director.loadScene("Menu");

        this.isRunning = false;
    }
}
