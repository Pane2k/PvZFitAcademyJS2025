export default class SunProducerComponent {
    constructor(productionRate, sunValue) {
        this.productionRate = productionRate; // в секундах
        this.sunValue = sunValue;
        this.timer = Math.random() * 5; // Небольшой случайный старт, чтобы не все производили одновременно
    }
}