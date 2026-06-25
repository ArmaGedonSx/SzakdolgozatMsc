import { DefaultEnemyProgression } from "../../../assets/Scripts/Game/Data/DefaultEnemyProgression";
import { EnemySettings } from "../../../assets/Scripts/Game/Data/GameSettings";

function createEnemy(enemyId: string, goldReward: number, xpReward: number, health: number, damage: number, speed: number): EnemySettings {
    const enemy = new EnemySettings();
    enemy.id = enemyId;
    enemy.goldReward = goldReward;
    enemy.xpReward = xpReward;
    enemy.health = health;
    enemy.damage = damage;
    enemy.speed = speed;
    return enemy;
}

test("DefaultEnemyProgression categorizes enemies into progression tiers", () => {
    expect(DefaultEnemyProgression.resolveTier("BasicEnemy")).toBe("early");
    expect(DefaultEnemyProgression.resolveTier("StandardEnemy")).toBe("mid");
    expect(DefaultEnemyProgression.resolveTier("HardEnemy")).toBe("late");
    expect(DefaultEnemyProgression.resolveTier("FinalBoss")).toBe("endgame");
});

test("DefaultEnemyProgression scales weaker enemies up into later tiers", () => {
    const enemies = [
        createEnemy("BasicEnemy", 0.1, 1, 2, 1, 60),
        createEnemy("StandardEnemy", 0.1, 1, 4, 2, 65),
        createEnemy("HardEnemy", 0.1, 1, 10, 2, 75),
        createEnemy("FinalBoss", 1, 4, 40, 4, 120)
    ];

    const normalized = DefaultEnemyProgression.normalize(enemies);

    expect(normalized.find((enemy) => enemy.id === "BasicEnemy")).toEqual(
        expect.objectContaining({ goldReward: 0.1, xpReward: 1, health: 2, damage: 1 })
    );
    expect(normalized.find((enemy) => enemy.id === "StandardEnemy")).toEqual(
        expect.objectContaining({ goldReward: 0.15, xpReward: 1.5, health: 6, damage: 2.5 })
    );
    expect(normalized.find((enemy) => enemy.id === "HardEnemy")).toEqual(
        expect.objectContaining({ goldReward: 0.25, xpReward: 2.5, health: 18, damage: 3, speed: 80 })
    );
    expect(normalized.find((enemy) => enemy.id === "FinalBoss")).toEqual(
        expect.objectContaining({ goldReward: 1.5, xpReward: 8, health: 65, damage: 6, speed: 140 })
    );
});
