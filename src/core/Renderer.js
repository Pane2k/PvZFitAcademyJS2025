import Debug from "./Debug.js";

export default class Renderer{
    constructor(canvas, virtualWidth, virtualHeight){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.VIRTUAL_WIDTH = virtualWidth;
        this.VIRTUAL_HEIGHT = virtualHeight;

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        window.addEventListener('resize', this.resize)
        this.resize()
        Debug.log('Renderer initialized.')
    }

    resize = () => {
        const physicalWidth = this.canvas.clientWidth;
        const physicalHeight = this.canvas.clientHeight;

        this.canvas.width = physicalWidth;
        this.canvas.height = physicalHeight;

        const scaleX = physicalWidth / this.VIRTUAL_WIDTH;
        const scaleY = physicalHeight / this.VIRTUAL_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);

        const scaledWidth = this.VIRTUAL_WIDTH * this.scale;
        const scaledHeight = this.VIRTUAL_HEIGHT * this.scale;
        this.offsetX = (physicalWidth - scaledWidth) / 2;
        this.offsetY = (physicalHeight - scaledHeight) / 2;
        
        Debug.log(`Canvas resized. Scale: ${this.scale.toFixed(2)}, Offset: (${this.offsetX.toFixed(2)}, ${this.offsetY.toFixed(2)})`);
    }

    clear(color = 'black'){
        this.ctx.fillStyle = color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    drawImage(image, virtualX, virtualY, virtualW, virtualH){
        if (!image || image.width === 0 || image.height === 0) return;
        
        this.ctx.drawImage(
            image,
            virtualX * this.scale + this.offsetX,
            virtualY * this.scale + this.offsetY,
            virtualW * this.scale,
            virtualH * this.scale
        );
    }

    drawRect(virtualX, virtualY, virtualW, virtualH, strokeColor, lineWidth = 1) {
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(
            virtualX * this.scale + this.offsetX,
            virtualY * this.scale + this.offsetY,
            virtualW * this.scale,
            virtualH * this.scale
        );
    }
    drawPartialImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
        if (!image || image.width === 0 || image.height === 0) return;

        this.ctx.drawImage(
            image,
            sx, sy, sWidth, sHeight,
            dx * this.scale + this.offsetX,
            dy * this.scale + this.offsetY,
            dWidth * this.scale,
            dHeight * this.scale
        );
    }
    drawText(text, virtualX, virtualY, font, color, textAlign = 'left', textBaseline = 'top') {
        const safeFont = font || '16px Arial';
        this.ctx.save();

        const parts = safeFont.split(' '); 
        const virtualSize = parseFloat(parts[0]);
        const physicalSize = virtualSize * this.scale;
        const scaledFont = `${physicalSize}px ${parts.slice(1).join(' ')}`;

        this.ctx.font = scaledFont;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = textBaseline;

        const physicalX = virtualX * this.scale + this.offsetX;
        const physicalY = virtualY * this.scale + this.offsetY;

        this.ctx.fillText(text, physicalX, physicalY);

        this.ctx.restore();
    }
}