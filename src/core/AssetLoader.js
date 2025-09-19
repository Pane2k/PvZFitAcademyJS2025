import Debug from "./Debug.js";

export default class AssetLoader{
    constructor(){
        this.images = new Map()
        this.jsonFiles = new Map()
    }
    async loadJSON(key, path){
        try{
            const response = await fetch(path)
            if(!response.ok){
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const data = await response.json()
            this.jsonFiles.set(key, data)
            Debug.log(`JSON loaded: ${key}`)
            return data
        } catch(e){
            Debug.error(`Failed to load JSON: ${path}`, e)
            throw e 
        }

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
    getJSON(key){
        return this.jsonFiles.get(key)
    }
}