import Debug from "../../core/Debug.js"
export default class RenderSystem{
    constructor(renderer){
        this.renderer = renderer
        this.world = null

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }
    update(){
        const entitiesToRender = this.world.getEntitiesWithComponents('PositionComponent', 'SpriteComponent', 'RenderableComponent')
        entitiesToRender.sort((a, b) => {
            const layerA = this.world.getComponent(a, 'RenderableComponent').layer;
            const layerB = this.world.getComponent(b, 'RenderableComponent').layer;
            return layerA - layerB;
        });
        for(const entityID of entitiesToRender){
            const pos = this.world.getComponent(entityID, 'PositionComponent')
            const sprite = this.world.getComponent(entityID, 'SpriteComponent')
            const tint = this.world.getComponent(entityID, 'TintEffectComponent')
            const ghost = this.world.getComponent(entityID, 'GhostPlantComponent')

            if (sprite && sprite.image) {
                const ctx = this.renderer.ctx;
                ctx.save();
                if (ghost) {
                    ctx.globalAlpha = 0.6;
                }

                if (tint) {
                    const currentColor = tint.getCurrentColor(); 
                    this.drawTintedImage(sprite.image, pos.x, pos.y, pos.width, pos.height, currentColor);
                } else {
                    this.renderer.drawImage(sprite.image, pos.x, pos.y, pos.width, pos.height);
                }
                ctx.restore();
            }

            
            if (Debug.showHitboxes) {
                const hitbox = this.world.getComponent(entityID, 'HitboxComponent');
                if (hitbox) {
                    this.renderer.drawRect(
                        pos.x + hitbox.offsetX,
                        pos.y + hitbox.offsetY,
                        hitbox.width,
                        hitbox.height,
                        'rgba(255, 0, 0, 0.5)', // Красный для хитбоксов
                        2
                    );
                }
            }
            if (Debug.showInteractables) {
                const isCollectible = this.world.getComponent(entityID, 'CollectibleComponent');
                if (isCollectible) {
                    this.renderer.drawRect(
                        pos.x,
                        pos.y,
                        pos.width,
                        pos.height,
                        'rgba(0, 150, 255, 0.5)', // Синий для интерактивных
                        2
                    );
                }
            }
            if (Debug.showHealthBars) { 
                const health = this.world.getComponent(entityID, 'HealthComponent');
                if (health) { // Рисуем, если компонент здоровья в принципе есть
                    const barWidth = pos.width * 0.8;
                    const barHeight = 8;
                    const barX = pos.x + (pos.width - barWidth) / 2;
                    const barY = pos.y - barHeight - 5;

                    // Используем физические координаты для отрисовки
                    const pBarX = barX * this.renderer.scale + this.renderer.offsetX;
                    const pBarY = barY * this.renderer.scale + this.renderer.offsetY;
                    const pBarWidth = barWidth * this.renderer.scale;
                    const pBarHeight = barHeight * this.renderer.scale;
                    
                    // Фон полоски (рисуем всегда)
                    this.renderer.ctx.fillStyle = '#555'; // Темный фон
                    this.renderer.ctx.fillRect(pBarX, pBarY, pBarWidth, pBarHeight);

                    // Сама полоска здоровья
                    const healthPercentage = Math.max(0, health.currentHealth / health.maxHealth); // Убедимся, что не уходит в минус
                    this.renderer.ctx.fillStyle = healthPercentage > 0.5 ? '#2ecc71' : (healthPercentage > 0.2 ? '#f1c40f' : '#e74c3c'); // Зеленый -> Желтый -> Красный
                    this.renderer.ctx.fillRect(pBarX, pBarY, pBarWidth * healthPercentage, pBarHeight);

                    // Обводка для четкости
                    this.renderer.ctx.strokeStyle = '#000';
                    this.renderer.ctx.lineWidth = 1;
                    this.renderer.ctx.strokeRect(pBarX, pBarY, pBarWidth, pBarHeight);
                }
            }
        
        }
    }
    drawTintedImage(image, x, y, width, height, color) {
        // Устанавливаем размер временного холста под размер изображения
        this.offscreenCanvas.width = image.width;
        this.offscreenCanvas.height = image.height;

        // 1. Рисуем оригинальное изображение на временный холст
        this.offscreenCtx.drawImage(image, 0, 0);

        // 2. Накладываем цвет только на непрозрачные пиксели
        this.offscreenCtx.globalCompositeOperation = 'source-atop';
        this.offscreenCtx.fillStyle = color;
        this.offscreenCtx.fillRect(0, 0, image.width, image.height);

        // Сбрасываем операцию композиции для будущих вызовов
        this.offscreenCtx.globalCompositeOperation = 'source-over';

        // 3. Рисуем результат с временного холста на основной
        this.renderer.drawImage(this.offscreenCanvas, x, y, width, height);
    }
}