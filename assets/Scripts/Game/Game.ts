import { Canvas, Component, KeyCode, Vec2, _decorator, Node, approx } from "cc";
import { AppRoot } from "../AppRoot/AppRoot";
import { requireAppRootAsync } from "../AppRoot/AppRootUtils";
import { delay } from "../Services/Utils/AsyncUtils";
import { GameAudioAdapter } from "./Audio/GameAudioAdapter";
import { Background } from "./Background/Background";
import { MagnetCollisionSystem } from "./Collision/MagnetCollisionSystem";
import { PlayerCollisionSystem } from "./Collision/PlayerCollisionSystem";
import { PlayerProjectileCollisionSystem } from "./Collision/PlayerProjectileCollisionSystem";
import { WeaponCollisionSystem } from "./Collision/WeaponCollisionSystem";
import { GameSettings, PlayerSettings } from "./Data/GameSettings";
import { EquipmentBonuses, EquipmentBonusResolver } from "./Data/EquipmentBonuses";
import { DefaultSkillContent } from "./Data/DefaultSkillContent";
import { ItemDropResolver } from "./Data/ItemDrops";
import { MaterialDropResolver } from "./Data/MaterialDrops";
import { PlayerProgression } from "./Data/PlayerProgression";
import { PlayerRuntimeState } from "./Data/PlayerRuntimeState";
import { SkillBonuses, SkillBonusResolver } from "./Data/SkillBonuses";
import { StageObjective } from "./Data/StageObjective";
import { TranslationData } from "./Data/TranslationData";
import { UserData } from "./Data/UserData";
import { KeyboardInput } from "./Input/KeyboardInput";
import { MultiInput } from "./Input/MultiInput";
import { VirtualJoystic } from "./Input/VirtualJoystic";
import { ItemAttractor } from "./Items/ItemAttractor";
import { ItemManager } from "./Items/ItemManager";
import { GameModalLauncher } from "./ModalWIndows/GameModalLauncher";
import { Pauser } from "./Pauser";
import { TestValues } from "./TestGameRunner";
import { GameUI } from "./UI/GameUI";
import { EnemyDeathEffectSpawner } from "./Unit/Enemy/EnemyDeathEffectSpawner/EnemyDeathEffectSpawner";
import { Enemy } from "./Unit/Enemy/Enemy";
import { EnemyManager } from "./Unit/Enemy/EnemyManager";
import { EnemyProjectileLauncher } from "./Unit/Enemy/ProjectileLauncher.cs/EnemyProjectileLauncher";
import { MetaUpgrades } from "./Unit/MetaUpgrades/MetaUpgrades";
import { Player, PlayerData } from "./Unit/Player/Player";
import { HaloProjectileLauncher } from "./Projectile/ProjectileLauncher/HaloProjectileLauncher";
import { ProjectileData } from "./Projectile/ProjectileLauncher/ProjectileData";
import { ProjectileLauncher } from "./Projectile/ProjectileLauncher/ProjectileLauncher";
import { WaveProjectileLauncher } from "./Projectile/ProjectileLauncher/WaveProjectileLauncher";
import { Upgrader } from "./Upgrades/Upgrader";
import { MetaUpgradeType } from "./Upgrades/UpgradeType";

const { ccclass, property } = _decorator;

@ccclass("Game")
export class Game extends Component {
    private static instance: Game;

    @property(VirtualJoystic) private virtualJoystic: VirtualJoystic;
    @property(Player) private player: Player;
    @property(ProjectileLauncher) private haloProjectileLauncherComponent: ProjectileLauncher;
    @property(ProjectileLauncher) private horizontalProjectileLauncherComponent: ProjectileLauncher;
    @property(ProjectileLauncher) private diagonalProjectileLauncherComponent: ProjectileLauncher;
    @property(ProjectileLauncher) private enemyAxeProjectileLauncherComponent: ProjectileLauncher;
    @property(ProjectileLauncher) private enemyMagicOrbProjectileLauncherComponent: ProjectileLauncher;
    @property(EnemyManager) private enemyManager: EnemyManager;
    @property(EnemyDeathEffectSpawner) private deathEffectSpawner: EnemyDeathEffectSpawner;
    @property(ItemManager) private itemManager: ItemManager;
    @property(GameUI) private gameUI: GameUI;
    @property(Canvas) private gameCanvas: Canvas;
    @property(Background) private background: Background;
    @property(GameAudioAdapter) private gameAudioAdapter: GameAudioAdapter;
    @property(Node) private blackScreen: Node;

