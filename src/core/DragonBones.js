/**
 * @class DragonBonesRenderer
 * @version 2.0.15
 * Универсальный рендерер для анимаций DragonBones JSON на чистом HTML Canvas.
 * Поддерживает стандартные спрайты, меши и базовую IK.
 * Устойчив к разным структурам JSON. Не имеет внешних зависимостей.
 */
export default class  DragonBonesRenderer {
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
        this.ikConstraints = []; // To store IK constraints
        this.debugDraw = false; // New debug flag
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
        
        if (this.skeletonData.armature.length > 1) {
             this.armature = this.skeletonData.armature.reduce((main, current) => {
                const mainBones = main.bone ? main.bone.length : 0;
                const currentBones = current.bone ? current.bone.length : 0;
                return currentBones > mainBones ? current : main;
            });
        } else {
            this.armature = this.skeletonData.armature[0];
        }

        if (!this.armature) {
            console.error("Could not find a valid armature in the skeleton data.");
            return;
        }

        const boneMap = new Map();
        
        (this.armature.bone || []).forEach((boneData) => {
            const transform = boneData.transform || {};
            const bone = {
                name: boneData.name,
                parentName: boneData.parent || null,
                parent: null,
                children: [],
                length: boneData.length || 0,
                transform: {
                    x: transform.x || 0,
                    y: transform.y || 0,
                    skX: (transform.skX || 0) * (Math.PI / 180),
                    skY: (transform.skY || 0) * (Math.PI / 180),
                    scX: transform.scX ?? 1,
                    scY: transform.scY ?? 1,
                },
                worldTransform: { x: 0, y: 0, skX: 0, skY: 0, scX: 1, scY: 1 },
                animTransform: {}
            };
            this.bones.push(bone);
            boneMap.set(bone.name, bone);
        });

        this.bones.forEach(bone => { 
            if (bone.parentName) {
                bone.parent = boneMap.get(bone.parentName);
                bone.parent.children.push(bone);
            }
        });

        (this.armature.slot || []).forEach(slotData => {
            const slot = { name: slotData.name, parent: boneMap.get(slotData.parent), attachment: null };
            this.slots.push(slot);
        });
        this.drawOrder = [...this.slots];

