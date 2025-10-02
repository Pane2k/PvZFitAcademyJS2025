export default class LimbLossComponent {
    constructor(config) {
        this.threshold = config.threshold;
        this.slotsToHide = config.slotsToHide || []; // Теперь это массив
        this.slotToReplace = config.slotToReplace; 
        this.breakEffect = config.breakEffect;
        this.isLimbLost = false;
    }
}