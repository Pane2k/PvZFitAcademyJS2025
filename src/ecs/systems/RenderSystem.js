import Debug from "../../core/Debug.js";
import HiddenComponent from "../components/HiddenComponent.js";
import FillColorComponent from "../components/FillColorComponent.js"

export default class RenderSystem {
    constructor(renderer, assetLoader) {
        this.renderer = renderer;
        this.assetLoader = assetLoader;
        this.world = null;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    update(cameraOffsetX = 0) {
        // --- ИЗМЕНЕНИЕ: Удаляем разделение на слои, теперь это единый вызов ---
        let entitiesToRender = this.world.getEntitiesWithComponents('PositionComponent', 'RenderableComponent');
        
        entitiesToRender = entitiesToRender.filter(entityID => {
            const hasVisuals = this.world.getComponent(entityID, 'SpriteComponent') || 
                               this.world.getComponent(entityID, 'DragonBonesComponent') ||
                               this.world.getComponent(entityID, 'TextComponent');
            return hasVisuals && !this.world.getComponent(entityID, 'HiddenComponent');
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
            const pos = this.world.getComponent(entityID, 'PositionComponent');
            const spriteComp = this.world.getComponent(entityID, 'SpriteComponent');
            const dbComp = this.world.getComponent(entityID, 'DragonBonesComponent');
            const textComp = this.world.getComponent(entityID, 'TextComponent');
            const fadeComp = this.world.getComponent(entityID, 'FadeEffectComponent');
            const fillComp = this.world.getComponent(entityID, 'FillColorComponent');

            // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Определяем, нужно ли смещать объект ---
            // UI-элементы и эффекты на весь экран (слой >= 100) не смещаются
            const isStatic = this.world.getComponent(entityID, 'RenderableComponent').layer >= 90;

            const finalOffsetX = isStatic ? 0 : cameraOffsetX;
            
            // (расчет finalWidth, finalHeight, drawX, drawY остается без изменений)
            const finalWidth = pos.width * pos.scale;
            const finalHeight = pos.height * pos.scale;
            const drawX = (pos.x - finalWidth / 2) + finalOffsetX;
            const drawY = (pos.y - finalHeight / 2);

             const ctx = this.renderer.ctx;
            ctx.save();
            if (fadeComp) {
                ctx.globalAlpha = fadeComp.currentAlpha;
            }

            // --- НОВЫЙ БЛОК ДЛЯ ОТРИСОВКИ ПРЯМОУГОЛЬНИКА ---
            if (fillComp) {
                ctx.fillStyle = fillComp.color;
                const pX = drawX * this.renderer.scale + this.renderer.offsetX;
                const pY = drawY * this.renderer.scale + this.renderer.offsetY;
                const pW = finalWidth * this.renderer.scale;
                const pH = finalHeight * this.renderer.scale;
                ctx.fillRect(pX, pY, pW, pH);
            }
            // --- КОНЕЦ НОВОГО БЛОКА ---
            else if (spriteComp && spriteComp.image) {
                this.renderSprite(entityID, spriteComp, pos, drawX, drawY, finalWidth, finalHeight);
            } else if (dbComp && dbComp.armature) {
                this.renderDragonBones(dbComp, pos, finalOffsetX);
            } else if (textComp) {
                const physicalX = (pos.x + finalOffsetX) * this.renderer.scale + this.renderer.offsetX;
                const physicalY = pos.y * this.renderer.scale + this.renderer.offsetY;
                
                ctx.save();
                // Применяем трансформации относительно центра текста
                ctx.translate(physicalX, physicalY);
                ctx.scale(pos.scale, pos.scale);
                
                // Рисуем сам текст (Renderer.drawText больше не используется здесь)
                const parts = textComp.font.split(' ');
                const virtualSize = parseFloat(parts[0]);
                const physicalSize = virtualSize * this.renderer.scale;
                ctx.font = `${physicalSize}px ${parts.slice(1).join(' ')}`;
                ctx.fillStyle = textComp.color;
                ctx.textAlign = textComp.textAlign;
                ctx.textBaseline = textComp.textBaseline;
                ctx.fillText(textComp.text, 0, 0); // Рисуем в точке (0,0) нового отмасштабированного контекста
                ctx.restore();
            }
            
            ctx.restore();

            if (Debug.showHitboxes) this.drawDebugHitbox(entityID, pos, finalOffsetX);
            // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: передаем правильную ширину в health bar ---
            if (Debug.showHealthBars) this.drawDebugHealthBar(entityID, pos, drawX, drawY, finalWidth);
        }
    }

    renderSprite(entityID, spriteComp, pos, drawX, drawY, drawWidth, drawHeight) {
        const tint = this.world.getComponent(entityID, 'TintEffectComponent');
        const ghost = this.world.getComponent(entityID, 'GhostPlantComponent');
        const ctx = this.renderer.ctx;
        
        ctx.save();
        if (ghost) ctx.globalAlpha = ghost.alpha;
        
        if (tint) {
            this.drawTintedImage(spriteComp.image, drawX, drawY, drawWidth, drawHeight, tint.getCurrentColor());
        } else if (spriteComp.region) {
            this.renderer.drawPartialImage(spriteComp.image, spriteComp.region.x, spriteComp.region.y, spriteComp.region.width, spriteComp.region.height, drawX, drawY, drawWidth, drawHeight);
        } else {
            this.renderer.drawImage(spriteComp.image, drawX, drawY, drawWidth, drawHeight);
        }
        
        ctx.restore();
    }

    renderDragonBones(dbComp, pos, cameraOffsetX = 0) {
        const armature = dbComp.armature;
        const textureImage = this.assetLoader.getImage(dbComp.textureName.replace('_ske', '_img'));
        if (!textureImage) return;

        const ctx = this.renderer.ctx;
        ctx.save();
        
        const physicalX = (pos.x + cameraOffsetX) * this.renderer.scale + this.renderer.offsetX;
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

    drawDebugHitbox(entityID, pos, cameraOffsetX = 0) {
        const hitbox = this.world.getComponent(entityID, 'HitboxComponent');
        if (hitbox) {
            const hitboxCenterX = pos.x + hitbox.offsetX + cameraOffsetX;
            const hitboxCenterY = pos.y + hitbox.offsetY;
            const hitboxDrawX = hitboxCenterX - hitbox.width / 2;
            const hitboxDrawY = hitboxCenterY - hitbox.height / 2;
            this.renderer.drawRect(hitboxDrawX, hitboxDrawY, hitbox.width, hitbox.height, 'rgba(255, 0, 0, 0.5)', 2);
        }
    }

     drawDebugHealthBar(entityID, pos, drawX, drawY, finalWidth) {
        const health = this.world.getComponent(entityID, 'HealthComponent');
        if (health && health.maxHealth > 0) {
            // Используем finalWidth вместо pos.width
            const barWidth = finalWidth > 0 ? finalWidth * 0.8 : 50;
            const barHeight = 8;
            const barX = drawX + (finalWidth - barWidth) / 2;
            const barY = drawY - barHeight - 5;
            
            // ... (остальной код отрисовки health bar без изменений)
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