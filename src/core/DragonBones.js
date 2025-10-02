// src/core/DragonBones.js
/**
 * @version 3.3.1 (Non-Looping Animation Fix)
 * - Исправлена ошибка в `_getInterpolatedValue`, которая мешала корректному
 *   проигрыванию последнего кадра в незацикленных анимациях (например, 'dying').
 */
const dragonBones = {};

(function() {
    "use strict";

    const DEG_RAD = Math.PI / 180;

    class Armature {
        constructor(armatureData, factory) {
            this.name = armatureData.name;
            this.frameRate = armatureData.frameRate;
            this.factory = factory;
            this.bones = [];
            this.slots = [];
            this.drawOrder = [];
            this.animations = new AnimationPlayer(this, armatureData.animations || []);
        }
        getBone(name) { return this.bones.find(b => b.name === name); }
        getSlot(name) { return this.slots.find(s => s.name === name); }
        get animation() { return this.animations; }
        
        advanceTime(deltaTime) {
            this.animations.advanceTime(deltaTime);
            this.bones.forEach(b => { if (!b.parent) b.update(); });
        }
    }

    class Bone {
        constructor(boneData) {
            this.name = boneData.name;
            this.parent = null;
            this.children = [];
            this.length = boneData.length || 0;
            this.bindPose = { ...boneData.transform };
            this.animTransform = { ...boneData.transform };
            this.worldTransform = { x: 0, y: 0, skX: 0, skY: 0, scX: 1, scY: 1 };
        }

        update() {
            const lt = this.animTransform;
            if (this.parent) {
                const pwt = this.parent.worldTransform;
                const cos = Math.cos(pwt.skX);
                const sin = Math.sin(pwt.skX);
                this.worldTransform.x = pwt.x + (lt.x * pwt.scX * cos - lt.y * pwt.scY * sin);
                this.worldTransform.y = pwt.y + (lt.x * pwt.scX * sin + lt.y * pwt.scY * cos);
                this.worldTransform.skX = pwt.skX + lt.skX;
                this.worldTransform.skY = pwt.skY + lt.skY;
                this.worldTransform.scX = pwt.scX * lt.scX;
                this.worldTransform.scY = pwt.scY * lt.scY;
            } else {
                this.worldTransform = { ...lt };
            }
            this.children.forEach(c => c.update());
        }
    }

    class Slot {
        constructor(slotData, bone) {
            this.name = slotData.name;
            this.parentBone = bone;
            this.displayData = null; 
            this.textureData = null;
        }
    }

    class AnimationPlayer {
        constructor(armature, animationsData) {
            this.armature = armature;
            this.animations = {};
            (animationsData || []).forEach(a => this.animations[a.name] = a);
            this.activeAnimation = null;
            this.animationTime = 0;
            this.loop = true;
        }

        play(name, loop = true) {
            if (!this.animations[name]) return console.error(`Animation not found: ${name}`);
            // Не перезапускаем анимацию, если она уже играет (особенно важно для незацикленных)
            if (this.activeAnimation && this.activeAnimation.name === name) return;
            this.activeAnimation = this.animations[name];
            this.animationTime = 0;
            this.loop = loop;
        }

        advanceTime(deltaTime) {
            if (!this.activeAnimation) return;
            const frameRate = this.armature.frameRate || 24;
            const durationInSeconds = (this.activeAnimation.duration || 0) / frameRate;

            if (durationInSeconds > 0) {
                this.animationTime += deltaTime;
                if (this.loop && this.animationTime >= durationInSeconds) {
                    this.animationTime %= durationInSeconds;
                } else {
                    this.animationTime = Math.min(this.animationTime, durationInSeconds);
                }
            }

            const currentFrame = this.animationTime * frameRate;
            const animatedBones = new Set();

            (this.activeAnimation.bone || []).forEach(boneAnim => {
                const bone = this.armature.getBone(boneAnim.name);
                if (!bone) return;

                const finalTransform = { ...bone.bindPose };
                const t = this._getInterpolatedValue(boneAnim.translateFrame, currentFrame);
                const r = this._getInterpolatedValue(boneAnim.rotateFrame, currentFrame, true);
                
                if (t) {
                    const isRootMotionBone = (this.activeAnimation.name.includes('walk') && bone.name === 'body');
                    if (!isRootMotionBone) {
                         finalTransform.x += t.x ?? 0;
                    }
                    finalTransform.y += t.y ?? 0;
                }
                if (r) {
                    const rotRad = (r.rotate || 0) * DEG_RAD;
                    finalTransform.skX += rotRad;
                    finalTransform.skY += rotRad;
                }

                bone.animTransform = finalTransform;
                animatedBones.add(bone.name);
            });
            
            this.armature.bones.forEach(bone => {
                if (!animatedBones.has(bone.name)) {
                    bone.animTransform = { ...bone.bindPose };
                }
            });
        }
        
        _getInterpolatedValue(frames, currentFrame, isRotation = false) {
            if (!frames || frames.length === 0) return null;
            // --- VVV ИСПРАВЛЕНИЕ ДЛЯ ПОСЛЕДНЕГО КАДРА VVV ---
            if (frames.length === 1) return { ...frames[0] };
            let totalDuration = 0;
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                const frameDuration = frame.duration || 0;

                // Если это последний кадр, и время вышло за его пределы, возвращаем его.
                if (i === frames.length - 1 && currentFrame >= totalDuration) {
                    return { ...frame };
                }

                if (currentFrame >= totalDuration && currentFrame < totalDuration + frameDuration) {
                    // --- ^^^ КОНЕЦ ИСПРАВЛЕНИЯ ^^^ ---
                    const startFrame = frame;
                    const nextFrameIndex = i + 1;
                    const endFrame = (nextFrameIndex < frames.length) ? frames[nextFrameIndex] : startFrame;
                    const progress = (frameDuration === 0) ? 1 : (currentFrame - totalDuration) / frameDuration;
                    
                    const result = {};
                    const startX = startFrame.x || 0, endX = endFrame.x || 0;
                    if ('x' in startFrame || 'x' in endFrame) result.x = startX + (endX - startX) * progress;

                    const startY = startFrame.y || 0, endY = endFrame.y || 0;
                    if ('y' in startFrame || 'y' in endFrame) result.y = startY + (endY - startY) * progress;
                    
                    const startRot = startFrame.rotate || 0, endRot = endFrame.rotate || 0;
                    if (isRotation) {
                        let diff = endRot - startRot;
                        if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
                        result.rotate = startRot + diff * progress;
                    }
                    return result;
                }
                totalDuration += frameDuration;
            }
            return { ...frames[frames.length - 1] };
        }
    }

    class Factory {
        constructor() {
            this.skeletonData = {};
            this.textureData = {};
        }

        parse(skeletonJSON, textureJSON, name) {
            this.textureData[name] = { imagePath: textureJSON.imagePath, textures: {} };
            (textureJSON.SubTexture || []).forEach(t => this.textureData[name].textures[t.name] = t);
            const armatureData = skeletonJSON.armature.find(a => a.type === 'Armature' && a.skin && a.skin.length > 0);
            if (!armatureData) return console.error(`No valid armature found in ${name}`);
            const parsedArmature = {
                name: armatureData.name, frameRate: armatureData.frameRate || skeletonJSON.frameRate,
                bones: [], slots: [], skins: {}, animations: []
            };
            (armatureData.bone || []).forEach(b => {
                const t = b.transform || {};
                parsedArmature.bones.push({ name: b.name, parent: b.parent, length: b.length || 0, transform: { x: t.x || 0, y: t.y || 0, skX: (t.skX || 0) * DEG_RAD, skY: (t.skY || 0) * DEG_RAD, scX: t.scX ?? 1, scY: t.scY ?? 1 } });
            });
            (armatureData.slot || []).forEach(s => parsedArmature.slots.push({ name: s.name, parent: s.parent }));
            (armatureData.skin || []).forEach(sk => {
                const skinDisplays = {};
                (sk.slot || []).forEach(sl => {
                    skinDisplays[sl.name] = (sl.display || []).map(d => {
                        const t = d.transform || {};
                        return { name: d.name, transform: { x: t.x || 0, y: t.y || 0, skX: (t.skX || 0) * DEG_RAD, skY: (t.skY || 0) * DEG_RAD, scX: t.scX ?? 1, scY: t.scY ?? 1 } };
                    });
                });
                parsedArmature.skins['default'] = skinDisplays;
            });
            parsedArmature.animations.push(...(armatureData.animation || []));
            this.skeletonData[name] = parsedArmature;
        }

        buildArmature(name) {
            const armData = this.skeletonData[name];
            if (!armData) return null;
            const armature = new Armature(armData, this);
            const boneMap = new Map();
            armData.bones.forEach(boneData => {
                const bone = new Bone(boneData);
                armature.bones.push(bone);
                boneMap.set(bone.name, bone);
            });
            armature.bones.forEach(bone => {
                const boneData = armData.bones.find(b => b.name === bone.name);
                if (boneData.parent) {
                    bone.parent = boneMap.get(boneData.parent);
                    if(bone.parent) bone.parent.children.push(bone);
                }
            });
            const textureAtlases = this.textureData[name].textures;
            const defaultSkin = armData.skins['default'];
            armData.slots.forEach(slotData => {
                const bone = boneMap.get(slotData.parent);
                const slot = new Slot(slotData, bone);
                const displays = defaultSkin[slot.name];
                if (displays && displays.length > 0) {
                    slot.displayData = displays[0];
                    slot.textureData = textureAtlases[displays[0].name];
                }
                armature.slots.push(slot);
            });
            armature.drawOrder = [...armature.slots];
            return armature;
        }
    }
    dragonBones.Factory = Factory;
})();

export default dragonBones;