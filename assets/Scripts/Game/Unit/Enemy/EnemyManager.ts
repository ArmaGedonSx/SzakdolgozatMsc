import { Component, Node, _decorator } from "cc";
import { ISignal } from "../../../Services/EventSystem/ISignal";
import { EnemyManagerSettings, ZoneEnemySpawnSettings } from "../../Data/GameSettings";
import { Enemy } from "./Enemy";
import { EnemyMovementType } from "./EnemyMovementType";
import { IEnemyMover } from "./EnemyMover/EnemyMover";
import { FollowTargetEnemyMover } from "./EnemyMover/FollowTargetEnemyMover";
import { PeriodicFollowMovers } from "./EnemyMover/PeriodicFollow/PeriodicFollowMovers";
import { WaveEnemyMover } from "./EnemyMover/WaveEnemyMover";
import { ZoneEnemySpawnDirector } from "../../Data/ZoneEnemySpawnDirector";
import { ZoneSpawnPositionResolver } from "../../Data/ZoneSpawnPositionResolver";
import { CircularEnemySpawner } from "./EnemySpawner/CircularEnemySpawner";
import { DelayedEnemySpawner } from "./EnemySpawner/DelayedEnemySpawner";
import { EnemySpawner } from "./EnemySpawner/EnemySpawner";
import { IndividualEnemySpawner } from "./EnemySpawner/IndividualEnemySpawner";
import { WaveEnemySpawner } from "./EnemySpawner/WaveEnemySpawner";

const { ccclass, property } = _decorator;

@ccclass("EnemyManager")
export class EnemyManager extends Component {
    @property(EnemySpawner) private enemySpawner: EnemySpawner;

    private movementTypeToMover: Map<EnemyMovementType, IEnemyMover> = new Map<EnemyMovementType, IEnemyMover>();

    private spawners: DelayedEnemySpawner[] = [];
    private zoneEnemySpawnDirector: ZoneEnemySpawnDirector<Enemy> | null = null;
    private currentPlayerLevel = 1;

    public init(targetNode: Node, settings: EnemyManagerSettings, currentZoneId = "", playerLevel = 1): void {
        this.currentPlayerLevel = playerLevel;
        this.enemySpawner.init(targetNode, settings.enemies);
        this.enemySpawner.EnemyAddedEvent.on(this.onEnemyAdded, this);
        this.enemySpawner.EnemyRemovedEvent.on(this.onEnemyRemoved, this);

        const useZoneEnemySpawns = 0 < settings.zoneEnemySpawns.length;
        if (useZoneEnemySpawns) {
            this.zoneEnemySpawnDirector = new ZoneEnemySpawnDirector<Enemy>(
                settings.zoneEnemySpawns,
                currentZoneId,
                playerLevel,
                false,
                (spawn) => this.spawnZoneEnemy(spawn),
                settings.spawnPressure
            );
        } else {
            for (const individualSpawnerSettings of settings.individualEnemySpawners) {
                const individualSpawner = new IndividualEnemySpawner(this.enemySpawner, individualSpawnerSettings);
                this.spawners.push(individualSpawner);
            }

            for (const circularSpawnerSettings of settings.circularEnemySpawners) {
                const circularSpawner = new CircularEnemySpawner(this.enemySpawner, circularSpawnerSettings);
                this.spawners.push(circularSpawner);
            }

            for (const waveSpawnerSettings of settings.waveEnemySpawners) {
                const waveSpawner = new WaveEnemySpawner(this.enemySpawner, waveSpawnerSettings);
                this.spawners.push(waveSpawner);
            }
        }

        this.movementTypeToMover.set(EnemyMovementType.Follow, new FollowTargetEnemyMover(targetNode));
        this.movementTypeToMover.set(EnemyMovementType.Launch, new WaveEnemyMover(targetNode));
        this.movementTypeToMover.set(EnemyMovementType.PeriodicFollow, new PeriodicFollowMovers(targetNode, settings.periodicFollowMovers));
    }

