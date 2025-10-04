/**
 * @class DragonBonesRenderer
 * @version 2.0.2
 * Универсальный рендерер для анимаций DragonBones JSON на чистом HTML Canvas.
 * Поддерживает стандартные спрайты и меши. Устойчив к разным структурам JSON.
 * Не имеет внешних зависимостей.
 */
class DragonBonesRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.skeletonData = null;
        this.textureData = null;
        this.textureImage = null;
        this.armature = null;
        this.animations = {};
        this.bones = [];
        this.slots = [];
        this.drawOrder = [];
        this.textures = {};
        this.activeAnimation = null;
        this.animationTime = 0;
        this.isPlaying = false;
        this.loop = true;
        this.frameRate = 24;
        this.lastTimestamp = 0;
        this.requestId = null;
        this.globalTransform = { x: canvas.width / 2, y: canvas.height / 1.5, scaleX: 1.0, scaleY: 1.0 };
    }

    async load(skePath, texPath) {
        const [skeResponse, texResponse] = await Promise.all([fetch(skePath), fetch(texPath)]);
        this.skeletonData = await skeResponse.json();
        this.textureData = await texResponse.json();
        const imgPath = texPath.substring(0, texPath.lastIndexOf('/') + 1) + this.textureData.imagePath;
        this.textureImage = new Image();
        const imagePromise = new Promise((resolve, reject) => {
            this.textureImage.onload = resolve;
            this.textureImage.onerror = reject;
            this.textureImage.src = imgPath;
        });
        await imagePromise;
        this._parse();
        console.log(`DragonBones data for "${this.armature.name}" loaded and parsed successfully.`);
    }

    _parse() {
        this.frameRate = this.skeletonData.frameRate || 24;
        this.armature = this.skeletonData.armature[0];
        const boneMap = new Map();

        (this.armature.bone || []).forEach(boneData => {
            const transform = boneData.transform || {};
            const bone = {
                name: boneData.name,
                parent: boneData.parent || null,
                transform: {
                    x: transform.x || 0,
                    y: transform.y || 0,
                    skX: (transform.skX || 0) * (Math.PI / 180),
                    skY: (transform.skY || 0) * (Math.PI / 180),
                    scX: transform.scX || 1,
                    scY: transform.scY || 1,
                },
                worldTransform: { x: 0, y: 0, skX: 0, skY: 0, scX: 1, scY: 1 },
                animTransform: {}
            };
            this.bones.push(bone);
            boneMap.set(bone.name, bone);
        });

        this.bones.forEach(bone => { if (bone.parent) bone.parent = boneMap.get(bone.parent); });

        (this.armature.slot || []).forEach(slotData => {
            const slot = { name: slotData.name, parent: boneMap.get(slotData.parent), attachment: null };
            this.slots.push(slot);
        });
        this.drawOrder = [...this.slots];

        const skin = this.armature.skin[0];
        (skin.slot || []).forEach(skinSlotData => {
            const slot = this.slots.find(s => s.name === skinSlotData.name);
            if (!slot || !skinSlotData.display) return;
            const display = skinSlotData.display[0];
            const attachmentTransform = display.transform || {};
            slot.attachment = {
                type: 'image',
                name: display.name,
                transform: {
                    x: attachmentTransform.x || 0,
                    y: attachmentTransform.y || 0,
                    skX: (attachmentTransform.skX || 0) * (Math.PI / 180),
                    scY: attachmentTransform.scY || 1,
                }
            };
        });

        (this.textureData.SubTexture || []).forEach(tex => { this.textures[tex.name] = tex; });

        const animationsSource = this.armature.animation || this.skeletonData.animation || [];
        animationsSource.forEach(animData => {
            this.animations[animData.name] = animData;
        });
    }

    play(animationName, loop = true) {
        if (!this.animations[animationName]) {
            console.error(`Animation "${animationName}" not found for armature "${this.armature.name}".`);
            return;
        }
        this.activeAnimation = this.animations[animationName];
        this.animationTime = 0;
        this.loop = loop;
        this.isPlaying = true;
    }

    stop() { this.isPlaying = false; }

    update(deltaTime) {
        if (!this.activeAnimation || !this.isPlaying) return;
        this.animationTime += deltaTime;
        const duration = (this.activeAnimation.duration || 0) / this.frameRate;
        if (duration > 0 && this.animationTime >= duration) {
            if (this.loop) { this.animationTime %= duration; }
            else { this.animationTime = duration; this.stop(); }
        }
        const currentFrame = this.animationTime * this.frameRate;
        const animatedBones = new Set();
        (this.activeAnimation.bone || []).forEach(boneAnim => {
            const bone = this.bones.find(b => b.name === boneAnim.name);
            if (!bone) return;
            const t = this._getInterpolatedValue(boneAnim.translateFrame, currentFrame);
            const r = this._getInterpolatedValue(boneAnim.rotateFrame, currentFrame);
            const finalTransform = { ...bone.transform };
            if (t) { finalTransform.x += t.x || 0; finalTransform.y += t.y || 0; }
            if (r) {
                const rotRad = (r.rotate || 0) * (Math.PI / 180);
                finalTransform.skX += rotRad;
                finalTransform.skY += rotRad;
            }
            bone.animTransform = finalTransform;
            animatedBones.add(bone.name);
        });
        this.bones.forEach(bone => { if (!animatedBones.has(bone.name)) bone.animTransform = { ...bone.transform }; });
        this.bones.forEach(bone => {
            if (!bone.parent) { bone.worldTransform = { ...bone.animTransform }; }
            else {
                const pwt = bone.parent.worldTransform;
                const lt = bone.animTransform;
                const cos = Math.cos(pwt.skX);
                const sin = Math.sin(pwt.skX);
                bone.worldTransform.x = pwt.x + (lt.x * pwt.scX * cos - lt.y * pwt.scY * sin);
                bone.worldTransform.y = pwt.y + (lt.x * pwt.scX * sin + lt.y * pwt.scY * cos);
                bone.worldTransform.skX = pwt.skX + lt.skX;
                bone.worldTransform.skY = pwt.skY + lt.skY;
                bone.worldTransform.scX = pwt.scX * lt.scX;
                bone.worldTransform.scY = pwt.scY * lt.scY;
            }
        });
    }

    render() {
        if (!this.armature) return;
        this.ctx.save();
        this.ctx.translate(this.globalTransform.x, this.globalTransform.y);
        this.ctx.scale(this.globalTransform.scaleX, this.globalTransform.scaleY);
        this.drawOrder.forEach(slot => {
            if (slot.attachment) this._renderSprite(slot.attachment, slot.parent.worldTransform);
        });
        this.ctx.restore();
    }

    _renderSprite(attachment, boneWorldTransform) {
        const texture = this.textures[attachment.name];
        if (!texture) return;
        const at = attachment.transform;
        const wt = boneWorldTransform;
        this.ctx.save();
        const cos = Math.cos(wt.skX);
        const sin = Math.sin(wt.skX);
        const dx = wt.x + (at.x * wt.scX * cos - at.y * wt.scY * sin);
        const dy = wt.y + (at.x * wt.scX * sin + at.y * wt.scY * cos);
        const dRot = wt.skX + at.skX;
        this.ctx.translate(dx, dy);
        this.ctx.rotate(dRot);
        this.ctx.scale(wt.scX, wt.scY);
        this.ctx.drawImage(this.textureImage, texture.x, texture.y, texture.width, texture.height, -texture.width / 2, -texture.height / 2, texture.width, texture.height);
        this.ctx.restore();
    }

    _getInterpolatedValue(frames, currentFrame) {
        if (!frames || frames.length === 0) return null;
        if (frames.length === 1) return frames[0];
        let totalDuration = 0;
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const frameDuration = frame.duration === 0 ? 0.0001 : (frame.duration || 0);
            if (currentFrame >= totalDuration && currentFrame < totalDuration + frameDuration) {
                const startFrame = frame;
                const endFrame = frames[(i + 1) % frames.length];
                let progress = (currentFrame - totalDuration) / frameDuration;
                progress = Math.max(0, Math.min(1, progress));
                const result = {};
                const startX = startFrame.x || 0;
                const endX = endFrame.x || 0;
                if ('x' in endFrame || 'x' in startFrame) result.x = startX + (endX - startX) * progress;
                const startY = startFrame.y || 0;
                const endY = endFrame.y || 0;
                if ('y' in endFrame || 'y' in startFrame) result.y = startY + (endY - startY) * progress;
                const startRot = startFrame.rotate || 0;
                const endRot = endFrame.rotate || 0;
                if ('rotate' in endFrame || 'rotate' in startFrame) {
                    let diff = endRot - startRot;
                    if (diff > 180) diff -= 360;
                    if (diff < -180) diff += 360;
                    result.rotate = startRot + diff * progress;
                }
                return result;
            }
            totalDuration += frameDuration;
        }
        return frames[frames.length - 1];
    }
}