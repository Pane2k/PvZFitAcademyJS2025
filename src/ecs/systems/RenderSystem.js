import Debug from "../../core/Debug.js"
export default class RenderSystem{
    constructor(renderer){
        this.renderer = renderer
        this.world = null
    }
    update(){
        const entitiesToRender = this.world.getEntitiesWithComponents('PositionComponent', 'SpriteComponent', 'RenderableComponent')
        for(const entityID of entitiesToRender){
            const pos = this.world.getComponent(entityID, 'PositionComponent')
            const sprite = this.world.getComponent(entityID, 'SpriteComponent')

            // Debug.log('Rendering entity:', entityID, 
            // 'Image:', sprite.image, 
            // `Image size: ${sprite.image.width}x${sprite.image.height}`,
            // 'Pos:', pos);

            if (sprite && sprite.image) {
                this.renderer.drawImage(sprite.image, pos.x, pos.y, pos.width, pos.height);
            }
            if (Debug.showHitboxes) {
                const hitbox = this.world.getComponent(entityID, 'HitboxComponent');
                if (hitbox) {
                    this.renderer.drawRect(
                        pos.x + hitbox.offsetX,
                        pos.y + hitbox.offsetY,
                        hitbox.width,
                        hitbox.height,
                        'rgba(255, 0, 0, 0.5)', // Красный для хитбоксов
                        2
                    );
                }
            }
            if (Debug.showInteractables) {
                const isCollectible = this.world.getComponent(entityID, 'CollectibleComponent');
                if (isCollectible) {
                    this.renderer.drawRect(
                        pos.x,
                        pos.y,
                        pos.width,
                        pos.height,
                        'rgba(0, 150, 255, 0.5)', // Синий для интерактивных
                        2
                    );
                }
            }
        
        }
    }
}