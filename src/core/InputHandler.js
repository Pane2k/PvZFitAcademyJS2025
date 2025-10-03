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
            eventBus.publish('input:down', pos);
        });
        window.addEventListener('mouseup', (event) => {
            const pos = this.getCanvasCoordinates(event.clientX, event.clientY);
            eventBus.publish('input:up', pos);
        });
        this.canvas.addEventListener('mousemove', (event) => {
            const pos = this.getCanvasCoordinates(event.clientX, event.clientY);
            eventBus.publish('input:move', pos);
        });

        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            eventBus.publish('input:down', pos);
        }, { passive: false });
        
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: touchend теперь на CANVAS, а не на window ---
        this.canvas.addEventListener('touchend', (event) => {
            event.preventDefault(); // Добавлено для консистентности
            // touchend может не иметь координат, но само событие важно
            eventBus.publish('input:up', {}); 
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            const pos = this.getCanvasCoordinates(touch.clientX, touch.clientY);
            eventBus.publish('input:move', pos);
        }, { passive: false });
    }
    setupKeyboardListeners() {
        // ... (этот метод без изменений)
        window.addEventListener('keydown', (event) => {
            if (event.key === ' ') {
                event.preventDefault();
            }
            const key = event.key.toLowerCase();
            eventBus.publish('input:keydown', { key });

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
            if (key === 'l') {
                Debug.showSkeletons = !Debug.showSkeletons;
                Debug.log(`Debug Show Skeletons: ${Debug.showSkeletons}`);
            }
            if (key === 'n') {
                eventBus.publish('time:toggle_speed');
            }
        });
    }
    getCanvasCoordinates(clientX, clientY) {
        // ... (этот метод без изменений)
        const rect = this.canvas.getBoundingClientRect();
        
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;

        const virtualX = (screenX - this.renderer.offsetX) / this.renderer.scale;
        const virtualY = (screenY - this.renderer.offsetY) / this.renderer.scale;

        return { x: virtualX, y: virtualY };
    }
}