export default class DebugOverlay {
    constructor() {
        this.isVisible = false; // По умолчанию скрыт
        this.fps = 0;
        this.frameTime = 0;
        this.entityCount = 0; 
        this.zombieCount = 0; // <-- 1. НОВОЕ СВОЙСТВО
    
        // Для расчета FPS
        this.lastTime = performance.now();
        this.frameCount = 0;
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
    }

    update(deltaTime, world) {
        if (!this.isVisible) return;

        this.frameTime = deltaTime * 1000;

        const now = performance.now();
        this.frameCount++;
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }

        if (world) {
            this.entityCount = world.entities.size;
            // --- 2. НАЧАЛО ИЗМЕНЕНИЙ ---
            // Считаем количество сущностей, у которых есть ZombieComponent
            this.zombieCount = world.getEntitiesWithComponents('ZombieComponent').length;
            // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        }
    }

    draw(renderer) {
        if (!this.isVisible) return;

        const ctx = renderer.ctx;
        const canvas = renderer.canvas;
        const physicalX = canvas.width - 10;
        
        ctx.save();
        ctx.font = "16px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        
        ctx.fillText(`FPS: ${this.fps}`, physicalX, 20);
        ctx.fillText(`Frame Time: ${this.frameTime.toFixed(2)} ms`, physicalX, 40);
        ctx.fillText(`Entities: ${this.entityCount}`, physicalX, 60);
        
        // --- 3. НАЧАЛО ИЗМЕНЕНИЙ ---
        // Отрисовываем счетчик зомби на следующей строке
        ctx.fillText(`Zombies: ${this.zombieCount}`, physicalX, 80);
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        
        ctx.restore();
    }
}