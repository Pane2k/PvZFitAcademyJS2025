import Debug from "../core/Debug.js";

const STORAGE_KEY = 'pvzFusionProgress';

class ProgressManager {
    constructor() {
        this.progress = this.loadProgress();
    }

    loadProgress() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const loadedProgress = JSON.parse(data);
                // --- VVV ИЗМЕНЕНИЕ: Обеспечиваем наличие настроек VVV ---
                const defaultProgress = this.getDefaultProgress();
                // Сливаем загруженный прогресс с дефолтным, чтобы новые поля (settings) появились
                const finalProgress = { ...defaultProgress, ...loadedProgress };
                finalProgress.settings = { ...defaultProgress.settings, ...(loadedProgress.settings || {}) };
                // --- ^^^ КОНЕЦ ИЗМЕНЕНИЯ ^^^
                Debug.log('Player progress loaded and merged with defaults.');
                return finalProgress;
            }
        } catch (e) {
            Debug.error('Failed to load progress from localStorage', e);
        }
        
        Debug.log('No saved progress found. Creating default progress.');
        return this.getDefaultProgress();
    }

    saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
            Debug.log('Progress saved.');
        } catch (e) {
            Debug.error('Failed to save progress to localStorage', e);
        }
    }

    resetProgress() {
        // 1. Сохраняем текущие настройки звука и другие.
        const currentSettings = this.progress.settings;

        // 2. Получаем чистый объект прогресса по умолчанию.
        this.progress = this.getDefaultProgress();

        // 3. Возвращаем сохраненные настройки в сброшенный объект.
        this.progress.settings = currentSettings;

        // 4. Сохраняем результат.
        this.saveProgress();
        Debug.log('Player GAME progress has been reset. Settings were preserved.');
    }
    
    // --- VVV НОВЫЕ МЕТОДЫ VVV ---
    getSetting(key) {
        return this.progress.settings[key];
    }

    setSetting(key, value) {
        if (this.progress.settings[key] !== value) {
            this.progress.settings[key] = value;
            this.saveProgress();
            Debug.log(`Setting '${key}' updated to '${value}'.`);
        }
    }
    // --- ^^^ КОНЕЦ НОВЫХ МЕТОДОВ ^^^ ---

    isLevelUnlocked(levelId) {
        return this.progress.unlockedLevels.includes(levelId);
    }

    unlockLevel(levelId) {
        if (!this.isLevelUnlocked(levelId)) {
            this.progress.unlockedLevels.push(levelId);
            this.saveProgress();
        }
    }

    getDefaultProgress() {
        return {
            unlockedLevels: [1],
            settings: {
                musicVolume: 0.5, // Стартовое значение
                sfxVolume: 0.8    // Стартовое значение
            }
        };
    }
    
    completeLevel(levelId) {
        const nextLevelId = levelId + 1;
        if (!this.isLevelUnlocked(nextLevelId)) {
            this.progress.unlockedLevels.push(nextLevelId);
            this.saveProgress();
            Debug.log(`Level ${nextLevelId} unlocked!`);
        } else {
            Debug.log(`Level ${nextLevelId} was already unlocked.`);
        }
    }
}

const progressManager = new ProgressManager();
export default progressManager;