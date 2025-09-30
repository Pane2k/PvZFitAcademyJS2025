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
            
            return (posA.y + posA.height) - (posB.y + posB.height);
        });

        for(const entityID of entitiesToRender){
            const isHidden = this.world.getComponent(entityID, 'HiddenComponent');
            if (isHidden) continue;

            const pos = this.world.getComponent(entityID, 'PositionComponent');
            const spriteComp = this.world.getComponent(entityID, 'SpriteComponent');
            const dbComp = this.world.getComponent(entityID, 'DragonBonesComponent');

            if (spriteComp && spriteComp.image) {
                const tint = this.world.getComponent(entityID, 'TintEffectComponent');
                const ghost = this.world.getComponent(entityID, 'GhostPlantComponent');
                const ctx = this.renderer.ctx;

                ctx.save();
                if (ghost) ctx.globalAlpha = ghost.alpha;
                
                if (tint) {
                    const currentColor = tint.getCurrentColor(); 
                    this.drawTintedImage(spriteComp.image, pos.x, pos.y, pos.width, pos.height, currentColor);
                } else {
                    this.renderer.drawImage(spriteComp.image, pos.x, pos.y, pos.width, pos.height);
                }
                ctx.restore();
            } 
            else if (dbComp && dbComp.renderer) {
                const dbRenderer = dbComp.renderer;
                const mainRenderer = this.renderer;
                const hitbox = this.world.getComponent(entityID, 'HitboxComponent');

                let virtualAnchorX, virtualAnchorY;

                if (hitbox) {
                    virtualAnchorX = pos.x + hitbox.offsetX + hitbox.width / 2;
                    // --- VVV КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ VVV ---
                    // Применяем смещение из компонента к опорной точке Y
                    virtualAnchorY = pos.y + hitbox.offsetY + hitbox.height + (dbComp.anchorOffsetY || 0);
                } else {
                    virtualAnchorX = pos.x + pos.width / 2;
                    virtualAnchorY = pos.y + pos.height + (dbComp.anchorOffsetY || 0);
                }

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
                if (Debug.showHitboxes) {
                    this.renderer.drawRect(pos.x + hitbox.offsetX, pos.y + hitbox.offsetY, hitbox.width, hitbox.height, 'rgba(255, 0, 0, 0.5)', 2);
                }
                if (Debug.showInteractables && this.world.getComponent(entityID, 'CollectibleComponent')) {
                    this.renderer.drawRect(pos.x + hitbox.offsetX, pos.y + hitbox.offsetY, hitbox.width, hitbox.height, 'rgba(0, 150, 255, 0.5)', 2);
                }
            }
            
            if (Debug.showHealthBars) { 
                const health = this.world.getComponent(entityID, 'HealthComponent');
                if (health) {
                    const barWidth = pos.width * 0.8;
                    const barHeight = 8;
                    const barX = pos.x + (pos.width - barWidth) / 2;
                    const barY = pos.y - barHeight - 5;
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