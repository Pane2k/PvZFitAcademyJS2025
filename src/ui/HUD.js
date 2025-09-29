import Debug from "../core/Debug.js"
import eventBus from "../core/EventBus.js"

export default class HUD {
    constructor(){
        this.sunCount = 50

        this.cardBackgroundImage = null;
        this.sunIconImage = null;
        this.plantCards = []; 
        this.cardFont = '16px Arial'; 
        this.uiPanel = {
            x: 0, y: 0, width: 0, height: 0,
            image: null
        };
        this.sunCounter = { x: 0, y: 0, icon: null, font: '28px Arial' };
        
        this.fillStyle = 'white'

        this.progress = { current: 0, total: 1 };
        this.visualProgress = 0;
        this.progressBar = {
            x: 0, y: 0, width: 0, height: 0,
            image: null, flagImage: null, headImage: null,
            hugeWaveIndices: [],
            totalWaves: 0
        };
        this.progressFlags = []; // <-- Для хранения состояния флажков
        this.announcement = { // <-- Для хранения состояния объявления
            text: "A Huge Wave is Approaching!",
            alpha: 0,
            timer: 0,
            state: 'idle', // 'idle', 'fading_in', 'holding', 'fading_out'
            FADE_TIME: 1.0,
            HOLD_TIME: 2.0
        };


        // Подписываемся на событие прогресса
        eventBus.subscribe('wave:progress', (data) => {
            this.progress = data;
            // "Ленивая" инициализация флажков при получении первых данных
            if (this.progressFlags.length === 0 && data.hugeWaveIndices.length > 0) {
                this._initializeFlags(data);
            }
        });
        eventBus.subscribe('sun:collected', (data) => {
            this.sunCount += data.value;
        });
        eventBus.subscribe('sun:spent', (data) => {
            this.sunCount -= data.value;
        });
        eventBus.subscribe('hud:show_huge_wave_announcement', () => {
            this.announcement.state = 'fading_in';
            this.announcement.timer = 0;
        });
    }
    initialize(plantPrototypes, availablePlants, assetLoader, virtualWidth, virtualHeight) {
        

        this.uiPanel.image = assetLoader.getImage('ui_panel');
        this.sunCounter.icon = assetLoader.getImage('sun');
        this.cardBackgroundImage = assetLoader.getImage('card_background'); // <-- Добавить
        this.sunIconImage = assetLoader.getImage('sun_icon');

        const panelHeight = 110;
        this.uiPanel.height = panelHeight;
        this.uiPanel.y = 0; // Прижимаем к верху

        // 2. Настройка счетчика солнца
        const sunCounterWidth = 100;
        this.sunCounter.font = `${Math.round(panelHeight * 0.28)}px Arial`;
        
        // 3. Настройка карточек
        const cardWidth = 75;
        const cardHeight = 90;
        this.cardFont = `${Math.round(cardHeight * 0.17)}px Arial`;
        const cardSpacing = 10;
        const cardsTotalWidth = availablePlants.length * (cardWidth + cardSpacing);

        // Общая ширина панели = счетчик + карточки + отступы
        this.uiPanel.width = sunCounterWidth + cardsTotalWidth + 20;
        this.uiPanel.x = 10; // Небольшой отступ слева

        // 4. Расчет позиций элементов ВНУТРИ панели
        this.sunCounter.x = this.uiPanel.x + 50;
        this.sunCounter.y = this.uiPanel.y + panelHeight / 2 + 15;
        
        let currentX = this.uiPanel.x + sunCounterWidth;
        const cardY = this.uiPanel.y + (panelHeight - cardHeight) / 2;

        this.plantCards = [];
        for (const plantName of availablePlants) {
            const proto = plantPrototypes[plantName];
            if (!proto) continue;

            this.plantCards.push({
                name: plantName,
                cost: proto.cost,
                maxCooldown: proto.cooldown || 5.0,
                cooldownTimer: 0,
                image: assetLoader.getImage(proto.components.SpriteComponent.assetKey),
                rect: { x: currentX, y: cardY, width: cardWidth, height: cardHeight }
            });
            currentX += cardWidth + cardSpacing;
        }

        // Расчеты ProgressBar
        this.progressBar.image = assetLoader.getImage('ui_progress_bar');
        this.progressBar.flagImage = assetLoader.getImage('ui_progress_flag');
        this.progressBar.headImage = assetLoader.getImage('ui_zombie_head');
        
        this.progressBar.height = virtualHeight * 0.05;
        this.progressBar.width = virtualWidth * 0.25;
        this.progressBar.x = virtualWidth - this.progressBar.width - 20; // Справа с отступом
        this.progressBar.y = virtualHeight - this.progressBar.height - 10; // Внизу с отступом

        this.progressFlags = [];
        const hugeWaveIndices = this.progress.hugeWaveIndices || [];
        const totalWaves = this.progress.totalWaves || 1;

        const flagRestingY = this.progressBar.y - this.progressBar.height * 0.4;
        
        for (const waveIndex of hugeWaveIndices) {
            this.progressFlags.push({
                progress: (waveIndex + 1) / totalWaves,
                state: 'resting', // 'resting', 'raising', 'raised'
                currentY: flagRestingY,
                restingY: flagRestingY,
                raisedY: this.progressBar.y - this.progressBar.height * 0.8,
            });
        }
    }
    _initializeFlags(waveData) {
        this.progressFlags = [];
        const totalWaves = waveData.totalWaves || 1;

        // Y-координата флажка, когда он "лежит" на прогресс-баре
        const flagRestingY = this.progressBar.y + (this.progressBar.height - (this.progressBar.height * 0.8)) / 2;
        // Y-координата, когда он поднят
        const flagRaisedY = this.progressBar.y - this.progressBar.height * 0.8;

        for (const waveIndex of waveData.hugeWaveIndices) {
            this.progressFlags.push({
                // Прогресс, на котором флажок должен подняться
                triggerProgress: (waveIndex + 1) / totalWaves,
                state: 'resting', // 'resting', 'raising', 'raised'
                currentY: flagRestingY,
                raisedY: flagRaisedY,
            });
        }
        Debug.log('Progress flags initialized:', this.progressFlags);
    }

