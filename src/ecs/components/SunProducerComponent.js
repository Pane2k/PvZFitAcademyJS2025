export default class SunProducerComponent {
    constructor(productionRate) {
        this.productionRate = productionRate; // в секундах
        this.timer = Math.random() * 5; // Небольшой случайный старт, чтобы не все производили одновременно
    }
}