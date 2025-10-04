export default class LimbLossComponent {
    constructor(config) {
        this.threshold = config.threshold;
        this.slotsToHide = config.slotsToHide || [];
        this.slotToReplace = config.slotToReplace; 
        this.breakEffect = config.breakEffect;
        this.isLimbLost = false;
    }
}