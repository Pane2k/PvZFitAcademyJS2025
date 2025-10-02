export default class AnimationSystem {
    constructor() {
        this.world = null;
    }

    update(deltaTime) {
        const entities = this.world.getEntitiesWithComponents('DragonBonesComponent', 'PrefabComponent');

        for (const entityId of entities) {
            const dbComp = this.world.getComponent(entityId, 'DragonBonesComponent');
            const prefab = this.world.getComponent(entityId, 'PrefabComponent');
            
            const isDying = this.world.getComponent(entityId, 'DyingComponent');
            const isAttacking = this.world.getComponent(entityId, 'AttackingComponent');
            const hasFlag = this.world.getComponent(entityId, 'FlagComponent');
            
            let animationName;
            let loop; // --- VVV ИЗМЕНЕНИЕ: Убираем значение по умолчанию VVV ---

            const proto = this.world.factory.prototypes[prefab.name];
            const flagOverrides = proto?.components?.FlagComponent?.animationOverrides;

            if (isDying) {
                animationName = 'dying';
                loop = false; // <-- Четко указываем, что смерть не зациклена
            } else if (isAttacking) {
                loop = true; // <-- Атака всегда зациклена
                if (hasFlag && flagOverrides?.attack) {
                    animationName = flagOverrides.attack;
                } else {
                    animationName = 'attack';
                }
            } else { // Is walking or idle
                loop = true; // <-- Ходьба всегда зациклена
                if (hasFlag && flagOverrides?.walk) {
                    animationName = flagOverrides.walk;
                } else {
                    animationName = 'walk';
                }
            }

            if (dbComp.armature && !dbComp.armature.animations.animations[animationName]) {
                 if (animationName.includes('attack')) animationName = 'attack';
                 else if (animationName.includes('walk')) animationName = 'walk';
            }
            
            if (animationName) {
                dbComp.playAnimation(animationName, loop);
            }
        }
    }
}