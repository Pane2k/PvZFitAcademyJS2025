// src/game/Game.js
import LoadingState from './states/LoadingState.js'
import GameLoop from '../core/GameLoop.js'
import Renderer from '../core/Renderer.js'
import AssetLoader from '../core/AssetLoader.js'

import World from '../ecs/World.js'
import InputHandler from '../core/InputHandler.js'

import StateManager from './StateManager.js'
import GameplayState from './states/GameplayState.js'
import TransitionManager from './TransitionManager.js'
import MainMenuState from './states/MainMenuState.js'
import soundManager from '../core/SoundManager.js';
import Factory from './Factory.js'
// Системы
import RenderSystem from '../ecs/systems/RenderSystem.js'

// Компоненты
import PositionComponent from '../ecs/components/PositionComponent.js'
import SpriteComponent from '../ecs/components/SpriteComponent.js'
import RenderableComponent from '../ecs/components/RenderableComponent.js'
import Debug from '../core/Debug.js'
import eventBus from '../core/EventBus.js'

export default class Game{
    constructor(){
        const VIRTUAL_WIDTH = 1280;
        const VIRTUAL_HEIGHT = 720;
        this.canvas = document.getElementById('game-canvas')
        this.renderer = new Renderer(this.canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT)
        this.assetLoader = new AssetLoader()
        this.world = new World()
        this.inputHandler = new InputHandler(this.canvas, this.renderer)
        this.stateManager = new StateManager()
        this.factory = null
        this.transitionManager = new TransitionManager(this.renderer);
        this.gameLoop = new GameLoop(this.update.bind(this), this.render.bind(this))
    }
     async start() {
        eventBus.subscribe('time:toggle_speed', () => {
            if (this.gameLoop.timeScale === 1.0) {
                this.gameLoop.setTimeScale(50.0);
            } else {
                this.gameLoop.setTimeScale(1.0);
            }
        });

        try {
            // Этап 1: Предзагрузка только фона для экрана загрузки
            const loadingBg = await this.preloadLoadingScreen();
            
            // Этап 2: Переход в состояние загрузки с уже готовым фоном
            this.stateManager.changeState(new LoadingState(this, loadingBg));
            
            this.gameLoop.start();

        } catch (error) {
            // Если даже фон загрузить не удалось, отображаем ошибку
            Debug.error("Critical error: Could not preload loading screen.", error);
            this.renderer.clear('black');
            this.renderer.drawText("Не удалось загрузить базовые ресурсы.", 640, 360, "30px Arial", "red", "center");
        }
    }
    async preloadLoadingScreen() {
        Debug.log('Preloading loading screen background...');
        return this.assetLoader.loadImage('bg_loading_screen', 'assets/images/bg_loading_screen.png');
    }
    async loadRestAssets(){
        Debug.log('Loading assets...')
        await Promise.all([
            this.assetLoader.loadImage('bg_main_menu', 'assets/images/bg_main_menu.png'),
            // --- НОВЫЙ АССЕТ ДЛЯ ФОНА ВЫБОРА УРОВНЯ ---
            this.assetLoader.loadImage('bg_level_select', 'assets/images/bg_level_select.png'), 
            this.assetLoader.loadImage('btn_start_idle', 'assets/images/btn_start_idle.png'),
            this.assetLoader.loadImage('btn_start_hover', 'assets/images/btn_start_hover.png'),
            this.assetLoader.loadImage('btn_start_pressed', 'assets/images/btn_start_pressed.png'),
            this.assetLoader.loadImage('btn_settings_idle', 'assets/images/btn_start_idle.png'),
            this.assetLoader.loadImage('btn_settings_hover', 'assets/images/btn_start_hover.png'),
            this.assetLoader.loadImage('btn_settings_pressed', 'assets/images/btn_start_pressed.png'),
            this.assetLoader.loadImage('btn_reset_idle', 'assets/images/btn_start_idle.png'),
            this.assetLoader.loadImage('btn_reset_hover', 'assets/images/btn_start_hover.png'),
            this.assetLoader.loadImage('btn_reset_pressed', 'assets/images/btn_start_pressed.png'),
            this.assetLoader.loadImage('level_card_unlocked', 'assets/images/level_card_unlocked.png'),
            this.assetLoader.loadImage('level_card_locked', 'assets/images/level_card_locked.png'),
            this.assetLoader.loadImage('lock_icon', 'assets/images/lock_icon.png'),
            this.assetLoader.loadImage('level_icon_1', 'assets/images/level_icon_1.png'),
            this.assetLoader.loadImage('level_icon_2', 'assets/images/level_icon_1.png'),
            this.assetLoader.loadImage('level_icon_3', 'assets/images/level_icon_1.png'),
            this.assetLoader.loadImage('level_icon_4', 'assets/images/level_icon_1.png'),
            this.assetLoader.loadImage('level_icon_5', 'assets/images/level_icon_1.png'),

            this.assetLoader.loadImage('ui_pause_panel', 'assets/images/ui_pause_panel.png'),
            this.assetLoader.loadImage('ui_dialog_panel', 'assets/images/ui_dialog_panel.png'),
            this.assetLoader.loadImage('ui_button_default', 'assets/images/ui_button_default.png'),
            this.assetLoader.loadImage('ui_slider_bg', 'assets/images/ui_slider_bg.png'),
            this.assetLoader.loadImage('ui_slider_handle', 'assets/images/ui_slider_handle.png'),

            this.assetLoader.loadImage('peashooter', 'assets/images/peashooter.png'),
            this.assetLoader.loadImage('sun', 'assets/images/sun.png'),
            this.assetLoader.loadImage('pea', 'assets/images/pea.png'),
            this.assetLoader.loadImage('sunflower', 'assets/images/sunflower.png'),
            this.assetLoader.loadImage('wallnut_full', 'assets/images/wallnut_full.png'),
            this.assetLoader.loadImage('wallnut_half', 'assets/images/wallnut_half.png'),
            this.assetLoader.loadImage('wallnut_low', 'assets/images/wallnut_low.png'),
            this.assetLoader.loadImage('repeater', 'assets/images/repeater.png'),
            this.assetLoader.loadImage('snow_pea', 'assets/images/snow_pea.png'),
            this.assetLoader.loadImage('snow_pea_projectile', 'assets/images/snow_pea_projectile.png'),
            this.assetLoader.loadImage('potato_mine_unarmed', 'assets/images/potato_mine_unarmed.png'),
            this.assetLoader.loadImage('potato_mine_armed', 'assets/images/potato_mine_armed.png'),
            
            this.assetLoader.loadImage('lawnmower', 'assets/images/lawnmower.png'),
            this.assetLoader.loadImage('trophy', 'assets/images/trophy.png'),
            
            // --- VVV ИЗМЕНЕНИЯ ЗДЕСЬ VVV ---
            this.assetLoader.loadJSON('zombie_ske', 'assets/animations/zombie/zombie_ske.json'),
            this.assetLoader.loadJSON('zombie_tex', 'assets/animations/zombie/zombie_tex.json'),
            this.assetLoader.loadImage('zombie_img', 'assets/animations/zombie/zombie_tex.png'),
            // --- ^^^ КОНЕЦ ИЗМЕНЕНИЙ ^^^ ---

            this.assetLoader.loadImage('ui_progress_bar', 'assets/images/progress_bar.png'),
            this.assetLoader.loadImage('ui_progress_flag', 'assets/images/progress_flag.png'),
            this.assetLoader.loadImage('ui_zombie_head', 'assets/images/zombie_head.png'),
            this.assetLoader.loadImage('ui_panel', 'assets/images/ui_panel.png'),

            this.assetLoader.loadImage('ui_dialog_panel', 'assets/images/ui_dialog_panel.png'),
            this.assetLoader.loadImage('ui_button_default', 'assets/images/ui_button_default.png'),
            this.assetLoader.loadImage('ui_slider_bg', 'assets/images/ui_slider_bg.png'),
            this.assetLoader.loadImage('ui_slider_handle', 'assets/images/ui_slider_handle.png'),
            // --- VVV ДОБАВИТЬ ЭТИ СТРОКИ VVV ---
            this.assetLoader.loadImage('icon_sound_0', 'assets/images/Sound_0.png'),
            this.assetLoader.loadImage('icon_sound_33', 'assets/images/Sound_33.png'),
            this.assetLoader.loadImage('icon_sound_66', 'assets/images/Sound_66.png'),
            this.assetLoader.loadImage('icon_sound_100', 'assets/images/Sound_100.png'),

            this.assetLoader.loadImage('card_background', 'assets/images/card_bg.png'),
            this.assetLoader.loadImage('sun_icon', 'assets/images/sun.png'),

            this.assetLoader.loadImage('bg_sky', 'assets/images/bg_sky.png'),
            this.assetLoader.loadImage('bg_lawn', 'assets/images/bg_lawn.png'),
            this.assetLoader.loadImage('bg_house', 'assets/images/bg_house.png'),
            this.assetLoader.loadImage('bg_bushes', 'assets/images/bg_bushes.png'),
            this.assetLoader.loadImage('bg_road', 'assets/images/bg_road.png'),

            this.assetLoader.loadJSON('entities', 'data/entities.json'),
            this.assetLoader.loadJSON('levels', 'data/levels.json'),

            // Музыкальные темы
            this.assetLoader.loadAudio('music_pregame', 'assets/sounds/pregame_theme.mp3', soundManager.audioContext),
            this.assetLoader.loadAudio('music_level_1', 'assets/sounds/main_theme.mp3', soundManager.audioContext),
            this.assetLoader.loadAudio('music_level_2', 'assets/sounds/theme_1.mp3', soundManager.audioContext),
            this.assetLoader.loadAudio('music_level_3', 'assets/sounds/theme_2.mp3', soundManager.audioContext),

            // Звуки UI
            this.assetLoader.loadAudio('ui_click', 'assets/sounds/ui_click.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('button_click', 'assets/sounds/button_click.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('pause', 'assets/sounds/pause.ogg', soundManager.audioContext),
            this.assetLoader.loadAudio('seedlift', 'assets/sounds/seedlift.wav', soundManager.audioContext),

            // Звуки Игрового процесса
            this.assetLoader.loadAudio('sun_collect', 'assets/sounds/sun_collect.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('plant_1', 'assets/sounds/plant.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('plant_2', 'assets/sounds/plant2.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('pea_hit_1', 'assets/sounds/pea_hit1.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('pea_hit_2', 'assets/sounds/pea_hit2.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('chomp_1', 'assets/sounds/chomp.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('chomp_2', 'assets/sounds/chomp2.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('chomp_soft', 'assets/sounds/chompsoft.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('bigchomp', 'assets/sounds/bigchomp.ogg', soundManager.audioContext), // Для будущих сильных атак
            this.assetLoader.loadAudio('gulp', 'assets/sounds/gulp.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('throw_1', 'assets/sounds/throw.ogg', soundManager.audioContext), // Для катапульт
            this.assetLoader.loadAudio('throw_2', 'assets/sounds/throw2.ogg', soundManager.audioContext),

            // Звуки Зомби
            this.assetLoader.loadAudio('zombie_groan_1', 'assets/sounds/groan1.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_groan_2', 'assets/sounds/groan2.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_groan_3', 'assets/sounds/groan3.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_groan_4', 'assets/sounds/groan4.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_groan_5', 'assets/sounds/groan5.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_groan_6', 'assets/sounds/groan6.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_falling_1', 'assets/sounds/zombie_falling_1.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('zombie_falling_2', 'assets/sounds/zombie_falling_2.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('shield_hit_1', 'assets/sounds/plastichit.ogg', soundManager.audioContext),
            this.assetLoader.loadAudio('shield_hit_2', 'assets/sounds/plastichit2.ogg', soundManager.audioContext),
            this.assetLoader.loadAudio('shield_hit_metal', 'assets/sounds/shieldhit.wav', soundManager.audioContext), // Для ведра
            this.assetLoader.loadAudio('shield_hit_metal2', 'assets/sounds/shieldhit2.ogg', soundManager.audioContext),
            // Звуки Событий
            this.assetLoader.loadAudio('lawnmower', 'assets/sounds/lawnmower.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('explosion', 'assets/sounds/explosion.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('potato_mine', 'assets/sounds/potato_mine.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('siren', 'assets/sounds/siren.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('huge_wave', 'assets/sounds/hugewave.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('awooga', 'assets/sounds/awooga.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('buzzer', 'assets/sounds/buzzer.ogg', soundManager.audioContext), // Для будущих событий
            this.assetLoader.loadAudio('lose_scream', 'assets/sounds/scream.ogg', soundManager.audioContext), // Для будущих событий
            this.assetLoader.loadAudio('pea_shoot', 'assets/sounds/throw.ogg', soundManager.audioContext), // Используем throw.ogg для выстрела
            this.assetLoader.loadAudio('error_buzz', 'assets/sounds/buzzer.ogg', soundManager.audioContext),
            this.assetLoader.loadAudio('ready_set_plant', 'assets/sounds/readysetplant.ogg', soundManager.audioContext),
            
            // Джинглы
            this.assetLoader.loadAudio('win_jingle', 'assets/sounds/win_jingle.wav', soundManager.audioContext),
            this.assetLoader.loadAudio('lose_jingle', 'assets/sounds/lose_jingle.wav', soundManager.audioContext),
            
        ])
        
        Debug.log('Assets loaded.')
    }

    update(deltaTime){
        this.stateManager.update(deltaTime)
        this.transitionManager.update(deltaTime);
    }
    render(){
        this.stateManager.render()
        this.transitionManager.render();
    }
}