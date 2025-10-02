// src/ecs/systems/RenderSystem.js

import Debug from "../../core/Debug.js"
import HiddenComponent from "../components/HiddenComponent.js"

export default class RenderSystem{
    constructor(renderer){
        this.renderer = renderer
        this.world = null

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    update(minLayer = -Infinity, maxLayer = Infinity){
        let entitiesToRender = this.world.getEntitiesWithComponents('PositionComponent', 'RenderableComponent');

        entitiesToRender = entitiesToRender.filter(entityID => {
            const renderable = this.world.getComponent(entityID, 'RenderableComponent');
            const hasVisuals = this.world.getComponent(entityID, 'SpriteComponent') || this.world.getComponent(entityID, 'DragonBonesComponent');
            const layer = renderable ? renderable.layer : 0;
            return hasVisuals && layer >= minLayer && layer <= maxLayer;
        });

        entitiesToRender.sort((a, b) => {
            const renderA = this.world.getComponent(a, 'RenderableComponent');
            const renderB = this.world.getComponent(b, 'RenderableComponent');
            const posA = this.world.getComponent(a, 'PositionComponent');
            const posB = this.world.getComponent(b, 'PositionComponent');
            
            const layerA = renderA ? renderA.layer : 0;
            const layerB = renderB ? renderB.layer : 0;
            
            if (layerA !== layerB) {
                return layerA - layerB;
            }
            
            // NOTE: Сортировка по Y-координате центра + половина высоты для корректного Z-индекса
            return (posA.y + posA.height / 2) - (posB.y + posB.height / 2);
        });

        for(const entityID of entitiesToRender){
            const isHidden = this.world.getComponent(entityID, 'HiddenComponent');
            if (isHidden) continue;

            const pos = this.world.getComponent(entityID, 'PositionComponent');
            const spriteComp = this.world.getComponent(entityID, 'SpriteComponent');
            const dbComp = this.world.getComponent(entityID, 'DragonBonesComponent');

            // NOTE: Теперь (x, y) это центр. Вычисляем top-left для отрисовки.
            const drawX = pos.x - pos.width / 2;
            const drawY = pos.y - pos.height / 2;

            if (spriteComp && spriteComp.image) {
                const tint = this.world.getComponent(entityID, 'TintEffectComponent');
                const ghost = this.world.getComponent(entityID, 'GhostPlantComponent');
                const ctx = this.renderer.ctx;

                ctx.save();
                if (ghost) ctx.globalAlpha = ghost.alpha;
                
                if (tint) {
                    const currentColor = tint.getCurrentColor(); 
                    this.drawTintedImage(spriteComp.image, drawX, drawY, pos.width, pos.height, currentColor);
                } else {
                    this.renderer.drawImage(spriteComp.image, drawX, drawY, pos.width, pos.height);
                }
                ctx.restore();
            } 
            else if (dbComp && dbComp.renderer) {
                const dbRenderer = dbComp.renderer;
                const mainRenderer = this.renderer;
                dbRenderer.debugDraw = Debug.showSkeletons;
                // NOTE: Опорная точка анимации теперь рассчитывается от центра (pos.y)
                const virtualAnchorX = pos.x;
                const virtualAnchorY = pos.y + (dbComp.anchorOffsetY || 0);

                const physicalX = virtualAnchorX * mainRenderer.scale + mainRenderer.offsetX;
                const physicalY = virtualAnchorY * mainRenderer.scale + mainRenderer.offsetY;
                const finalScale = dbComp.scale * mainRenderer.scale;
                
                dbRenderer.globalTransform.x = physicalX;
                dbRenderer.globalTransform.y = physicalY;
                dbRenderer.globalTransform.scaleX = finalScale;
                dbRenderer.globalTransform.scaleY = finalScale;
                
                dbRenderer.render();
            }

            const hitbox = this.world.getComponent(entityID, 'HitboxComponent');
            if (hitbox) {
                // NOTE: Отрисовка хитбокса от его центра
                const hitboxCenterX = pos.x + hitbox.offsetX;
                const hitboxCenterY = pos.y + hitbox.offsetY;
                const hitboxDrawX = hitboxCenterX - hitbox.width / 2;
                const hitboxDrawY = hitboxCenterY - hitbox.height / 2;
                
                if (Debug.showHitboxes) {
                    this.renderer.drawRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height, 'rgba(255, 0, 0, 0.5)', 2);
                }
                if (Debug.showInteractables && this.world.getComponent(entityID, 'CollectibleComponent')) {
                    this.renderer.drawRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height, 'rgba(0, 150, 255, 0.5)', 2);
                }
            }
            
            if (Debug.showHealthBars) { 
                const health = this.world.getComponent(entityID, 'HealthComponent');
                if (health) {
                    const barWidth = pos.width * 0.8;
                    const barHeight = 8;
                    // NOTE: Позиция хелсбара относительно top-left
                    const barX = drawX + (pos.width - barWidth) / 2;
                    const barY = drawY - barHeight - 5;

                    const pBarX = barX * this.renderer.scale + this.renderer.offsetX;
                    const pBarY = barY * this.renderer.scale + this.renderer.offsetY;
                    const pBarWidth = barWidth * this.renderer.scale;
                    const pBarHeight = barHeight * this.renderer.scale;
                    this.renderer.ctx.fillStyle = '#555';
                    this.renderer.ctx.fillRect(pBarX, pBarY, pBarWidth, pBarHeight);
                    const healthPercentage = Math.max(0, health.currentHealth / health.maxHealth);
                    this.renderer.ctx.fillStyle = healthPercentage > 0.5 ? '#2ecc71' : (healthPercentage > 0.2 ? '#f1c40f' : '#e74c3c');
                    this.renderer.ctx.fillRect(pBarX, pBarY, pBarWidth * healthPercentage, pBarHeight);
                    this.renderer.ctx.strokeStyle = '#000';
                    this.renderer.ctx.lineWidth = 1;
                    this.renderer.ctx.strokeRect(pBarX, pBarY, pBarWidth, pBarHeight);
                }
            }
        }
    }

    drawTintedImage(image, x, y, width, height, color) {
        // NOTE: x,y здесь уже top-left
        this.offscreenCanvas.width = image.width;
        this.offscreenCanvas.height = image.height;
        this.offscreenCtx.drawImage(image, 0, 0);
        this.offscreenCtx.globalCompositeOperation = 'source-atop';
        this.offscreenCtx.fillStyle = color;
        this.offscreenCtx.fillRect(0, 0, image.width, image.height);
        this.offscreenCtx.globalCompositeOperation = 'source-over';
        this.renderer.drawImage(this.offscreenCanvas, x, y, width, height);
    }
}