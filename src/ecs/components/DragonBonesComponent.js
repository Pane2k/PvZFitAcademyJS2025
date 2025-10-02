import dragonBones from '../../core/DragonBones.js';

export default class DragonBonesComponent {
    constructor(factory, name, initialAnimation = 'walk', scale = 1.0, anchorOffsetY = 0) {
        this.armature = factory.buildArmature(name);
        this.scale = scale;
        this.textureName = name;
        this.anchorOffsetY = anchorOffsetY; // <-- СОХРАНЯЕМ СМЕЩЕНИЕ

        if (this.armature) {
            this.playAnimation(initialAnimation, true);
        } else {
            console.error(`Failed to build armature: ${name}`);
        }
    }

    playAnimation(name, loop = true) {
        if (this.armature) {
            this.armature.animation.play(name, loop);
        }
    }

    update(deltaTime) {
        if (this.armature) {
            this.armature.advanceTime(deltaTime);
        }
    }

    setAttachment(slotName, attachmentName) {
        if (!this.armature) return;
        const slot = this.armature.getSlot(slotName);
        if (!slot) return;
        
        if (!attachmentName) {
            slot.displayData = null;
            slot.textureData = null;
            return;
        }

        const skin = this.armature.factory.skeletonData[this.textureName].skins['default'];
        const displays = skin[slotName];
        if (displays) {
            const displayData = displays.find(d => d.name === attachmentName);
            if (displayData) {
                slot.displayData = displayData;
                const textureAtlas = this.armature.factory.textureData[this.textureName].textures;
                slot.textureData = textureAtlas[displayData.name];
            }
        }
    }
}