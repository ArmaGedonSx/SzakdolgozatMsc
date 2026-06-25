import { EnemyRuntimeStats } from "../../../assets/Scripts/Game/Data/EnemyRuntimeStats";
import { EnemySettings } from "../../../assets/Scripts/Game/Data/GameSettings";

function createEnemy(): EnemySettings {
    const enemy = new EnemySettings();
    enemy.id = "slime";
    enemy.name = "Slime";
    enemy.baseHp = 30;
    enemy.baseAtk = 8;
    enemy.baseSpeed = 0.6;
    enemy.hpScaling = 1.12;
    enemy.atkScaling = 1.08;
    enemy.rewardScaling = 1.1;
    enemy.aggroRange = 80;
    enemy.attackRange = 18;
    enemy.attackCooldown = 1.1;
    enemy.goldReward = 5;
    enemy.xpReward = 10;
    enemy.spriteAsset = "enemy_slime";
    return enemy;
}

test("EnemyRuntimeStats resolves level-scaled combat and reward values", () => {
    const enemy = createEnemy();

    const stats = EnemyRuntimeStats.resolve(enemy, 3);

    expect(stats.health).toBe(38);
    expect(stats.damage).toBe(9.33);
    expect(stats.speed).toBe(0.6);
    expect(stats.goldReward).toBe(6.05);
    expect(stats.xpReward).toBe(12.1);
    expect(stats.aggroRange).toBe(80);
    expect(stats.attackRange).toBe(18);
    expect(stats.attackCooldown).toBe(1.1);
    expect(stats.graphicsType).toBe("enemy_slime");
});

test("EnemyRuntimeStats falls back to legacy flat values when base fields are absent", () => {
    const enemy = new EnemySettings();
    enemy.id = "legacy";
    enemy.graphicsType = "BasicEnemy";
    enemy.health = 15;
    enemy.damage = 2;
    enemy.speed = 70;
    enemy.aggroRange = 120;
    enemy.attackRange = 24;
    enemy.attackCooldown = 0.75;
    enemy.goldReward = 3;
    enemy.xpReward = 4;

    const stats = EnemyRuntimeStats.resolve(enemy, 5);

    expect(stats.health).toBe(15);
    expect(stats.damage).toBe(2);
    expect(stats.speed).toBe(70);
    expect(stats.goldReward).toBe(3);
    expect(stats.xpReward).toBe(4);
    expect(stats.aggroRange).toBe(120);
    expect(stats.attackRange).toBe(24);
    expect(stats.attackCooldown).toBe(0.75);
    expect(stats.graphicsType).toBe("BasicEnemy");
});