    private playerCollisionSystem: PlayerCollisionSystem;
    private haloProjectileLauncher: HaloProjectileLauncher;
    private horizontalProjectileLauncher: WaveProjectileLauncher;
    private diagonalProjectileLauncher: WaveProjectileLauncher;

    private enemyAxeProjectileLauncher: EnemyProjectileLauncher;
    private enemyMagicOrbProjectileLauncher: EnemyProjectileLauncher;

    private itemAttractor: ItemAttractor;

    private gamePauser: Pauser = new Pauser();
    private gameResult: GameResult | null = null;
    private exitRequested = false;

    private timeAlive = 0;
    private bossMilestones: number[] = [];
    private hordeMilestones: number[] = [];
    private targetSurvivalSeconds = 0;

    public static get Instance(): Game {
        return this.instance;
    }

    public start(): void {
        this.gamePauser.pause();
        Game.instance = this;
        this.blackScreen.active = true;
    }

    public async play(userData: UserData, settings: GameSettings, translationData: TranslationData, testValues?: TestValues): Promise<GameResult> {
        this.exitRequested = false;
        await this.setup(userData, settings, translationData, testValues);
        const runResult = this.gameResult ?? new GameResult();
        this.gameResult = runResult;

        AppRoot.Instance.Analytics.gameStart();

        this.gamePauser.resume();
        this.blackScreen.active = false;
        AppRoot.Instance.ScreenFader.playClose();

        while (!this.shouldExitRun(runResult) && (this.player?.Health?.IsAlive ?? false) && !this.isStageObjectiveComplete()) await delay(100);

        this.gamePauser.pause();
        Game.instance = null;
        runResult.hasExitManually = this.shouldExitRun(runResult);
        runResult.score = this.timeAlive;
        runResult.zoneId = userData.game.currentZoneId;
        runResult.finalLevel = this.player?.Level?.CurrentLevel ?? 1;
        runResult.targetSurvivalSeconds = this.targetSurvivalSeconds;
        runResult.cleared = this.isStageObjectiveComplete();

        if (!runResult.hasExitManually) {
            AppRoot.Instance.Analytics.goldPerRun(runResult.goldCoins);
            AppRoot.Instance.Analytics.gameEnd(runResult.score);

            await delay(2000);
        } else {
            AppRoot.Instance.Analytics.gameExit(this.timeAlive);
        }

        if (this.player?.Level) {
            PlayerProgression.syncFromRuntime(userData, this.player.Level);
        }
        if (this.player) {
            PlayerRuntimeState.syncFromRuntime(userData, this.player);
        }
        return runResult;
    }

    public exitGame(): void {
        this.tryExitGame();
    }

    public tryExitGame(): boolean {
        this.exitRequested = true;

        if (!this.gameResult) {
            console.warn("[Game] Exit requested before an active run was initialized.");
            return true;
        }

        this.gameResult.hasExitManually = true;
        return true;
    }

    private shouldExitRun(gameResult: GameResult): boolean {
        return this.exitRequested || gameResult.hasExitManually;
    }

    public update(deltaTime: number): void {
        if (this.gamePauser.IsPaused || !this.player || !this.player.isValid) return;

        this.player.gameTick(deltaTime);
        this.playerCollisionSystem.gameTick(deltaTime);
        this.enemyManager.gameTick(deltaTime);
        this.haloProjectileLauncher.gameTick(deltaTime);
        this.horizontalProjectileLauncher.gameTick(deltaTime);
        this.diagonalProjectileLauncher.gameTick(deltaTime);
        this.enemyAxeProjectileLauncher.gameTick(deltaTime);
        this.enemyMagicOrbProjectileLauncher.gameTick(deltaTime);
        this.itemAttractor.gameTick(deltaTime);
        this.background.gameTick();

        this.timeAlive += deltaTime;
        this.gameUI.updateTimeAlive(this.timeAlive, {
            hordeMilestones: this.hordeMilestones,
            bossMilestones: this.bossMilestones,
            targetSurvivalSeconds: this.targetSurvivalSeconds
        });

        AppRoot.Instance.MainCamera.node.setWorldPosition(this.player.node.worldPosition);
        this.gameUI.node.setWorldPosition(this.player.node.worldPosition);
    }

