import Debug from "./Debug.js"

class EventBus {
    constructor() {
        this.listeners = {}
    }

    subscribe(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = []
        }
        this.listeners[eventName].push(callback);
    }

    unsubscribe(eventName, callbackToRemove) {
        if (!this.listeners[eventName]) {
            return;
        }
        this.listeners[eventName] = this.listeners[eventName].filter(
            callback => callback !== callbackToRemove
        );
    }

    publish(eventName, data) {
        if (!this.listeners[eventName]) {
            return;
        }
        if (eventName !== 'input:move') {
            Debug.log(`Event published: '${eventName}' with data:`, data);
        }
        this.listeners[eventName].forEach(callback => callback(data, eventName));
    }

    clear() {
        this.listeners = {};
        Debug.log("EventBus listeners cleared.");
    }
}

const eventBus = new EventBus();
export default eventBus;