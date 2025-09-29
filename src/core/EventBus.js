import Debug from "./Debug.js"

class EventBus{
    constructor(){
        this.listeners = {}
    }
    subscribe(eventName, callback){
        if (!this.listeners[eventName]){
            this.listeners[eventName] = []
        }
        this.listeners[eventName].push(callback)
    }
    publish(eventName, data){
        if(!this.listeners[eventName]){
            return
        }
        if (eventName !== 'input:move') {
            Debug.log(`Event published: '${eventName}' with data:`, data);
        }
        // Debug.log(`Event published: '${eventName}' with data:`, data)
        this.listeners[eventName].forEach(callback => callback(data))
    }
}
const eventBus = new EventBus()
export default eventBus