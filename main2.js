class DragonBonesGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.factory = null;
        this.armature = null;
        this.textureImage = null;
        this.lastTime = 0;

        this.globalTransform = { x: this.canvas.width / 2, y: this.canvas.height / 1.5, scale: 0.8 };
    }

    async load(skePath, texPath) {
        try {
            const [skeResponse, texResponse] = await Promise.all([fetch(skePath), fetch(texPath)]);
            const skeJSON = await skeResponse.json();
            const texJSON = await texResponse.json();

            this.factory = dragonBones.Factory.parse(skeJSON, texJSON);

            const imgPath = texPath.substring(0, texPath.lastIndexOf('/') + 1) + this.factory.textureData.imagePath;
            this.textureImage = new Image();
            await new Promise((resolve, reject) => {
                this.textureImage.onload = resolve;
                this.textureImage.onerror = reject;
                this.textureImage.src = imgPath;
            });

            this.armature = this.factory.buildArmature("Dragon");
            this.setupControls();
            this.armature.animation.play("stand");

            this.run = this.run.bind(this);
            requestAnimationFrame(this.run);

        } catch (error) {
            console.error("Failed to load DragonBones resources:", error);
        }
    }

    setupControls() {
        const controlsDiv = document.getElementById('controls');
        if (!controlsDiv) return;
        controlsDiv.innerHTML = '';

        const animNames = Object.keys(this.armature.animations.animations);
        animNames.forEach(name => {
            const button = document.createElement('button');
            button.innerText = name;
            button.onclick = () => this.armature.animation.play(name);
            controlsDiv.appendChild(button);
        });
    }

    run(time) {
        const deltaTime = this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.armature) {
            this.armature.advanceTime(deltaTime);
            this.render();
        }

        requestAnimationFrame(this.run);
    }

    render() {
        this.ctx.save();
        this.ctx.translate(this.globalTransform.x, this.globalTransform.y);
        this.ctx.scale(this.globalTransform.scale, this.globalTransform.scale);

        for (const slot of this.armature.drawOrder) {
            if (slot.display) {
                this.renderSlot(slot);
            }
        }

        this.ctx.restore();
    }

    renderSlot(slot) {
        const boneWt = slot.parentBone.worldTransform;
        const display = slot.display;
        const texture = this.factory.textureData.textures[display.name];
        if (!texture) return;

        this.ctx.save();

        const cos = Math.cos(boneWt.skX);
        const sin = Math.sin(boneWt.skX);
        const displayTransform = display.transform;

        const dx = boneWt.x + (displayTransform.x * boneWt.scX * cos - displayTransform.y * boneWt.scY * sin);
        const dy = boneWt.y + (displayTransform.x * boneWt.scX * sin + displayTransform.y * boneWt.scY * cos);
        const dRot = boneWt.skX + displayTransform.skX;
        const dScaleX = boneWt.scX * displayTransform.scX;
        const dScaleY = boneWt.scY * displayTransform.scY;

        this.ctx.translate(dx, dy);
        this.ctx.rotate(dRot);
        this.ctx.scale(dScaleX, dScaleY);

        this.ctx.drawImage(
            this.textureImage,
            texture.x, texture.y,
            texture.width, texture.height,
            -texture.width / 2, -texture.height / 2,
            texture.width, texture.height
        );

        this.ctx.restore();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new DragonBonesGame('dragon-canvas');
    game.load('../assets/animations/asa/Dragon_ske.json', '../assets/animations/asa/Dragon_tex.json');
});