    private async setup(userData: UserData, settings: GameSettings, translationData: TranslationData, testValues: TestValues): Promise<void> {
        await requireAppRootAsync();
        this.gameCanvas.cameraComponent = AppRoot.Instance.MainCamera;

        const runResult = new GameResult();
        this.gameResult = runResult;
        this.targetSurvivalSeconds = StageObjective.resolveTargetSeconds(settings, userData.game.currentZoneId);
        this.bossMilestones = this.resolveBossMilestones(settings, userData.game.currentZoneId);
        this.hordeMilestones = this.resolveHordeMilestones(settings, userData.game.currentZoneId);
        const metaUpgrades = new MetaUpgrades(userData.game.metaUpgrades, settings.metaUpgrades);
        const equipmentBonuses = EquipmentBonusResolver.resolve(settings, userData);
        const skillBonuses = SkillBonusResolver.resolve(settings, userData);

        this.virtualJoystic.init();

        const wasd = new KeyboardInput(KeyCode.KEY_W, KeyCode.KEY_S, KeyCode.KEY_A, KeyCode.KEY_D);
        const arrowKeys = new KeyboardInput(KeyCode.ARROW_UP, KeyCode.ARROW_DOWN, KeyCode.ARROW_LEFT, KeyCode.ARROW_RIGHT);
        const multiInput: MultiInput = new MultiInput([this.virtualJoystic, wasd, arrowKeys]);

        this.player.init(multiInput, this.createPlayerData(settings.player, metaUpgrades, equipmentBonuses, skillBonuses, userData));
        PlayerRuntimeState.applySavedPosition(userData, this.player);
        this.enemyManager.init(this.player.node, settings.enemyManager, userData.game.currentZoneId, userData.game.level);
        this.enemyManager.EnemyAddedEvent.on(this.addEnemyResultListeners, this);
        this.enemyManager.EnemyRemovedEvent.on(this.removeEnemyResultListeners, this);
        this.deathEffectSpawner.init(this.enemyManager);

        this.playerCollisionSystem = new PlayerCollisionSystem(this.player, settings.player.collisionDelay, this.itemManager);
        new WeaponCollisionSystem(this.player.Weapon);

        const projectileData = new ProjectileData();
        projectileData.damage = 1 + metaUpgrades.getUpgradeValue(MetaUpgradeType.OverallDamage) + equipmentBonuses.atk + skillBonuses.atk;
        projectileData.pierces = 1 + metaUpgrades.getUpgradeValue(MetaUpgradeType.ProjectilePiercing);
        projectileData.critChance = equipmentBonuses.critChance + skillBonuses.critChance;
        projectileData.critMult = Math.max(1, equipmentBonuses.critMult * skillBonuses.critMult);

        this.haloProjectileLauncher = new HaloProjectileLauncher(
            this.haloProjectileLauncherComponent,
            this.player.node,
            settings.player.haloLauncher,
            projectileData
        );

        this.horizontalProjectileLauncher = new WaveProjectileLauncher(
            this.horizontalProjectileLauncherComponent,
            this.player.node,
            [new Vec2(0, 1), new Vec2(-0.1, 0.8), new Vec2(0.1, 0.8)],
            settings.player.horizontalLauncher,
            projectileData
        );

        this.diagonalProjectileLauncher = new WaveProjectileLauncher(
            this.diagonalProjectileLauncherComponent,
            this.player.node,
            [new Vec2(-0.5, -0.5), new Vec2(0.5, -0.5)],
            settings.player.diagonalLauncher,
            projectileData
        );

        this.enemyAxeProjectileLauncher = new EnemyProjectileLauncher(
            this.enemyAxeProjectileLauncherComponent,
            this.player.node,
            this.enemyManager,
            settings.enemyManager.axeLauncher
        );

        this.enemyMagicOrbProjectileLauncher = new EnemyProjectileLauncher(
            this.enemyMagicOrbProjectileLauncherComponent,
            this.player.node,
            this.enemyManager,
            settings.enemyManager.magicOrbLauncher
        );

        new PlayerProjectileCollisionSystem([this.haloProjectileLauncher, this.horizontalProjectileLauncher, this.diagonalProjectileLauncher]);

        this.itemAttractor = new ItemAttractor(this.player.node, 100);
        new MagnetCollisionSystem(this.player.Magnet, this.itemAttractor);

        const upgrader = new Upgrader(
            this.player,
            this.horizontalProjectileLauncher,
            this.haloProjectileLauncher,
            this.diagonalProjectileLauncher,
            DefaultSkillContent.normalize(settings.skills ?? [], settings.upgrades),
            userData.game.skillTree,
            userData
        );
        const modalLauncher = new GameModalLauncher(AppRoot.Instance.ModalWindowManager, this.player, this.gamePauser, upgrader);

        this.itemManager.init(
            this.enemyManager,
            this.player,
            runResult,
            modalLauncher,
            settings.items,
            1 + equipmentBonuses.goldBonus + skillBonuses.goldBonus,
            userData.game.currentZoneId,
            (zoneId) => MaterialDropResolver.tryResolveDrop(settings, zoneId),
            (zoneId) => ItemDropResolver.tryResolveDrop(settings, zoneId)
        );
        this.gameUI.init(this.player, modalLauncher, this.itemManager, runResult);
        this.background.init(this.player.node, userData.game.currentZoneId);

        if (testValues) {
            this.timeAlive += testValues.startTime;
            this.player.Level.addXp(testValues.startXP);
        }

        this.gameAudioAdapter.init(
            this.player,
            this.enemyManager,
            this.itemManager,
            this.horizontalProjectileLauncher,
            this.diagonalProjectileLauncher,
            this.haloProjectileLauncher
        );
    }

