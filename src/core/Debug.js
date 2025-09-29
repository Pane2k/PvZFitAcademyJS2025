export default class Debug{
    static isEnabled = true
    static showHitboxes = false
    static showInteractables = false
    static showHealthBars = false
    
    static enable(){
        this.isEnabled = true
        
        console.log('DEBUG MODE ENABLED!!!')
    }
    static disable(){
        this.isEnabled = false
    }

    static log(...args){
        if(this.isEnabled){
            console.log(...args)
        }
    }
    static warn(...args){
        if(this.isEnabled){
            console.warn(...args)
        }
    }
    static error(...args){
        console.error(...args)
    }
}