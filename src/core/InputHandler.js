import eventBus from "./EventBus.js";
import Debug from "./Debug.js";

export default class InputHandler{
    constructor(canvas){
        this.canvas = canvas
        this.setupListeners()
        this.setupKeyboardListeners();
        Debug.log('InputHandler initialized.')
    }
    setupListeners() {
        this.canvas.addEventListener('mousedown', (event) => {
            const pos = this.getCanvasCoordinates(event.clientX, event.clientY);
            eventBus.publish('input:click', pos);
        });

        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            eventBus.publish('input:click', pos);
        }, { passive: false });
    }
    setupKeyboardListeners() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            eventBus.publish('input:keydown', { key });

            // Переключение отладочных флагов
            if (key === 'o') {
                Debug.showHitboxes = !Debug.showHitboxes;
                Debug.log(`Debug Show Hitboxes: ${Debug.showHitboxes}`);
            }
            if (key === 'p') {
                Debug.showInteractables = !Debug.showInteractables;
                Debug.log(`Debug Show Interactables: ${Debug.showInteractables}`);
            }
        });
    }
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
}