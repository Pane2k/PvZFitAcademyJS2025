// src/ecs/components/DragonBonesComponent.js

import DragonBonesRenderer from '../../core/DragonBones.js';

export default class DragonBonesComponent {
    /**
     * @param {HTMLCanvasElement} canvas - Ссылка на основной canvas игры.
     * @param {object} skeData - Загруженные JSON-данные скелета.
     * @param {object} texData - Загруженные JSON-данные атласа.
     * @param {HTMLImageElement} textureImage - Загруженное изображение атласа.
     * @param {string} initialAnimation - Название анимации для запуска.
     * @param {number} scale - Масштаб модели.
     * @param {number} anchorOffsetY - Вертикальное смещение для рендеринга.
     */
    constructor(canvas, skeData, texData, textureImage, initialAnimation = 'stand', scale = 1.0, anchorOffsetY = 0) {
        this.renderer = new DragonBonesRenderer(canvas);
        
        this.renderer.skeletonData = skeData;
        this.renderer.textureData = texData;
        this.renderer.textureImage = textureImage;
        this.renderer._parse(); 
        
        this.currentAnimation = initialAnimation;
        this.scale = scale;
        this.anchorOffsetY = anchorOffsetY; // <-- СОХРАНЯЕМ СМЕЩЕНИЕ

        if (this.renderer.animations[this.currentAnimation]) {
            this.renderer.play(this.currentAnimation);
        } else {
            console.error(`Initial animation "${this.currentAnimation}" not found.`);
            const availableAnimations = this.renderer.getAnimationNames();
            if (availableAnimations.length > 0) {
                this.renderer.play(availableAnimations[0]);
            }
        }
    }

    playAnimation(name, loop = true) {
        if (name !== this.currentAnimation && this.renderer.animations[name]) {
            this.currentAnimation = name;
            this.renderer.play(name, loop);
        }
    }
}