    private createPlayerData(
        settings: PlayerSettings,
        metaUpgrades: MetaUpgrades,
        equipmentBonuses: EquipmentBonuses,
        skillBonuses: SkillBonuses,
        userData: UserData
    ): PlayerData {
        const playerData: PlayerData = Object.assign(new PlayerData(), settings);

        playerData.initialLevel = userData.game.level;
        playerData.initialXp = userData.game.xp;
        playerData.maxHp = metaUpgrades.getUpgradeValue(MetaUpgradeType.Health) + settings.defaultHP + equipmentBonuses.hp + skillBonuses.hp;
        playerData.requiredXP = settings.requiredXP;
        playerData.speed = metaUpgrades.getUpgradeValue(MetaUpgradeType.MovementSpeed) + settings.speed + equipmentBonuses.speed + skillBonuses.speed;
        playerData.defense = equipmentBonuses.def + skillBonuses.def;
        playerData.regenerationDelay = settings.regenerationDelay;
        playerData.xpMultiplier = metaUpgrades.getUpgradeValue(MetaUpgradeType.XPGatherer) + 1 + equipmentBonuses.xpBonus + skillBonuses.xpBonus;
        playerData.goldMultiplier = metaUpgrades.getUpgradeValue(MetaUpgradeType.GoldGatherer) + 1 + equipmentBonuses.goldBonus + skillBonuses.goldBonus;
        playerData.critChance = equipmentBonuses.critChance + skillBonuses.critChance;
        playerData.critMult = Math.max(1, equipmentBonuses.critMult * skillBonuses.critMult);

        playerData.damage = metaUpgrades.getUpgradeValue(MetaUpgradeType.OverallDamage) + settings.weapon.damage + equipmentBonuses.atk + skillBonuses.atk;
        playerData.strikeDelay = settings.weapon.strikeDelay;

        playerData.magnetDuration = settings.magnetDuration;

        return playerData;
    }

    private addEnemyResultListeners(enemy: Enemy): void {
        enemy.DeathEvent.on(this.recordEnemyKill, this);
    }

    private removeEnemyResultListeners(enemy: Enemy): void {
        enemy.DeathEvent.off(this.recordEnemyKill);
    }

    private recordEnemyKill(): void {
        if (this.gameResult) this.gameResult.kills++;
    }

    private resolveBossMilestones(settings: GameSettings, zoneId: string): number[] {
        return settings.enemyManager.zoneEnemySpawns
            .filter((spawn) => spawn.zoneId === zoneId)
            .filter((spawn) => spawn.enemyId.includes("Boss"))
            .map((spawn) => Math.floor(spawn.milestoneTimeSeconds ?? 0))
            .filter((milestone) => 0 < milestone)
            .sort((left, right) => left - right);
    }

    private resolveHordeMilestones(settings: GameSettings, zoneId: string): number[] {
        return settings.enemyManager.zoneEnemySpawns
            .filter((spawn) => spawn.zoneId === zoneId)
            .filter((spawn) => !spawn.enemyId.includes("Boss"))
            .filter((spawn) => spawn.spawnPattern === "circular" || spawn.spawnPattern === "wave")
            .map((spawn) => Math.floor(spawn.milestoneTimeSeconds ?? 0))
            .filter((milestone) => 0 < milestone)
            .sort((left, right) => left - right);
    }

    private isStageObjectiveComplete(): boolean {
        return 0 < this.targetSurvivalSeconds && this.targetSurvivalSeconds <= this.timeAlive;
    }
}

export class GameResult {
    public hasExitManually = false;
    public zoneId = "";
    public kills = 0;
    public finalLevel = 1;
    public chestsOpened = 0;
    public goldCoins = 0;
    public score = 0;
    public cleared = false;
    public targetSurvivalSeconds = 0;
    public collectedMaterials: Record<string, number> = {};
    public collectedItems: Record<string, number> = {};
}
