export default class MeleeAttackComponent {
    constructor(damage, attackRate) {
        this.damage = damage
        this.attackRate = attackRate
        this.cooldown = 0
    }
}