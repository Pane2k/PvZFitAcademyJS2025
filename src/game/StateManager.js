import Debug from "../core/Debug.js";

export default class StateManager{
    constructor(){
        this.currentState = null
    }
    changeState(newState){
        if(this.currentState && this.currentState.exit){
            this.currentState.exit()
        }
        this.currentState = newState
        Debug.log(`Changing state to ${newState.constructor.name}`)

        if (this.currentState.enter){
            this.currentState.enter()
        }
    }
    update(deltaTime){
        if(this.currentState && this.currentState.update){
            this.currentState.update(deltaTime)
        }
    }
    render(){
        if(this.currentState && this.currentState.render){
            this.currentState.render()
        }
    }
}