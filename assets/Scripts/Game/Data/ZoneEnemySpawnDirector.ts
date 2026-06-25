import { SpawnPressureSettings, ZoneEnemySpawnSettings } from "./GameSettings";

interface SpawnRuntimeState {
    settings: ZoneEnemySpawnSettings;
    cooldownLeft: number;
    aliveCount: number;
    milestoneTriggered: boolean;
}

export class ZoneEnemySpawnDirector<TEnemy extends object> {
    private readonly spawnStates: SpawnRuntimeState[];
    private readonly enemyToSpawnId = new Map<TEnemy, string>();
    private elapsedRunTime = 0;

    public constructor(
        spawns: ZoneEnemySpawnSettings[],
        zoneId: string,
        playerLevel: number,
        isIdleMode: boolean,
        private readonly spawnEnemy: (spawn: ZoneEnemySpawnSettings & { level: number }) => TEnemy[],
        private readonly spawnPressure: SpawnPressureSettings = new SpawnPressureSettings()
    ) {
        this.spawnStates = spawns
            .filter((spawn) => this.isEligible(spawn, zoneId, playerLevel, isIdleMode))
            .map((spawn) => ({
                settings: spawn,
                cooldownLeft: spawn.spawnInterval / 1000,
                aliveCount: 0,
                milestoneTriggered: false
            }));
    }

    public gameTick(deltaTime: number): void {
        this.elapsedRunTime += deltaTime;
        this.tryTriggerMilestones();

        for (const state of this.spawnStates) {
            state.cooldownLeft = Math.max(0, state.cooldownLeft - deltaTime);
        }

        const readySpawns = this.spawnStates.filter(
            (state) => state.cooldownLeft <= 0 && state.aliveCount < state.settings.maxAlive && 0 < state.settings.weight
        );
        if (readySpawns.length === 0) return;

        const selectedState = this.selectWeightedSpawn(readySpawns);
        const spawnedEnemies = this.spawnEnemy({
            ...selectedState.settings,
            level: this.resolveEnemyLevel(selectedState.settings)
        });
        for (const enemy of spawnedEnemies) {
            this.enemyToSpawnId.set(enemy, selectedState.settings.spawnId);
        }
        selectedState.aliveCount += spawnedEnemies.length;
        selectedState.cooldownLeft = this.resolveSpawnCooldown(selectedState.settings);
    }

    public onEnemyRemoved(enemy: TEnemy): void {
        const spawnId = this.enemyToSpawnId.get(enemy);
        if (!spawnId) return;

        this.enemyToSpawnId.delete(enemy);
        const spawnState = this.spawnStates.find((state) => state.settings.spawnId === spawnId);
        if (!spawnState) return;

        spawnState.aliveCount = Math.max(0, spawnState.aliveCount - 1);
    }

    private isEligible(spawn: ZoneEnemySpawnSettings, zoneId: string, playerLevel: number, isIdleMode: boolean): boolean {
        return spawn.zoneId === zoneId && spawn.minLevel <= playerLevel && playerLevel <= spawn.maxLevel && spawn.idleOnly === isIdleMode;
    }

    private selectWeightedSpawn(spawns: SpawnRuntimeState[]): SpawnRuntimeState {
        const totalWeight = spawns.reduce((sum, state) => sum + state.settings.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const spawn of spawns) {
            roll -= spawn.settings.weight;
            if (roll <= 0) {
                return spawn;
            }
        }

        return spawns[spawns.length - 1];
    }

    private tryTriggerMilestones(): void {
        const milestoneStates = this.spawnStates.filter((state) => this.isReadyMilestone(state));
        for (const state of milestoneStates) {
            const spawnedEnemies = this.spawnEnemy({
                ...state.settings,
                level: this.resolveEnemyLevel(state.settings)
            });
            for (const enemy of spawnedEnemies) {
                this.enemyToSpawnId.set(enemy, state.settings.spawnId);
            }
            state.aliveCount += spawnedEnemies.length;
            state.milestoneTriggered = true;
            state.cooldownLeft = this.resolveSpawnCooldown(state.settings);
        }
    }

    private isReadyMilestone(state: SpawnRuntimeState): boolean {
        return (
            0 < state.settings.milestoneTimeSeconds &&
            !state.milestoneTriggered &&
            state.settings.milestoneTimeSeconds <= this.elapsedRunTime &&
            state.aliveCount < state.settings.maxAlive
        );
    }

    private resolveEnemyLevel(spawn: ZoneEnemySpawnSettings): number {
        const minLevel = Math.max(1, Math.floor(spawn.minLevel || 1));
        const maxLevel = Math.max(minLevel, Math.floor(spawn.maxLevel || minLevel));
        if (minLevel === maxLevel) return minLevel;

        const rolledLevel = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
        return Math.min(maxLevel, rolledLevel + this.getPressureStep() * Math.max(0, this.spawnPressure.levelBonusPerStep));
    }

    private resolveSpawnCooldown(spawn: ZoneEnemySpawnSettings): number {
        const baseCooldown = spawn.spawnInterval / 1000;
        const cooldownMultiplier = Math.max(0.1, 1 - this.getPressureStep() * Math.max(0, this.spawnPressure.cooldownReductionPerStep));
        return baseCooldown * cooldownMultiplier;
    }

    private getPressureStep(): number {
        if (!this.spawnPressure.enabled) return 0;

        const rampStart = Math.max(0, this.spawnPressure.rampStartSeconds);
        const secondsPerStep = Math.max(1, this.spawnPressure.secondsPerStep);
        if (this.elapsedRunTime < rampStart) return 0;

        const uncappedStep = Math.floor((this.elapsedRunTime - rampStart) / secondsPerStep) + 1;
        return Math.min(Math.max(0, this.spawnPressure.maxSteps), uncappedStep);
    }
}
