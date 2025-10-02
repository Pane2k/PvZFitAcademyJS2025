import Debug from "../../core/Debug.js";
import HiddenComponent from "../components/HiddenComponent.js";

export default class RenderSystem {
    constructor(renderer, assetLoader) {
        this.renderer = renderer;
        this.assetLoader = assetLoader;
        this.world = null;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    update(minLayer = -Infinity, maxLayer = Infinity) {
        let entitiesToRender = this.world.getEntitiesWithComponents('PositionComponent', 'RenderableComponent');
        entitiesToRender = entitiesToRender.filter(entityID => {
            const renderable = this.world.getComponent(entityID, 'RenderableComponent');
            const hasVisuals = this.world.getComponent(entityID, 'SpriteComponent') || this.world.getComponent(entityID, 'DragonBonesComponent');
            return hasVisuals && renderable.layer >= minLayer && renderable.layer <= maxLayer;
        });

        entitiesToRender.sort((a, b) => {
            const renderA = this.world.getComponent(a, 'RenderableComponent');
            const posA = this.world.getComponent(a, 'PositionComponent');
            const renderB = this.world.getComponent(b, 'RenderableComponent');
            const posB = this.world.getComponent(b, 'PositionComponent');
            if (renderA.layer !== renderB.layer) return renderA.layer - renderB.layer;
            return (posA.y + posA.height / 2) - (posB.y + posB.height / 2);
        });

        for (const entityID of entitiesToRender) {
            if (this.world.getComponent(entityID, 'HiddenComponent')) continue;
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            const spriteComp = this.world.getComponent(entityID, 'SpriteComponent');
            const dbComp = this.world.getComponent(entityID, 'DragonBonesComponent');
            const drawX = pos.x - pos.width / 2;
            const drawY = pos.y - pos.height / 2;

            if (spriteComp && spriteComp.image) {
                this.renderSprite(entityID, spriteComp, pos, drawX, drawY);
            } else if (dbComp && dbComp.armature) {
                this.renderDragonBones(dbComp, pos);
            }

            if (Debug.showHitboxes) this.drawDebugHitbox(entityID, pos);
            if (Debug.showHealthBars) this.drawDebugHealthBar(entityID, pos, drawX, drawY);
        }
    }

    renderSprite(entityID, spriteComp, pos, drawX, drawY) {
        const tint = this.world.getComponent(entityID, 'TintEffectComponent');
        const ghost = this.world.getComponent(entityID, 'GhostPlantComponent');
        const ctx = this.renderer.ctx;
        ctx.save();
        if (ghost) ctx.globalAlpha = ghost.alpha;
        if (tint) {
            this.drawTintedImage(spriteComp.image, drawX, drawY, pos.width, pos.height, tint.getCurrentColor());
        } else if (spriteComp.region) {
            this.renderer.drawPartialImage(spriteComp.image, spriteComp.region.x, spriteComp.region.y, spriteComp.region.width, spriteComp.region.height, drawX, drawY, pos.width, pos.height);
        } else {
            this.renderer.drawImage(spriteComp.image, drawX, drawY, pos.width, pos.height);
        }
        ctx.restore();
    }

    renderDragonBones(dbComp, pos) {
        const armature = dbComp.armature;
        const textureImage = this.assetLoader.getImage(dbComp.textureName.replace('_ske', '_img'));
        if (!textureImage) return;

        const ctx = this.renderer.ctx;
        ctx.save();
        
        const physicalX = pos.x * this.renderer.scale + this.renderer.offsetX;
        const physicalY = (pos.y + dbComp.anchorOffsetY) * this.renderer.scale + this.renderer.offsetY;
        const finalScale = dbComp.scale * this.renderer.scale;

        ctx.translate(physicalX, physicalY);
        ctx.scale(finalScale, finalScale);
        
        armature.drawOrder.forEach(slot => {
            if (slot.displayData && slot.textureData && slot.parentBone) {
                const boneWt = slot.parentBone.worldTransform;
                const displayT = slot.displayData.transform;
                ctx.save();
                ctx.translate(boneWt.x, boneWt.y);
                ctx.rotate(boneWt.skX);
                ctx.scale(boneWt.scX, boneWt.scY);
                ctx.translate(displayT.x, displayT.y);
                ctx.rotate(displayT.skX);
                ctx.scale(displayT.scX, displayT.scY);
                const tex = slot.textureData;
                ctx.drawImage(textureImage, tex.x, tex.y, tex.width, tex.height, -tex.width / 2, -tex.height / 2, tex.width, tex.height);
                ctx.restore();
            }
        });

        if (Debug.showSkeletons) this.drawDebugBones(armature);
        ctx.restore();
    }
    
    drawDebugBones(armature) {
        const ctx = this.renderer.ctx;
        ctx.save();
        ctx.strokeStyle = "rgba(255,0,255,0.7)";
        ctx.lineWidth = 1; 
        armature.bones.forEach(bone => {
            const wt = bone.worldTransform;
            ctx.save();
            ctx.translate(wt.x, wt.y);
            ctx.rotate(wt.skX);
            ctx.scale(wt.scX, wt.scY);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(bone.length || 5, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,255,0,0.7)";
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();
    }

    drawDebugHitbox(entityID, pos) {
        const hitbox = this.world.getComponent(entityID, 'HitboxComponent');
        if (hitbox) {
            const hitboxCenterX = pos.x + hitbox.offsetX;
            const hitboxCenterY = pos.y + hitbox.offsetY;
            const hitboxDrawX = hitboxCenterX - hitbox.width / 2;
            const hitboxDrawY = hitboxCenterY - hitbox.height / 2;
            this.renderer.drawRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height, 'rgba(255, 0, 0, 0.5)', 2);
        }
    }

    drawDebugHealthBar(entityID, pos, drawX, drawY) {
        const health = this.world.getComponent(entityID, 'HealthComponent');
        if (health && health.maxHealth > 0) {
            const barWidth = pos.width > 0 ? pos.width * 0.8 : 50;
            const barHeight = 8;
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