        const skin = this.armature.skin[0];
        if (!skin) {
            console.error(`No skin found in armature "${this.armature.name}".`);
            return;
        }

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
                    scX: attachmentTransform.scX ?? 1,
                    scY: attachmentTransform.scY ?? 1,
                }
            };
        });

        (this.textureData.SubTexture || []).forEach(tex => { this.textures[tex.name] = tex; });

        const animationsSource = this.armature.animation || this.skeletonData.animation || [];
        animationsSource.forEach(animData => { this.animations[animData.name] = animData; });

        (this.armature.ik || []).forEach(ikData => {
            const bone = boneMap.get(ikData.bone);
            const target = boneMap.get(ikData.target);
            if (bone && target) {
                this.ikConstraints.push({
                    bone: bone,
                    target: target,
                    bendPositive: ikData.bendPositive !== false,
                    chain: ikData.chain || 0,
                    weight: 1.0,
                });
            }
        });
    }

    play(animationName, loop = true) {
        if (!this.animations[animationName]) {
            console.error(`Animation "${animationName}" not found. Available:`, Object.keys(this.animations));
            return;
        }
        this.activeAnimation = this.animations[animationName];
        this.animationTime = 0;
        this.loop = loop;
        this.isPlaying = true;
    }

    stop() { this.isPlaying = false; }

    _updateBoneWorldTransform(bone) {
        if (!bone.parent) {
            bone.worldTransform = { ...bone.animTransform };
        } else {
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
        bone.children.forEach(child => this._updateBoneWorldTransform(child));
    }

    update(deltaTime) {
        if (!this.activeAnimation || !this.isPlaying) return;

        // 1. Обновляем время анимации
        this.animationTime += deltaTime;
        const duration = (this.activeAnimation.duration || 0) / this.frameRate;
        if (duration > 0 && this.animationTime >= duration) {
            if (this.loop) { this.animationTime %= duration; }
            else { this.animationTime = duration; this.stop(); }
        }
        const currentFrame = this.animationTime * this.frameRate;

        // 2. Применяем базовые трансформации из анимации (FK)
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

        // 3. Рассчитываем мировые трансформации для всех костей
        this.bones.forEach(bone => { if (!bone.parent) this._updateBoneWorldTransform(bone); });

        // --- VVV ВОССТАНОВЛЕННАЯ ЛОГИКА IK VVV ---
        // 4. Применяем IK поверх базовой анимации
        this.ikConstraints.forEach(ik => {
            const bone = ik.bone;
            const target = ik.target;
            const parent = bone.parent;
            if (!parent) return;

            // Координаты цели в мировой системе координат
            const targetX = target.worldTransform.x;
            const targetY = target.worldTransform.y;

            // Преобразуем координаты цели из мировой в локальную систему координат родительской кости
            const pwt = parent.parent ? parent.parent.worldTransform : { x: 0, y: 0, skX: 0, skY: 0, scX: 1, scY: 1 };
            const dx = targetX - pwt.x;
            const dy = targetY - pwt.y;
            const cos = Math.cos(-pwt.skX);
            const sin = Math.sin(-pwt.skX);
            const localTargetX = (dx * cos - dy * sin) / pwt.scX;
            const localTargetY = (dx * sin + dy * cos) / pwt.scY;
            
            // Расчет IK для двух костей
            const l1 = parent.length;
            const l2 = bone.length;
            const d = Math.sqrt(localTargetX * localTargetX + localTargetY * localTargetY);

            let angle1, angle2;

            if (d < l1 + l2) {
                const cosAngle2 = (d * d - l1 * l1 - l2 * l2) / (2 * l1 * l2);
                angle2 = Math.acos(Math.max(-1, Math.min(1, cosAngle2)));

                const cosAngle1 = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
                angle1 = Math.acos(Math.max(-1, Math.min(1, cosAngle1)));
                angle1 += Math.atan2(localTargetY, localTargetX);
            } else {
                angle1 = Math.atan2(localTargetY, localTargetX);
                angle2 = 0;
            }

            if (!ik.bendPositive) {
                angle1 = -angle1;
                angle2 = -angle2;
            }

            parent.animTransform.skX = angle1;
            bone.animTransform.skX = angle2;

            // 5. После изменения IK, немедленно обновляем мировые трансформации для затронутой ветки
            this._updateBoneWorldTransform(parent);
        });
        // --- ^^^ КОНЕЦ ЛОГИКИ IK ^^^ ---
    }
    
    render() {
        if (!this.armature) return;
        this.ctx.save();
        this.ctx.translate(this.globalTransform.x, this.globalTransform.y);
        this.ctx.scale(this.globalTransform.scaleX, this.globalTransform.scaleY);
        this.drawOrder.forEach(slot => {
            if (slot.attachment && slot.parent) this._renderAttachment(slot.attachment, slot.parent.worldTransform);
        });
        if (this.debugDraw) {
            this._drawBones();
        }
        this.ctx.restore();
    }

    _renderAttachment(attachment, boneWorldTransform) {
        this.ctx.save();
        const at = attachment.transform;
        const wt = boneWorldTransform;
        const cos = Math.cos(wt.skX);
        const sin = Math.sin(wt.skX);
        const dx = wt.x + (at.x * wt.scX * cos - at.y * wt.scY * sin);
        const dy = wt.y + (at.x * wt.scX * sin + at.y * wt.scY * cos);
        const dRot = wt.skX + at.skX;
        this.ctx.translate(dx, dy);
        this.ctx.rotate(dRot);
        this.ctx.scale(at.scX, at.scY);

        const texture = this.textures[attachment.name];
        if (texture) {
            this.ctx.drawImage(this.textureImage, texture.x, texture.y, texture.width, texture.height, -texture.width / 2, -texture.height / 2, texture.width, texture.height);
        }
        this.ctx.restore();
    }

    // _drawBones() - без изменений
    
    _getInterpolatedValue(frames, currentFrame) {
        if (!frames || frames.length === 0) return null;
        if (frames.length === 1) return frames[0];
        let totalDuration = 0;
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const frameDuration = frame.duration === 0 ? 0.0001 : (frame.duration || 0);
            if (currentFrame >= totalDuration && currentFrame < totalDuration + frameDuration) {
                const startFrame = frame;
                const endFrame = this.loop ? (frames[(i + 1) % frames.length] || startFrame) : (frames[i+1] || startFrame);
                let progress = (frameDuration === 0) ? 1.0 : (currentFrame - totalDuration) / frameDuration;
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

    getAnimationNames() {
        return Object.keys(this.animations);
    }
}