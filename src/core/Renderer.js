import Debug from "./Debug.js";

export default class Renderer{
    constructor(canvas, virtualWidth, virtualHeight){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        
        window.addEventListener('resize', this.resize)
        this.resize()
        Debug.log('Renderer initialized.')
    }

    resize = () => {
        Debug.log('Resize event triggered!'); // <-- Добавим лог для проверки
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        Debug.log(`Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }

    clear(color = 'black'){
        this.ctx.fillStyle = color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    drawImage(image, x, y, width, height){
        if (!image || image.width === 0 || image.height === 0) {
            // Debug.warn('Attempted to draw an invalid or unloaded image.');
            return
        }

        if(width && height){
            this.ctx.drawImage(image, x, y, width, height)
        } else{
            this.ctx.drawImage(image, x, y)
        }
    }

    drawRect(x, y, width, height, strokeColor, lineWidth = 1){
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, width, height);
    }
}