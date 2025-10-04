import Debug from "./Debug.js";

class SoundManager {
    constructor() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            
            this.musicGain.connect(this.audioContext.destination);
            this.sfxGain.connect(this.audioContext.destination);

            this.audioBuffers = new Map();
            this.currentMusicSource = null;
            this.isUnlocked = false;

            this.currentMusicVolume = 1.0;
            this.currentSfxVolume = 1.0; 
            
            // --- НОВЫЕ СВОЙСТВА ДЛЯ ПРЕРЫВАНИЯ ---
            this.fadeTimeoutId = null; // ID для setTimeout

            Debug.log("SoundManager initialized with Web Audio API.");
        } catch (e) {
            Debug.error("Web Audio API is not supported in this browser.", e);
            this.audioContext = null;
        }
    }

    // ... (unlockAudio, addSound, playSoundEffect, playRandomSound, playJingle, playMusic, stopMusic - БЕЗ ИЗМЕНЕНИЙ)
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
        source.connect(this.sfxGain);
        source.start(0);
    }

    playRandomSound(baseKey, count, volume = 1.0) {
        if (count <= 0) return;
        const randomIndex = Math.floor(Math.random() * count) + 1;
        const randomKey = `${baseKey}_${randomIndex}`;
        this.playSoundEffect(randomKey, volume);
    }

    playJingle(key) {
        if (!this.isUnlocked || !this.audioBuffers.has(key)) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers.get(key);
        source.connect(this.musicGain);
        source.start(0);
    }

    playMusic(key, loop = true) {
        if (!this.isUnlocked || !this.audioBuffers.has(key)) return;
        this.stopMusic();
        this.musicGain.gain.setValueAtTime(this.currentMusicVolume, this.audioContext.currentTime);
        this.currentMusicSource = this.audioContext.createBufferSource();
        this.currentMusicSource.buffer = this.audioBuffers.get(key);
        this.currentMusicSource.loop = loop;
        this.currentMusicSource.connect(this.musicGain);
        this.currentMusicSource.start(0);
    }

    stopMusic() {
        if (this.currentMusicSource) {
            try {
                this.currentMusicSource.stop();
            } catch(e) { /* Игнорируем */ }
            this.currentMusicSource.disconnect();
            this.currentMusicSource = null;
        }
    }

    // --- ОБНОВЛЁННЫЕ МЕТОДЫ ДЛЯ ПЛАВНОЙ ПАУЗЫ С ПРЕРЫВАНИЕМ ---

    /**
     * Прерывает любое текущее затухание.
     */
    _cancelCurrentFade() {
        if (this.fadeTimeoutId) {
            clearTimeout(this.fadeTimeoutId);
            this.fadeTimeoutId = null;
        }
        const now = this.audioContext.currentTime;
        // Отменяем все запланированные изменения громкости
        this.musicGain.gain.cancelScheduledValues(now);
        this.sfxGain.gain.cancelScheduledValues(now);
    }

    fadeOutAll(duration = 0.5) {
        if (!this.audioContext) return;
        
        this._cancelCurrentFade(); // Прерываем предыдущее затухание

        Debug.log(`Fading all audio out over ${duration}s.`);
        const fadeEndTime = this.audioContext.currentTime + duration;
        
        this.musicGain.gain.linearRampToValueAtTime(0.0, fadeEndTime);
        this.sfxGain.gain.linearRampToValueAtTime(0.0, fadeEndTime);

        this.fadeTimeoutId = setTimeout(() => { this.fadeTimeoutId = null; }, duration * 1000);
    }

    fadeInAll(duration = 0.5) {
        if (!this.audioContext) return;
        
        this._cancelCurrentFade(); // Прерываем предыдущее затухание (КЛЮЧЕВОЙ МОМЕНТ)

        Debug.log(`Fading all audio in over ${duration}s.`);
        const fadeEndTime = this.audioContext.currentTime + duration;

        this.musicGain.gain.linearRampToValueAtTime(this.currentMusicVolume, fadeEndTime);
        this.sfxGain.gain.linearRampToValueAtTime(this.currentSfxVolume, fadeEndTime);
        
        this.fadeTimeoutId = setTimeout(() => { this.fadeTimeoutId = null; }, duration * 1000);
    }

    // --- ОБНОВЛЁННЫЕ МЕТОДЫ УПРАВЛЕНИЯ ГРОМКОСТЬЮ (БЕЗ ИЗМЕНЕНИЙ) ---
    
    setMusicVolume(level) {
        if (!this.audioContext) return;
        this.currentMusicVolume = level;
        this.musicGain.gain.linearRampToValueAtTime(this.currentMusicVolume, this.audioContext.currentTime + 0.1);
    }

    setSfxVolume(level) {
        if (!this.audioContext) return;
        this.currentSfxVolume = level;
        this.sfxGain.gain.linearRampToValueAtTime(this.currentSfxVolume, this.audioContext.currentTime + 0.1);
    }
}

const soundManager = new SoundManager();
export default soundManager;