import Debug from "./Debug.js";

export default class AssetLoader{
    constructor(){
        this.images = new Map()
        this.jsonFiles = new Map()
        this.audioBuffers = new Map();
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
    async loadAudio(key, path, audioContext) {
        if (!audioContext) {
            Debug.warn(`Cannot load audio "${key}", AudioContext not provided.`);
            return Promise.resolve();
        }
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(key, audioBuffer);
            Debug.log(`Audio loaded and decoded: ${key}`);
            return audioBuffer;
        } catch (e) {
            Debug.error(`Failed to load audio: ${path}`, e);
            throw e;
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
    getAudioBuffer(key) {
        return this.audioBuffers.get(key);
    }
}