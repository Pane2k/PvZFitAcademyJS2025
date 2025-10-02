export default class SpriteComponent{
    constructor(image , region = null){
        this.image = image
        this.region = region; // region = { x, y, width, height } из атласа
    }
}