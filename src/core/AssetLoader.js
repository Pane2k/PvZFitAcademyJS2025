import Debug from "./Debug.js";

export default class AssetLoader{
    constructor(){
        this.images = new Map()
    }

    loadImage(key, path){
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () =>{
                this.images.set(key, img)
                Debug.log(`Image loaded: ${key}`)
                resolve(img)
            }
            img.onerror = (err) => {
                Debug.error(`Failed to load image: ${path}`)
                reject(err)
            }
            img.src = path
        })
    }
    getImage(key){
        return this.images.get(key)
    }
}