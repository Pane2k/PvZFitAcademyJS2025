import Debug from "../core/Debug.js"

export default class HUD {
    constructor(){
        this.sunCount = 50
        this.sunCounterX = 30
        this.sunCounterY = 50
        this.font = '32px Arial'
        this.fillStyle = 'white'
    }
    draw(renderer){
        const ctx = renderer.ctx
        ctx.save()

        ctx.font = this.font
        ctx.fillStyle = this.fillStyle
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const displayText = isNaN(this.sunCount) ? 0 : this.sunCount;
        const text = `Sun: ${this.sunCount}`
        ctx.fillText(text, this.sunCounterX, this.sunCounterY)
        ctx.restore()
    }

}