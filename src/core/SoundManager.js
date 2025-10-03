// src/core/SoundManager.js
import Debug from "./Debug.js";

class SoundManager {
    constructor() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Гейны для раздельного контроля громкости
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            this.musicGain.connect(this.audioContext.destination);
            this.sfxGain.connect(this.audioContext.destination);

            this.audioBuffers = new Map();
            this.currentMusicSource = null;
            this.isUnlocked = false; // Флаг для разблокировки аудио после действия пользователя

            Debug.log("SoundManager initialized with Web Audio API.");
        } catch (e) {
            Debug.error("Web Audio API is not supported in this browser.", e);
            this.audioContext = null;
        }
    }

    /**
     * Браузеры требуют взаимодействия с пользователем для запуска аудио.
     * Этот метод нужно вызвать при первом клике.
     */
    unlockAudio() {
        if (!this.audioContext || this.isUnlocked) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.isUnlocked = true;
        Debug.log("AudioContext unlocked by user interaction.");
    }

    addSound(key, buffer) {
        if (!this.audioContext) return;
        this.audioBuffers.set(key, buffer);
    }

    playSoundEffect(key, volume = 1.0) {
        if (!this.isUnlocked || !this.audioBuffers.has(key)) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers.get(key);
        
        const sfxVolumeGain = this.audioContext.createGain();
        sfxVolumeGain.gain.value = volume;

        source.connect(sfxVolumeGain);
        sfxVolumeGain.connect(this.sfxGain); // Подключаем к общему гейну ЭФФЕКТОВ
        
        source.start(0);
    }
    playRandomSound(baseKey, count, volume = 1.0) {
        if (count <= 0) return;
        const randomIndex = Math.floor(Math.random() * count) + 1;
        const randomKey = `${baseKey}_${randomIndex}`;
        this.playSoundEffect(randomKey, volume);
    }
    // --- НОВЫЙ МЕТОД ---
    /**
     * Проигрывает короткий музыкальный фрагмент (джингл), не останавливая основную музыку.
     * Использует канал громкости музыки.
     */
    playJingle(key) {
        if (!this.isUnlocked || !this.audioBuffers.has(key)) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers.get(key);
        
        // НЕ СОЗДАЕМ ОТДЕЛЬНЫЙ ГЕЙН, чтобы громкость была 100% от музыкальной
        source.connect(this.musicGain); // Подключаем к общему гейну МУЗЫКИ
        
        source.start(0);
    }

    playMusic(key, loop = true) {
        if (!this.isUnlocked || !this.audioBuffers.has(key)) return;
        
        this.stopMusic();

        this.currentMusicSource = this.audioContext.createBufferSource();
        this.currentMusicSource.buffer = this.audioBuffers.get(key);
        this.currentMusicSource.loop = loop;
        this.currentMusicSource.connect(this.musicGain);
        this.currentMusicSource.start(0);
    }

    stopMusic() {
        if (this.currentMusicSource) {
            this.currentMusicSource.stop();
            this.currentMusicSource.disconnect();
            this.currentMusicSource = null;
        }
    }

    setMusicVolume(level) {
        if (!this.audioContext) return;
        this.musicGain.gain.setValueAtTime(level, this.audioContext.currentTime);
    }

    setSfxVolume(level) {
        if (!this.audioContext) return;
        this.sfxGain.gain.setValueAtTime(level, this.audioContext.currentTime);
    }
}

// Экспортируем синглтон
const soundManager = new SoundManager();
export default soundManager;