    public gameTick(deltaTime: number): void {
        for (const spawner of this.spawners) {
            spawner.gameTick(deltaTime);
        }

        this.zoneEnemySpawnDirector?.gameTick(deltaTime);

        for (const kvp of this.movementTypeToMover) {
            kvp[1].gameTick(deltaTime);
        }
    }

    public get EnemyAddedEvent(): ISignal<Enemy> {
        return this.enemySpawner.EnemyAddedEvent;
    }

    public get EnemyRemovedEvent(): ISignal<Enemy> {
        return this.enemySpawner.EnemyRemovedEvent;
    }

    private onEnemyAdded(enemy: Enemy): void {
        this.getEnemyMover(enemy).addEnemy(enemy);
    }

    private onEnemyRemoved(enemy: Enemy): void {
        this.zoneEnemySpawnDirector?.onEnemyRemoved(enemy);
        this.getEnemyMover(enemy).removeEnemy(enemy);
    }

    private getEnemyMover(enemy: Enemy): IEnemyMover {
        if (this.movementTypeToMover.has(enemy.MovementType)) {
            return this.movementTypeToMover.get(enemy.MovementType);
        }

        throw new Error("Does not have mover of type " + enemy.MovementType);
    }

    private spawnZoneEnemy(
        spawn: { enemyId: string; spawnPattern: "individual" | "circular" | "wave"; groupSize: number; level: number } & {
            spawnRegion?: { x: number; y: number; w: number; h: number };
        }
    ): Enemy[] {
        switch (spawn.spawnPattern) {
            case "circular":
                return this.spawnCircularPattern(spawn, spawn.enemyId, spawn.groupSize, spawn.level);
            case "wave":
                return this.spawnWavePattern(spawn, spawn.enemyId, spawn.groupSize, spawn.level);
            default:
                return [this.spawnAtRandomEdge(spawn, spawn.enemyId, spawn.level)];
        }
    }

    private spawnCircularPattern(
        spawn: { groupSize: number; spawnRegion?: { x: number; y: number; w: number; h: number } },
        enemyId: string,
        groupSize: number,
        level: number
    ): Enemy[] {
        const spawnSettings = new ZoneEnemySpawnSettings();
        spawnSettings.groupSize = groupSize;
        if (spawn.spawnRegion) Object.assign(spawnSettings.spawnRegion, spawn.spawnRegion);

        return ZoneSpawnPositionResolver.resolveCircularSpawns(spawnSettings).map((position) =>
            this.enemySpawner.spawnNewEnemy(position.x, position.y, enemyId, level)
        );
    }

    private spawnWavePattern(
        spawn: { groupSize: number; spawnRegion?: { x: number; y: number; w: number; h: number } },
        enemyId: string,
        groupSize: number,
        level: number
    ): Enemy[] {
        const spawnSettings = new ZoneEnemySpawnSettings();
        spawnSettings.groupSize = groupSize;
        if (spawn.spawnRegion) Object.assign(spawnSettings.spawnRegion, spawn.spawnRegion);

        return ZoneSpawnPositionResolver.resolveWaveSpawns(spawnSettings).map((position) =>
            this.enemySpawner.spawnNewEnemy(position.x, position.y, enemyId, level)
        );
    }

    private spawnAtRandomEdge(spawn: { spawnRegion?: { x: number; y: number; w: number; h: number } }, enemyId: string, level: number): Enemy {
        const spawnSettings = new ZoneEnemySpawnSettings();
        if (spawn.spawnRegion) Object.assign(spawnSettings.spawnRegion, spawn.spawnRegion);

        const position = ZoneSpawnPositionResolver.resolveIndividualSpawn(spawnSettings);
        return this.enemySpawner.spawnNewEnemy(position.x, position.y, enemyId, level);
    }
}
