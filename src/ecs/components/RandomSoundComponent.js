// src/ecs/components/RandomSoundComponent.js
export default class RandomSoundComponent {
    constructor(baseKey, count, minInterval, maxInterval) {
        this.baseKey = baseKey;
        this.count = count;
        this.minInterval = minInterval;
        this.maxInterval = maxInterval;
        this.timer = this.getRandomInterval();
    }

    getRandomInterval() {
        return this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    }
}