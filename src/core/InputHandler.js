import eventBus from "./EventBus.js";
import Debug from "./Debug.js";

export default class InputHandler{
    constructor(canvas, renderer){
        this.canvas = canvas
        this.renderer = renderer
        this.setupListeners()
        this.setupKeyboardListeners();
        Debug.log('InputHandler initialized.')
    }
    setupListeners() {
        this.canvas.addEventListener('mousedown', (event) => {
            const pos = this.getCanvasCoordinates(event.clientX, event.clientY);
            eventBus.publish('input:click', pos);
        });
        this.canvas.addEventListener('mousemove', (event) => {
            const pos = this.getCanvasCoordinates(event.clientX, event.clientY);
            eventBus.publish('input:move', pos);
        });

        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            eventBus.publish('input:click', pos);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            eventBus.publish('input:move', pos);
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
            if (key === 'u') {
                Debug.showHealthBars = !Debug.showHealthBars;
                Debug.log(`Debug Show Health Bars: ${Debug.showHealthBars}`);
            }
            if (key === 'n') {
                eventBus.publish('time:toggle_speed');
            }
        });
    }
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        
        // Координаты клика относительно холста
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

        // Обратное преобразование из экранных в виртуальные координаты
        const virtualX = (screenX - this.renderer.offsetX) / this.renderer.scale;
        const virtualY = (screenY - this.renderer.offsetY) / this.renderer.scale;

        return { x: virtualX, y: virtualY };
    }
}