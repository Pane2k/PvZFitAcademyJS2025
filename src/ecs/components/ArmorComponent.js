export default class ArmorComponent {
    constructor(config) {
        this.armorSlot = config.armorSlot;
        this.initialAttachment = config.initialAttachment;
        this.maxHealth = config.maxHealth;
        this.currentHealth = config.maxHealth;
        this.damageStates = config.damageStates || [];
        this.breakEffect = config.breakEffect;
        this.currentStateIndex = -1; 
    }
}