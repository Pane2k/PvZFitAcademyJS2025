import Debug from "./Debug.js"

export default class GameLoop {
    constructor(update, render){
        this.update = update
        this.render = render

        this.isRunning = false
        this.lastTime = 0
        this.requestId = null
        this.timeScale = 1.0;
    }

    loop = (timestamp) => {
        if(!this.isRunning) return

        // Расчет deltaTime
        const currentTime = performance.now();

        let deltaTime = (currentTime - this.lastTime) / 1000;
        if (deltaTime > 1) {
            deltaTime = 1 / 60; 
        }
        this.lastTime = currentTime;
        const scaledDeltaTime = deltaTime * this.timeScale
        

        // Вызов обновления и отрисовка
        this.update(scaledDeltaTime)
        this.render()

        this.requestId = requestAnimationFrame(this.loop)
    }
    
    setTimeScale(scale) {
        this.timeScale = scale;
        Debug.log(`Game speed changed. Time scale: ${this.timeScale}`);
    }

    start(){
        if (this.isRunning) return

        this.isRunning = true
        this.lastTime = performance.now()
        this.requestId = requestAnimationFrame(this.loop)
        Debug.log('=== GameLoop started ===')
    }

    stop(){
        if (!this.isRunning) return

        this.isRunning = false
        if(this.requestId){
            cancelAnimationFrame(this.requestId)
            this.requestId = null
        }
        Debug.log('=== GameLoop stopped ===')
    }
}