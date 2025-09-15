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

            Debug.log('Rendering entity:', entityID, 
            'Image:', sprite.image, 
            `Image size: ${sprite.image.width}x${sprite.image.height}`,
            'Pos:', pos);

            this.renderer.drawImage(sprite.image, pos.x, pos.y, pos.width, pos.height)
        }
    }
}