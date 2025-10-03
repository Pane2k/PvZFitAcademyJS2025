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
                Debug.log('Player progress loaded from localStorage.');
                return JSON.parse(data);
            }
        } catch (e) {
            Debug.error('Failed to load progress from localStorage', e);
        }
        
        // Возвращаем прогресс по умолчанию, если ничего не найдено
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
        this.progress = this.getDefaultProgress();
        this.saveProgress();
        Debug.log('Player progress has been reset.');
    }

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
            unlockedLevels: [1], // По умолчанию доступен только 1-й уровень
            settings: {
                musicVolume: 0.8,
                sfxVolume: 1.0
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

// Экспортируем синглтон
const progressManager = new ProgressManager();
export default progressManager;