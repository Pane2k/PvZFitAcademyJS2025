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
        this.armature = this.skeletonData.armature[0];
        const boneMap = new Map();
        const boneMapByIndex = new Map(); // New map to store bones by their original index

        (this.armature.bone || []).forEach((boneData, originalJsonIndex) => {
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
            boneMapByIndex.set(originalJsonIndex, bone); // Store bone by its original index from JSON
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

            if (display.type === 'mesh') {
                // Process weights to store bone references instead of indices
                const processedWeights = [];
                let weightIndex = 0;
                const rawWeights = display.weights || [];

                // DragonBones weights format: [numBones, boneIndex, boneLocalX, boneLocalY, weight, ...]
                // We need to map boneIndex to our bone object
                for (let i = 0; i < (display.vertices || []).length / 2; i++) { // Iterate per vertex
                    const numBones = rawWeights[weightIndex++];
                    processedWeights.push(numBones);

                    for (let j = 0; j < numBones; j++) {
                        const boneIdx = rawWeights[weightIndex++]; // This is the original index from JSON
                        const bone = boneMapByIndex.get(boneIdx); // Get bone by its original index
                        if (!bone) {
                            // console.warn(`_parse: Bone with original JSON index ${boneIdx} not found for mesh ${display.name}. rawWeights index: ${weightIndex - 1}`);
                            // Fallback or error handling - push undefined or a dummy bone
                            processedWeights.push(undefined); // Push undefined for now to see if it breaks later
                        } else {
                            processedWeights.push(bone); // Store bone object reference
                        }
                        processedWeights.push(rawWeights[weightIndex++]); // boneLocalX
                        processedWeights.push(rawWeights[weightIndex++]); // boneLocalY
                        processedWeights.push(rawWeights[weightIndex++]); // weight
                    }
                }

                slot.attachment = {
                    type: 'mesh',
                    name: display.name,
                    transform: {
                        x: attachmentTransform.x || 0,
                        y: attachmentTransform.y || 0,
                        skX: (attachmentTransform.skX || 0) * (Math.PI / 180),
                        scX: attachmentTransform.scX || 1,
                        scY: attachmentTransform.scY || 1,
                    },
                    vertices: display.vertices || [],
                    uvs: display.uvs || [],
                    triangles: display.triangles || [],
                    weights: processedWeights, // Use processed weights with bone references
                    width: display.width || 0,
                    height: display.height || 0,
                    deformedVertices: [], // Will store calculated deformed vertices
                };
            } else {
                slot.attachment = {
                    type: 'image',
                    name: display.name,
                    transform: {
                        x: attachmentTransform.x || 0,
                        y: attachmentTransform.y || 0,
                        skX: (attachmentTransform.skX || 0) * (Math.PI / 180),
                        scX: attachmentTransform.scX || 1,
                        scY: attachmentTransform.scY || 1,
                    }
                };
            }
        });

        (this.textureData.SubTexture || []).forEach(tex => { this.textures[tex.name] = tex; });

        const animationsSource = this.armature.animation || this.skeletonData.animation || [];
        animationsSource.forEach(animData => {
            this.animations[animData.name] = animData;
        });

        // Parse IK constraints
        (this.armature.ik || []).forEach(ikData => {
            const bone = boneMap.get(ikData.bone);
            const target = boneMap.get(ikData.target);
            if (bone && target) {
                this.ikConstraints.push({
                    name: ikData.name,
                    bone: bone,
                    target: target,
                    chain: ikData.chain || 0, // Number of bones in the IK chain
                    bendPositive: ikData.bendPositive !== undefined ? ikData.bendPositive : true, // Bend direction
                    weight: ikData.weight !== undefined ? ikData.weight : 1.0, // IK influence
                });
            }
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

        // Apply IK constraints (simplified two-bone IK for now)
        this.ikConstraints.forEach(ik => {
            if (ik.chain === 2) { // Basic two-bone IK
                const bone0 = ik.bone.parent; // First bone in chain
                const bone1 = ik.bone;       // Second bone in chain
                const targetBone = ik.target; // Target bone

                if (!bone0 || !bone1 || !targetBone) return;

                // Get world positions of bones and target
                const p0x = bone0.worldTransform.x;
                const p0y = bone0.worldTransform.y;
                const p2x = targetBone.worldTransform.x;
                const p2y = targetBone.worldTransform.y;

                const l1 = Math.sqrt(Math.pow(bone1.transform.x, 2) + Math.pow(bone1.transform.y, 2)); // Length of bone1
                const l2 = Math.sqrt(Math.pow(ik.bone.transform.x, 2) + Math.pow(ik.bone.transform.y, 2)); // Length of effector bone

                const dx = p2x - p0x;
                const dy = p2y - p0y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist >= l1 + l2) { // Target is out of reach
                    const targetAngle = Math.atan2(dy, dx);
                    bone0.animTransform.skX = targetAngle;
                    bone1.animTransform.skX = 0;
                } else { // Target is reachable
                    const cosAlpha = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
                    const alpha = Math.acos(cosAlpha);
                    const beta = Math.acos((l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2));

                    const targetAngle = Math.atan2(dy, dx);

                    // Adjust angles based on bend direction
                    if (ik.bendPositive) {
                        bone0.animTransform.skX = targetAngle - alpha;
                        bone1.animTransform.skX = Math.PI - beta;
                    } else {
                        bone0.animTransform.skX = targetAngle + alpha;
                        bone1.animTransform.skX = -(Math.PI - beta);
                    }
                }
                // Update world transforms after IK
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
        });

        // Mesh deformation calculation
        this.slots.forEach(slot => {
            if (slot.attachment && slot.attachment.type === 'mesh' && slot.attachment.weights && slot.attachment.weights.length > 0) {
                const mesh = slot.attachment;
                mesh.deformedVertices = [];
                const originalVertices = mesh.vertices;
                const weights = mesh.weights;
                let weightIndex = 0;

                for (let i = 0; i < originalVertices.length; i += 2) {
                    let x = 0;
                    let y = 0;
                    const numBones = weights[weightIndex++];

                    for (let j = 0; j < numBones; j++) {
                        const bone = weights[weightIndex++]; // Now it's a bone object reference
                        const boneLocalX = weights[weightIndex++];
                        const boneLocalY = weights[weightIndex++];
                        const weight = weights[weightIndex++];

                        if (!bone) {
                            // console.warn(`update: Bone reference is undefined for mesh ${mesh.name}. Skipping vertex deformation.`);
                            continue; // Skip this part of the vertex if bone is undefined
                        }

                        // Apply bone world transform to local vertex position
                        const bwt = bone.worldTransform;
                        const cos = Math.cos(bwt.skX);
                        const sin = Math.sin(bwt.skX);

                        const transformedX = bwt.x + (boneLocalX * bwt.scX * cos - boneLocalY * bwt.scY * sin);
                        const transformedY = bwt.y + (boneLocalX * bwt.scX * sin + boneLocalY * bwt.scY * cos);

                        x += transformedX * weight;
                        y += transformedY * weight;
                    }
                    mesh.deformedVertices.push(x, y);
                }
            } else if (slot.attachment && slot.attachment.type === 'mesh') {
                // If no weights, use original vertices (static mesh)
                slot.attachment.deformedVertices = [...slot.attachment.vertices];
            }
        });
    }

    render() {
        if (!this.armature) return;
        this.ctx.save();
        this.ctx.translate(this.globalTransform.x, this.globalTransform.y);
        this.ctx.scale(this.globalTransform.scaleX, this.globalTransform.scaleY);
        this.drawOrder.forEach(slot => {
            if (slot.attachment) this._renderAttachment(slot.attachment, slot.parent.worldTransform);
        });
        if (this.debugDraw) { // Conditionally draw bones
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
        this.ctx.scale(wt.scX, wt.scY);

        if (attachment.type === 'image') {
            const texture = this.textures[attachment.name];
            if (!texture) return;
            this.ctx.drawImage(this.textureImage, texture.x, texture.y, texture.width, texture.height, -texture.width / 2, -texture.height / 2, texture.width, texture.height);
        } else if (attachment.type === 'mesh') {
            const textureAtlasRegion = this.textures[attachment.name];
            if (!textureAtlasRegion) return;

            const deformedVertices = attachment.deformedVertices;
            const uvs = attachment.uvs;
            const triangles = attachment.triangles;

            if (this.debugDraw) {
                this.ctx.beginPath();
                for (let i = 0; i < triangles.length; i += 3) {
                    const i0 = triangles[i] * 2;
                    const i1 = triangles[i + 1] * 2;
                    const i2 = triangles[i + 2] * 2;

                    const x0 = deformedVertices[i0];
                    const y0 = deformedVertices[i0 + 1];
                    const x1 = deformedVertices[i1];
                    const y1 = deformedVertices[i1 + 1];
                    const x2 = deformedVertices[i2];
                    const y2 = deformedVertices[i2 + 1];

                    this.ctx.moveTo(x0, y0);
                    this.ctx.lineTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.closePath();
                }
                this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)'; // Blue semi-transparent fill
                this.ctx.fill();
                this.ctx.strokeStyle = 'blue';
                this.ctx.stroke();
            } else {
                // Textured rendering attempt (still simplified and potentially distorted)
                for (let i = 0; i < triangles.length; i += 3) {
                    const i0 = triangles[i] * 2;
                    const i1 = triangles[i + 1] * 2;
                    const i2 = triangles[i + 2] * 2;

                    const x0 = deformedVertices[i0];
                    const y0 = deformedVertices[i0 + 1];
                    const x1 = deformedVertices[i1];
                    const y1 = deformedVertices[i1 + 1];
                    const x2 = deformedVertices[i2];
                    const y2 = deformedVertices[i2 + 1];

                    const uv0x = uvs[triangles[i] * 2];
                    const uv0y = uvs[triangles[i] * 2 + 1];
                    const uv1x = uvs[triangles[i + 1] * 2];
                    const uv1y = uvs[triangles[i + 1] * 2 + 1];
                    const uv2x = uvs[triangles[i + 2] * 2];
                    const uv2y = uvs[triangles[i + 2] * 2 + 1];

                    // Calculate source rectangle in the texture atlas
                    const sx = textureAtlasRegion.x + uv0x * textureAtlasRegion.width;
                    const sy = textureAtlasRegion.y + uv0y * textureAtlasRegion.height;
                    const sWidth = (uv1x - uv0x) * textureAtlasRegion.width;
                    const sHeight = (uv1y - uv0y) * textureAtlasRegion.height;

                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.moveTo(x0, y0);
                    this.ctx.lineTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.closePath();
                    this.ctx.clip();

                    this.ctx.drawImage(
                        this.textureImage,
                        sx,
                        sy,
                        sWidth,
                        sHeight,
                        x0, // Destination X
                        y0, // Destination Y
                        sWidth, // Destination Width
                        sHeight // Destination Height
                    );
                    this.ctx.restore();
                }
            }
        }
        this.ctx.restore();
    }

    _drawBones() {
        this.ctx.save();
        this.bones.forEach(bone => {
            const wt = bone.worldTransform;
            this.ctx.beginPath();
            this.ctx.arc(wt.x, wt.y, 5, 0, Math.PI * 2); // Draw a circle at bone origin
            this.ctx.strokeStyle = 'green';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            const length = 20; // Visual length of the bone
            const endX = wt.x + Math.cos(wt.skX) * length;
            const endY = wt.y + Math.sin(wt.skX) * length;
            this.ctx.beginPath();
            this.ctx.moveTo(wt.x, wt.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.strokeStyle = 'yellow';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(bone.name, wt.x + 10, wt.y + 10);
        });
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

    getAnimationNames() {
        return Object.keys(this.animations);
    }
}