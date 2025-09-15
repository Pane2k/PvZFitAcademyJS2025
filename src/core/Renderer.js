import Debug from "./Debug.js";

export default class Renderer{
    constructor(canvas){
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        
        this.resize()
        window.addEventListener('resize', () => this.resize())
        Debug.log('Renderer initialized.')
    }

    resize = () => {
        this.canvas.width = this.canvas.clientWidth
        this.canvas.height = this.canvas.clientHeight
        Debug.log(`Canvas resized to ${this.canvas.width}x ${this.canvas.height}`)
    }

    clear(color = 'black'){
        this.ctx.fillStyle = color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    drawImage(image, x, y, width, height){
        if(width && height){
            this.ctx.drawImage(image, x, y, width, height)
        } else{
            this.ctx.drawImage(image, x, y)
        }
    }

    drawRect(x, y, width, height, color){
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, width, height)
    }
}