    update(deltaTime) {
        // 1. Обновление таймеров перезарядки карточек
        for (const card of this.plantCards) {
            if (card.cooldownTimer > 0) {
                card.cooldownTimer -= deltaTime;
                if (card.cooldownTimer < 0) {
                    card.cooldownTimer = 0;
                }
            }
        }

        // --- 2. ВОТ ЭТОТ БЛОК ОТСУТСТВОВАЛ: ПЛАВНОЕ ОБНОВЛЕНИЕ ПРОГРЕСС-БАРА ---
        if (this.progress.total > 0) {
            const LERP_FACTOR = 0.05;
            const targetProgress = this.progress.current;
            const difference = targetProgress - this.visualProgress;
            
            this.visualProgress += difference * LERP_FACTOR;

            if (Math.abs(difference) < 0.1) {
                this.visualProgress = targetProgress;
            }
        }
        // --- КОНЕЦ БЛОКА ---
        
        // 3. Обновление анимации объявления
        const ann = this.announcement;
        if (ann.state !== 'idle') {
            ann.timer += deltaTime;
            if (ann.state === 'fading_in') {
                ann.alpha = Math.min(1, ann.timer / ann.FADE_TIME);
                if (ann.timer >= ann.FADE_TIME) {
                    ann.state = 'holding';
                    ann.timer = 0;
                }
            } else if (ann.state === 'holding') {
                if (ann.timer >= ann.HOLD_TIME) {
                    ann.state = 'fading_out';
                    ann.timer = 0;
                }
            } else if (ann.state === 'fading_out') {
                ann.alpha = Math.max(0, 1 - (ann.timer / ann.FADE_TIME));
                if (ann.timer >= ann.FADE_TIME) {
                    ann.state = 'idle';
                }
            }
        }

        // 4. Обновление анимации флажков
        if (this.progress.total > 0) {
            const currentProgressPercentage = this.visualProgress / this.progress.total;
            for (const flag of this.progressFlags) {
                // Условие подъема: когда реальный прогресс ПЕРЕСЕК точку срабатывания
                if (flag.state === 'resting' && (this.progress.current / this.progress.total) >= flag.triggerProgress) {
                    flag.state = 'raising';
                }
                
                // Анимация подъема
                if (flag.state === 'raising') {
                    const diff = flag.raisedY - flag.currentY;
                    flag.currentY += diff * 0.05; // lerp
                    if (Math.abs(diff) < 1) {
                        flag.currentY = flag.raisedY;
                        flag.state = 'raised';
                    }
                }
            }
        }
    }
    startCooldown(plantName) {
        const card = this.plantCards.find(c => c.name === plantName);
        if (card) {
            card.cooldownTimer = card.maxCooldown;
            Debug.log(`Cooldown started for ${plantName} (${card.maxCooldown}s).`);
        }
    }

