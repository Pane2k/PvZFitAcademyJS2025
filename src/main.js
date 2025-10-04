// PvZFitAcademyJS2025/src/main.js

import Game from "./game/Game.js"
import Debug from "./core/Debug.js"

// Debug.disable()
Debug.log('PvZ Fussion: main.js Loaded successfully.')
window.debug = Debug

const game = new Game()
game.start().catch(err => Debug.error('Failed to start the game: ', err))
window.game = game

// --- VVV ДОБАВЬТЕ ВЕСЬ ЭТОТ КОД VVV ---

/**
 * Обработчик для полноэкранного режима на мобильных устройствах.
 */
function setupFullscreenHandler() {
    const promptElement = document.getElementById('fullscreen-prompt');
    const targetElement = document.documentElement; // Весь документ

    if (!promptElement) return;

    // Функция, которая проверяет, нужно ли показывать приглашение
    const checkOrientationAndFullscreen = () => {
        // Проверяем, что это мобильное устройство (по наличию touch событий)
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) return;

        const isLandscape = window.screen.orientation.type.includes('landscape');
        const isFullscreen = !!document.fullscreenElement;

        // Показываем приглашение, только если экран горизонтальный И мы НЕ в полноэкранном режиме
        if (isLandscape && !isFullscreen) {
            promptElement.classList.add('visible');
        } else {
            promptElement.classList.remove('visible');
        }
    };

    // Обработчик нажатия на приглашение
    const enterFullscreen = () => {
        if (targetElement.requestFullscreen) {
            targetElement.requestFullscreen().catch(err => {
                Debug.error(`Ошибка при входе в полноэкранный режим: ${err.message}`);
            });
        }
        promptElement.classList.remove('visible');
    };

    // Назначаем события
    promptElement.addEventListener('click', enterFullscreen);
    promptElement.addEventListener('touchstart', enterFullscreen); // Для iOS и других устройств

    // Слушаем изменение ориентации экрана
    window.screen.orientation.addEventListener('change', checkOrientationAndFullscreen);

    // Слушаем изменение состояния полноэкранного режима (например, если пользователь выйдет по кнопке Esc)
    document.addEventListener('fullscreenchange', checkOrientationAndFullscreen);

    // Проверяем состояние при первой загрузке
    checkOrientationAndFullscreen();

    Debug.log("Fullscreen handler initialized.");
}

// Запускаем наш обработчик после загрузки DOM
document.addEventListener('DOMContentLoaded', setupFullscreenHandler);
// --- ^^^ КОНЕЦ КОДА ^^^ ---