import Game from "./game/Game.js"
import Debug from "./core/Debug.js"

Debug.log('PvZ Fussion: main.js Loaded successfully.')
window.debug = Debug

const game = new Game()
game.start().catch(err => Debug.error('Failed to start the game: ', err))
window.game = game

function setupFullscreenHandler() {
    const promptElement = document.getElementById('fullscreen-prompt');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
        Debug.log("iOS detected. Fullscreen prompt is disabled.");
        return; 
    }
    const targetElement = document.documentElement; 

    if (!promptElement) return;

    const checkOrientationAndFullscreen = () => {
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) return;

        const isLandscape = window.screen.orientation.type.includes('landscape');
        const isFullscreen = !!document.fullscreenElement;

        if (isLandscape && !isFullscreen) {
            promptElement.classList.add('visible');
        } else {
            promptElement.classList.remove('visible');
        }
    };

    const enterFullscreen = () => {
        if (targetElement.requestFullscreen) {
            targetElement.requestFullscreen().catch(err => {
                Debug.error(`Ошибка при входе в полноэкранный режим: ${err.message}`);
            });
        }
        promptElement.classList.remove('visible');
    };

    promptElement.addEventListener('click', enterFullscreen);
    promptElement.addEventListener('touchstart', enterFullscreen); 

    window.screen.orientation.addEventListener('change', checkOrientationAndFullscreen);

    document.addEventListener('fullscreenchange', checkOrientationAndFullscreen);

    checkOrientationAndFullscreen();

    Debug.log("Fullscreen handler initialized.");
}

document.addEventListener('DOMContentLoaded', setupFullscreenHandler);