    checkClick(x, y) {
        for (const card of this.plantCards) {
            if (x >= card.rect.x && x <= card.rect.x + card.rect.width &&
                y >= card.rect.y && y <= card.rect.y + card.rect.height) 
            {
                if (card.cooldownTimer > 0) {
                    Debug.log(`Card ${card.name} is on cooldown.`);
                    return null;
                }
                Debug.log(`Clicked on plant card: ${card.name}`);
                return card.name;
            }
        }
        return null;
    }
    

    draw(renderer, selectedPlantName = null) {
        // 1. Отрисовка главной панели
        if (this.uiPanel.image) {
            renderer.drawImage(this.uiPanel.image, this.uiPanel.x, this.uiPanel.y, this.uiPanel.width, this.uiPanel.height);
        }

        // 2. Отрисовка счетчика солнца
        this.drawSunCounter(renderer);

        // 3. Отрисовка карточек
        this.drawPlantCards(renderer, selectedPlantName);

        // 4. Отрисовка прогресс-бара
        this.drawProgressBar(renderer);

        // 5. Отрисовка объявления 
        this.drawAnnouncement(renderer);
    }
    drawAnnouncement(renderer) {
        if (this.announcement.state === 'idle') return;

        const ctx = renderer.ctx;
        ctx.save();
        
        ctx.globalAlpha = this.announcement.alpha;
        const text = this.announcement.text;
        const x = renderer.VIRTUAL_WIDTH / 2;
        const y = renderer.VIRTUAL_HEIGHT / 2;
        const font = `${Math.round(renderer.VIRTUAL_HEIGHT * 0.08)}px Arial`;
        
        renderer.drawText(text, x, y, font, '#FF4D4D', 'center', 'middle');

        ctx.restore();
    }
    drawSunCounter(renderer) {
        const ctx = renderer.ctx;
        ctx.save();
        
        // Иконка
        if (this.sunCounter.icon) {
            const iconSize = 50;
            renderer.drawImage(this.sunCounter.icon, this.sunCounter.x - iconSize/2, this.sunCounter.y - iconSize - 5, iconSize, iconSize);
        }

        

        // Текст
        const text = `${this.sunCount}`;
        const textY = this.sunCounter.y + 15;
        renderer.drawText(
            text, 
            this.sunCounter.x, 
            textY, 
            this.sunCounter.font, 
            'black', 
            'center', 
            'middle'
        );

        
    }
    drawPlantCards(renderer, selectedPlantName) {
        for (const card of this.plantCards) {
            const canAfford = this.sunCount >= card.cost;
            const isOnCooldown = card.cooldownTimer > 0;
            const alpha = canAfford ? 1.0 : 0.6; // Используем alpha в renderer'е, если понадобится

            // 1. Рисуем фон карточки
            if (this.cardBackgroundImage) {
                renderer.drawImage(this.cardBackgroundImage, card.rect.x, card.rect.y, card.rect.width, card.rect.height);
            }

            // --- Временно получаем доступ к ctx для установки прозрачности ---
            const ctx = renderer.ctx;
            ctx.save();
            ctx.globalAlpha = alpha;
            // ---

            // 2. Рисуем изображение растения
            if (card.image) {
                const imgPaddingX = card.rect.width * 0.1;
                const imgPaddingY = card.rect.height * 0.05;
                const imgAreaHeight = card.rect.height * 0.7;

                renderer.drawImage(
                    card.image, 
                    card.rect.x + imgPaddingX, 
                    card.rect.y + imgPaddingY, 
                    card.rect.width - imgPaddingX * 2, 
                    imgAreaHeight
                );
            }

            // 3. РАСЧЕТ ПОЗИЦИЙ ДЛЯ ТЕКСТА И ИКОНКИ (Новая логика)
            const costText = `${card.cost}`;
            const bottomAreaY = card.rect.y + card.rect.height * 0.88; // Вертикальный центр для нижней зоны
            const centerAreaX = card.rect.x + card.rect.width / 2;    // Горизонтальный центр карточки

            // Сдвигаем текст немного влево от центра
            const textX = centerAreaX -2; 
            const textY = bottomAreaY + 1
            // Рисуем текст с выравниванием по правому краю от новой точки
            renderer.drawText(
                costText,
                textX,
                textY,
                this.cardFont,
                'black',
                'center', // <-- ВЫРАВНИВАНИЕ ПО ПРАВОМУ КРАЮ
                'middle'
            );

            // 4. Рисуем иконку солнца справа от текста
            if (this.sunIconImage) {
                const iconSize = 20;
                // Иконка теперь тоже привязана к центру, но со смещением вправо
                const iconX = centerAreaX + 15;
                const iconY = bottomAreaY - iconSize / 2;

                renderer.drawImage(this.sunIconImage, iconX, iconY, iconSize, iconSize);
            }
            
            // --- Восстанавливаем прозрачность ---
            ctx.restore();
            // ---

            // 5. Подсветка выбранной карточки
            if (isOnCooldown) {
                const progress = card.cooldownTimer / card.maxCooldown;
                const overlayHeight = card.rect.height * progress;

                const pRect = { // Физические координаты
                    x: card.rect.x * renderer.scale + renderer.offsetX,
                    y: card.rect.y * renderer.scale + renderer.offsetY,
                    w: card.rect.width * renderer.scale,
                    h: card.rect.height * renderer.scale
                };
                const pOverlayHeight = overlayHeight * renderer.scale;

                const ctx = renderer.ctx;
                ctx.save();
                
                // Создаем градиент для "занавеса"
                const gradient = ctx.createLinearGradient(pRect.x, pRect.y, pRect.x, pRect.y + pOverlayHeight);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)'); // Темный сверху
                gradient.addColorStop(1, 'rgba(50, 50, 50, 0.5)'); // Светлее снизу

                ctx.fillStyle = gradient;
                // Рисуем "занавес" снизу вверх
                ctx.fillRect(pRect.x, pRect.y, pRect.w, pOverlayHeight);

                ctx.restore();
            }
            // --- КОНЕЦ НОВОЙ ЛОГИКИ ---

            // Подсветка (только если доступна)
            if (canAfford && !isOnCooldown && card.name === selectedPlantName) {
                renderer.drawRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height, 'lime', 3);
            }
            
