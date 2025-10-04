export default class SunProducerComponent {
    constructor(productionRate) {
        this.productionRate = productionRate;
        this.timer = Math.random() * 5
    }
}