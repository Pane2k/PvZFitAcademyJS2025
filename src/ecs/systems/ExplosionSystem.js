import eventBus from "../../core/EventBus.js";
import RemovalComponent from "../components/RemovalComponent.js";
import soundManager from "../../core/SoundManager.js";
import vibrationManager from "../../core/VibrationManager.js";
import DamageSystem from "./DamageSystem.js";

export default class ExplosionSystem {
    constructor() {
        this.world = null;
    }

    update() {
        const mines = this.world.getEntitiesWithComponents('ExplodesOnContactComponent', 'PositionComponent', 'HitboxComponent');
        if (mines.length === 0) return;

        // Ищем только "живых" зомби
        const zombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent', 'HitboxComponent')
            .filter(id => !this.world.getComponent(id, 'DyingComponent'));
        if (zombies.length === 0) return;

        for (const mineId of mines) {
            const minePos = this.world.getComponent(mineId, 'PositionComponent');
            const mineBox = this.world.getComponent(mineId, 'HitboxComponent');
            
            const mineRect = {
                x: minePos.x - mineBox.width / 2, y: minePos.y - mineBox.height / 2,
                width: mineBox.width, height: mineBox.height
            };

            for (const zombieId of zombies) {
                if (this._checkCollision(mineRect, zombieId)) {
                    this._triggerExplosion(mineId); 
                    this.world.addComponent(mineId, new RemovalComponent());
                    break;
                }
            }
        }
    }
    
    _triggerExplosion(mineId) {
        const minePos = this.world.getComponent(mineId, 'PositionComponent');
        const explosion = this.world.getComponent(mineId, 'ExplodesOnContactComponent');
        if (!minePos || !explosion) return;

        soundManager.playSoundEffect('explosion');
        vibrationManager.vibrate(200);

        const damageSystem = this.world.systems.find(s => s instanceof DamageSystem);
        if (!damageSystem) return;

        const allZombies = this.world.getEntitiesWithComponents('ZombieComponent', 'PositionComponent');
        for (const zombieId of allZombies) {
            const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');
            const distance = Math.sqrt(Math.pow(minePos.x - zombiePos.x, 2) + Math.pow(minePos.y - zombiePos.y, 2));

            if (distance <= explosion.radius) {
                damageSystem.applyDamage(zombieId, explosion.damage);
            }
        }
    }

    _checkCollision(mineRect, zombieId) {
        const zombiePos = this.world.getComponent(zombieId, 'PositionComponent');
        const zombieBox = this.world.getComponent(zombieId, 'HitboxComponent');
        if (!zombiePos || !zombieBox) return false;

        const zombieRect = {
            x: zombiePos.x - zombieBox.width / 2, y: zombiePos.y - zombieBox.height / 2,
            width: zombieBox.width, height: zombieBox.height
        };
        
        return mineRect.x < zombieRect.x + zombieRect.width &&
               mineRect.x + mineRect.width > zombieRect.x &&
               mineRect.y < zombieRect.y + zombieRect.height &&
               mineRect.y + mineRect.height > zombieRect.y;
    }
}