            if (Debug.showInteractables) {
                renderer.drawRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height, 'rgba(0, 150, 255, 0.5)', 2);
            }
        }
    }

    drawProgressBar(renderer) {
        const pb = this.progressBar;
        if (!pb.image || !this.progress.total) return;

        // 1. Рисуем фон
        renderer.drawImage(pb.image, pb.x, pb.y, pb.width, pb.height);
        
        // --- ОБЩИЕ ПАРАМЕТРЫ ДЛЯ АНИМАЦИИ ---
        const barInnerPadding = pb.width * 0.05;
        const totalFillableWidth = pb.width - barInnerPadding * 2;
        const progressPercentage = this.visualProgress / this.progress.total;

        // 2. Рисуем зеленую полосу прогресса
        const barFillWidth = totalFillableWidth * progressPercentage;
        
        const pX = (pb.x + pb.width - barInnerPadding - barFillWidth) * renderer.scale + renderer.offsetX;
        const pY = (pb.y + pb.height * 0.2) * renderer.scale + renderer.offsetY;
        const pW = barFillWidth * renderer.scale;
        const pH = (pb.height * 0.6) * renderer.scale;
        
        renderer.ctx.fillStyle = '#6ab04c';
        renderer.ctx.fillRect(pX, pY, pW, pH);

        // 3. Рисуем флажки (статичны, без изменений)
        if (pb.flagImage) {
            const flagHeight = pb.height * 0.8;
            const flagWidth = flagHeight * (pb.flagImage.width / pb.flagImage.height);
            const barInnerPadding = pb.width * 0.05;
            const totalFillableWidth = pb.width - barInnerPadding * 2;
            
            for (const flag of this.progressFlags) {
                // X-позиция флажка теперь постоянна
                const flagX = (pb.x + pb.width - barInnerPadding) - (totalFillableWidth * flag.triggerProgress) - (flagWidth / 2);
                renderer.drawImage(pb.flagImage, flagX, flag.currentY, flagWidth, flagHeight);
            }
        }

        // 4. Рисуем голову зомби
        if (pb.headImage) {
            const headHeight = pb.height * 1.2;
            const headWidth = headHeight * (pb.headImage.width / pb.headImage.height);
            
            // --- ИСПРАВЛЕННЫЙ РАСЧЕТ ПОЗИЦИИ ГОЛОВЫ ---
            // Позиция головы теперь напрямую зависит от процента прогресса, а не от ширины полосы
            const headX = (pb.x + pb.width - barInnerPadding) - (totalFillableWidth * progressPercentage) - (headWidth / 2);
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

            const headY = pb.y + (pb.height - headHeight) / 2;
            renderer.drawImage(pb.headImage, headX, headY, headWidth, headHeight);
        }
    }
    getSunCounterPosition() {
        // Координаты центра иконки
        return { 
            x: this.sunCounter.x, 
            y: this.sunCounter.y - 25 // Иконка находится выше текста
        };
    }

}