import BaseState from "./BaseState.js";

export default class WinState extends BaseState {
    constructor(game, gameplayState) { 
        super();
        this.game = game;
        this.gameplayState = gameplayState; 
    }

    render() {
        if (this.gameplayState) {
            this.gameplayState.render();
        }

        const renderer = this.game.renderer;
        const ctx = renderer.ctx;

        // Полупрозрачный оверлей
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);

        // Текст
        const physicalCenterX = renderer.canvas.width / 2;
        const physicalCenterY = renderer.canvas.height / 2;

        ctx.font = "80px Arial";
        ctx.fillStyle = "lime";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("YOU WIN!", physicalCenterX, physicalCenterY);
    }
}