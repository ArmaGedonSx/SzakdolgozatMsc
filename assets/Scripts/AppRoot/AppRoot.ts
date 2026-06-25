import { Camera, Component, director, instantiate, JsonAsset, Prefab, _decorator } from "cc";
import { GameSettings } from "../Game/Data/GameSettings";
import { GameAssets } from "../Game/Data/Assets/GameAssets";
import { ContentValidator } from "../Game/Data/ContentValidator";
import { InventoryState } from "../Game/Data/InventoryState";
import { OfflineProgressState } from "../Game/Data/OfflineProgressState";
import { PlayerProgression } from "../Game/Data/PlayerProgression";
import { PlayerRuntimeState } from "../Game/Data/PlayerRuntimeState";
import { SkillBonusResolver } from "../Game/Data/SkillBonuses";
import { PlayerSkillTreeState } from "../Game/Data/PlayerSkillTreeState";
import { TranslationData } from "../Game/Data/TranslationData";
import { UserData } from "../Game/Data/UserData";
import { ZoneResolver } from "../Game/Data/ZoneResolver";
import { AudioPlayer } from "../Services/AudioPlayer/AudioPlayer";
import { SaveSystem } from "./SaveSystem";
import { ModalWindowManager } from "../Services/ModalWindowSystem/ModalWindowManager";
import { OpenCloseAnimator } from "../Utils/OpenCloseAnimator";
import { Analytics } from "./Analytics";
const { ccclass, property } = _decorator;

@ccclass("AppRoot")
export class AppRoot extends Component {
    @property(AudioPlayer) private audio: AudioPlayer;
    @property(JsonAsset) private settingsAsset: JsonAsset;
    @property(JsonAsset) private engTranslationAsset: JsonAsset;
    @property(Prefab) private gameAssetsPrefab: Prefab;
    @property(Camera) private mainCamera: Camera;
    @property(ModalWindowManager) private modalWindowManager: ModalWindowManager;
    @property(OpenCloseAnimator) private screenFader: OpenCloseAnimator;

    private static instance: AppRoot;
    private saveSystem: SaveSystem;
    private initPromise: Promise<void>;

    private liveUserData: UserData;
    private gameAssets: GameAssets;
    private analytics: Analytics;

    public static get Instance(): AppRoot {
        return this.instance;
    }

    public get AudioPlayer(): AudioPlayer {
        return this.audio;
    }

    public get GameAssets(): GameAssets {
        return this.gameAssets;
    }

    public get LiveUserData(): UserData {
        return this.liveUserData;
    }

    public get IsReady(): boolean {
        return this.liveUserData != null;
    }

    public get Settings(): GameSettings {
        return <GameSettings>this.settingsAsset.json;
    }

    public get TranslationData(): TranslationData {
        return <TranslationData>this.engTranslationAsset.json;
    }

    public get ModalWindowManager(): ModalWindowManager {
        return this.modalWindowManager;
    }

    public get MainCamera(): Camera {
        return this.mainCamera;
    }

    public get ScreenFader(): OpenCloseAnimator {
        return this.screenFader;
    }

    public get Analytics(): Analytics {
        return this.analytics;
    }

    public saveUserData(): void {
        this.saveSystem.save(this.liveUserData);
    }

    public start(): void {
        if (AppRoot.Instance == null) {
            AppRoot.instance = this;
            director.addPersistRootNode(this.node);
            this.initPromise = this.init();
        } else {
            this.node.destroy();
        }
    }

    public async waitUntilReady(): Promise<void> {
        await this.initPromise;
    }

    public update(deltaTime: number): void {
        if (this.analytics) this.analytics.update(deltaTime);
    }

    private async init(): Promise<void> {
        const contentIssues = ContentValidator.validate(this.Settings);
        const blockingContentIssues = contentIssues.filter((issue) => issue.severity === "error");
        if (blockingContentIssues.length > 0) {
            throw new Error(`Invalid content data:\n${blockingContentIssues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`);
        }

        this.saveSystem = new SaveSystem();
        this.liveUserData = this.saveSystem.load();
        PlayerSkillTreeState.normalize(this.Settings, this.liveUserData);
        InventoryState.normalize(this.Settings, this.liveUserData);
        this.liveUserData.game.idleRate = Math.max(1, 1 + SkillBonusResolver.resolve(this.Settings, this.liveUserData).idleRate);
        OfflineProgressState.normalize(this.Settings, this.liveUserData);
        PlayerProgression.normalize(this.Settings, this.liveUserData);
        PlayerRuntimeState.normalize(this.Settings, this.liveUserData);
        ZoneResolver.resolveCurrentZone(this.Settings, this.liveUserData);
        this.saveUserData();

        const gameAssetsNode = instantiate(this.gameAssetsPrefab);
        gameAssetsNode.setParent(this.node);
        this.gameAssets = gameAssetsNode.getComponent(GameAssets);
        this.gameAssets.init();

        this.audio.init(this.LiveUserData.soundVolume, this.LiveUserData.musicVolume);

        this.screenFader.init();
        this.screenFader.node.active = false;

        this.analytics = new Analytics();
    }
}
