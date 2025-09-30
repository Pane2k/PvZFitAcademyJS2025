/**
 * DragonBones-like Renderer
 * FINAL VERSION - Incorporates the correct timeline interpolation logic.
 */
const dragonBones = {};

(function() {
    "use strict";

    const DEG_RAD = Math.PI / 180;

    class Armature {
        constructor(armatureData) {
            this.name = armatureData.name;
            this.frameRate = armatureData.frameRate;
            this.bones = [];
            this.slots = [];
            this.drawOrder = [];
            this.animations = new AnimationPlayer(this, armatureData.animations);
        }
        getBone(name) { return this.bones.find(b => b.name === name); }
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
            this.display = null;
        }
    }

    class AnimationPlayer {
        constructor(armature, animationsData) {
            this.armature = armature;
            this.animations = {};
            animationsData.forEach(a => this.animations[a.name] = a);
            this.activeAnimation = null;
            this.animationTime = 0;
            this.loop = true;
        }

        play(name, loop = true) {
            if (!this.animations[name]) return console.error(`Animation not found: ${name}`);
            this.activeAnimation = this.animations[name];
            this.animationTime = 0;
            this.loop = loop;
        }

        advanceTime(deltaTime) {
            if (!this.activeAnimation) return;

            const frameRate = this.armature.frameRate || 24;
            const durationInSeconds = this.activeAnimation.duration / frameRate;

            if (durationInSeconds > 0) {
                this.animationTime += deltaTime;
                if (this.loop) {
                    this.animationTime %= durationInSeconds;
                } else {
                    this.animationTime = Math.min(this.animationTime, durationInSeconds);
                }
            }

            const currentFrame = this.animationTime * frameRate;
            const animatedBones = new Set();

            if (this.activeAnimation.bone) {
                this.activeAnimation.bone.forEach(boneAnim => {
                    const bone = this.armature.getBone(boneAnim.name);
                    if (!bone) return;

                    const finalTransform = { ...bone.bindPose };

                    const t = this._getInterpolatedValue(boneAnim.translateFrame, currentFrame);
                    const r = this._getInterpolatedValue(boneAnim.rotateFrame, currentFrame, true);
                    const s = this._getInterpolatedValue(boneAnim.scaleFrame, currentFrame);

                    if (t) {
                        finalTransform.x += t.x || 0;
                        finalTransform.y += t.y || 0;
                    }
                    if (r) {
                        const rotRad = (r.rotate || 0) * DEG_RAD;
                        finalTransform.skX += rotRad;
                        finalTransform.skY += rotRad;
                    }
                    if (s) {
                        finalTransform.scX *= s.x ?? 1;
                        finalTransform.scY *= s.y ?? 1;
                    }

                    bone.animTransform = finalTransform;
                    animatedBones.add(bone.name);
                });
            }

            this.armature.bones.forEach(bone => {
                if (!animatedBones.has(bone.name)) {
                    bone.animTransform = { ...bone.bindPose };
                }
            });
        }

        _getInterpolatedValue(frames, currentFrame, isRotation = false) {
            if (!frames || frames.length === 0) return null;
            if (frames.length === 1) return frames[0].transform;

            let totalDuration = 0;
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                // Handle cases where duration might be missing or zero.
                const frameDuration = frame.duration || 0;

                if (currentFrame >= totalDuration && currentFrame <= totalDuration + frameDuration) {
                    const startFrame = frame;
                    const endFrame = this.loop ? frames[(i + 1) % frames.length] : (frames[i + 1] || startFrame);

                    // Avoid division by zero for tweens that last 0 frames.
                    const progress = (frameDuration === 0) ? 1 : (currentFrame - totalDuration) / frameDuration;

                    const startTransform = startFrame.transform || {};
                    const endTransform = endFrame.transform || {};
                    const result = {};

                    const startX = startTransform.x || 0;
                    const endX = endTransform.x || 0;
                    if ('x' in startTransform || 'x' in endTransform) {
                        result.x = startX + (endX - startX) * progress;
                    }

                    const startY = startTransform.y || 0;
                    const endY = endTransform.y || 0;
                    if ('y' in startTransform || 'y' in endTransform) {
                        result.y = startY + (endY - startY) * progress;
                    }
                    
                    const startRot = startTransform.skX ?? startTransform.skY ?? 0;
                    const endRot = endTransform.skX ?? endTransform.skY ?? 0;
                    if (isRotation) {
                        let diff = endRot - startRot;
                        if (diff > 180) diff -= 360;
                        if (diff < -180) diff += 360;
                        result.rotate = startRot + diff * progress;
                    }

                    return result;
                }
                totalDuration += frameDuration;
            }
            // If currentFrame is past all durations, return the state of the last frame
            return frames[frames.length - 1].transform;
        }
    }

    class Factory {
        static parse(skeletonJSON, textureJSON) {
            const factory = new Factory();
            factory.skeletonData = { armatures: {} };
            factory.textureData = { imagePath: textureJSON.imagePath, textures: {} };
            textureJSON.SubTexture.forEach(t => factory.textureData.textures[t.name] = t);

            skeletonJSON.armature.forEach(armData => {
                const armatureData = {
                    name: armData.name,
                    frameRate: armData.frameRate || skeletonJSON.frameRate,
                    bones: [], slots: [], skins: [], animations: []
                };

                (armData.bone || []).forEach(b => {
                    const t = b.transform || {};
                    armatureData.bones.push({ name: b.name, parent: b.parent, transform: { x: t.x || 0, y: t.y || 0, skX: (t.skX || 0) * DEG_RAD, skY: (t.skY || 0) * DEG_RAD, scX: t.scX ?? 1, scY: t.scY ?? 1 } });
                });
                
                (armData.slot || []).forEach(s => armatureData.slots.push({ name: s.name, parent: s.parent }));
                
                (armData.skin || []).forEach(sk => {
                    const skin = { name: sk.name, displays: {} };
                    (sk.slot || []).forEach(sl => {
                        skin.displays[sl.name] = (sl.display || []).map(d => {
                            const t = d.transform || {};
                            return { name: d.name, transform: { x: t.x || 0, y: t.y || 0, skX: (t.skX || 0) * DEG_RAD, skY: (t.skY || 0) * DEG_RAD, scX: t.scX ?? 1, scY: t.scY ?? 1 } };
                        });
                    });
                    armatureData.skins.push(skin);
                });
                
                // This simplified parsing is now correct because the interpolation logic handles the structure
                const anims = armData.animation || skeletonJSON.animation || [];
                anims.forEach(animRaw => {
                    const animData = { name: animRaw.name, duration: animRaw.duration, bone: [] };
                     (animRaw.bone || []).forEach(boneAnimRaw => {
                        const boneTimeline = { name: boneAnimRaw.name, translateFrame: [], rotateFrame: [], scaleFrame: [] };
                        (boneAnimRaw.frame || []).forEach(frameRaw => {
                           const t = frameRaw.transform || {};
                           if (Object.keys(t).some(k => ['x','y'].includes(k))) boneTimeline.translateFrame.push(frameRaw);
                           if (Object.keys(t).some(k => ['skX','skY'].includes(k))) boneTimeline.rotateFrame.push(frameRaw);
                           if (Object.keys(t).some(k => ['scX','scY'].includes(k))) boneTimeline.scaleFrame.push(frameRaw);
                        });
                        animData.bone.push(boneTimeline);
                     });
                    armatureData.animations.push(animData);
                });

                factory.skeletonData.armatures[armData.name] = armatureData;
            });
            return factory;
        }

        buildArmature(name) {
            const armData = this.skeletonData.armatures[name];
            if (!armData) return null;

            const armature = new Armature(armData);
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

            armData.slots.forEach(slotData => {
                const bone = boneMap.get(slotData.parent);
                const slot = new Slot(slotData, bone);
                armature.slots.push(slot);
            });
            armature.drawOrder = [...armature.slots];

            const skin = armData.skins[0];
            if (skin) {
                armature.slots.forEach(slot => {
                    if (skin.displays[slot.name]) {
                        slot.display = skin.displays[slot.name][0];
                    }
                });
            }
            return armature;
        }
    }
    dragonBones.Factory = Factory;
})();