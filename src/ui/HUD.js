import Debug from "../core/Debug.js"
import eventBus from "../core/EventBus.js"

export default class HUD {
    constructor(){
        this.sunCount = 50

        this.cardBackgroundImage = null;
        this.sunIconImage = null;
        this.plantCards = []; 
        this.cardFont = '18px Arial'; 
        this.uiPanel = {
            x: 0, y: 0, width: 0, height: 0,
            image: null
        };
        this.sunCounter = { x: 0, y: 0, icon: null, font: '28px Arial' };
        
        this.fillStyle = 'white'

        this.progress = { current: 0, total: 1 };
        this.progressBar = {
            x: 0, y: 0, width: 0, height: 0,
            image: null, flagImage: null, headImage: null,
            hugeWaveIndices: [],
            totalWaves: 0
        };

        // Подписываемся на событие прогресса
        eventBus.subscribe('wave:progress', (data) => {
            this.progress = data;
        });
        eventBus.subscribe('sun:collected', (data) => {
            this.sunCount += data.value;
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
        this.cardFont = `${Math.round(cardHeight * 0.22)}px Arial`;
        const cardSpacing = 10;
        const cardsTotalWidth = availablePlants.length * (cardWidth + cardSpacing);

        // Общая ширина панели = счетчик + карточки + отступы
        this.uiPanel.width = sunCounterWidth + cardsTotalWidth + 20;
        this.uiPanel.x = 10; // Небольшой отступ слева

        // 4. Расчет позиций элементов ВНУТРИ панели
        this.sunCounter.x = this.uiPanel.x + 25;
        this.sunCounter.y = this.uiPanel.y + panelHeight / 2;
        
        let currentX = this.uiPanel.x + sunCounterWidth;
        const cardY = this.uiPanel.y + (panelHeight - cardHeight) / 2;

        this.plantCards = [];
        for (const plantName of availablePlants) {
            const proto = plantPrototypes[plantName];
            if (!proto) continue;

            this.plantCards.push({
                name: plantName,
                cost: proto.cost,
                image: assetLoader.getImage(proto.components.SpriteComponent.assetKey),
                rect: { x: currentX, y: cardY, width: cardWidth, height: cardHeight }
            });
            currentX += cardWidth + cardSpacing;
        }

        this.progressBar.image = assetLoader.getImage('ui_progress_bar');
        this.progressBar.flagImage = assetLoader.getImage('ui_progress_flag');
        this.progressBar.headImage = assetLoader.getImage('ui_zombie_head');
        
        this.progressBar.height = virtualHeight * 0.05;
        this.progressBar.width = virtualWidth * 0.25;
        this.progressBar.x = virtualWidth - this.progressBar.width - 20; // Справа с отступом
        this.progressBar.y = virtualHeight - this.progressBar.height - 10; // Внизу с отступом
    }


    checkClick(x, y) {
        for (const card of this.plantCards) {
            if (x >= card.rect.x && x <= card.rect.x + card.rect.width &&
                y >= card.rect.y && y <= card.rect.y + card.rect.height) 
            {
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
            const textX = centerAreaX - 5; 

            // Рисуем текст с выравниванием по правому краю от новой точки
            renderer.drawText(
                costText,
                textX,
                bottomAreaY,
                this.cardFont,
                'black',
                'right', // <-- ВЫРАВНИВАНИЕ ПО ПРАВОМУ КРАЮ
                'middle'
            );

            // 4. Рисуем иконку солнца справа от текста
            if (this.sunIconImage) {
                const iconSize = 20;
                // Иконка теперь тоже привязана к центру, но со смещением вправо
                const iconX = centerAreaX - 2;
                const iconY = bottomAreaY - iconSize / 2;

                renderer.drawImage(this.sunIconImage, iconX, iconY, iconSize, iconSize);
            }
            
            // --- Восстанавливаем прозрачность ---
            ctx.restore();
            // ---

            // 5. Подсветка выбранной карточки
            if (canAfford && card.name === selectedPlantName) {
                renderer.drawRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height, 'lime', 3);
            }
            
            if (Debug.showInteractables) {
                renderer.drawRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height, 'rgba(0, 150, 255, 0.5)', 2);
            }
        }
    }

    drawProgressBar(renderer) {
        const pb = this.progressBar;
        if (!pb.image) return;

        // 1. Рисуем фон прогресс-бара
        renderer.drawImage(pb.image, pb.x, pb.y, pb.width, pb.height);
        
        // 2. Рисуем зеленую полосу прогресса (ИНВЕРТИРОВАННАЯ ЛОГИКА)
        const progressPercentage = this.progress.current / this.progress.total;
        const barInnerPadding = pb.width * 0.05; // Внутренний отступ фона
        const totalFillWidth = pb.width - barInnerPadding * 2;
        const barFillWidth = totalFillWidth * progressPercentage;
        
        // Рисуем от правого края к левому
        const pX = (pb.x + pb.width - barInnerPadding - barFillWidth) * renderer.scale + renderer.offsetX;
        const pY = (pb.y + pb.height * 0.2) * renderer.scale + renderer.offsetY;
        const pW = barFillWidth * renderer.scale;
        const pH = (pb.height * 0.6) * renderer.scale;
        
        renderer.ctx.fillStyle = '#6ab04c'; // Зеленый цвет
        renderer.ctx.fillRect(pX, pY, pW, pH);

        // 3. Рисуем флажки для "огромных волн" (ИНВЕРТИРОВАННАЯ ЛОГИКА)
        if (pb.flagImage && this.progress.totalWaves > 0) {
            const flagHeight = pb.height * 0.8;
            const flagWidth = flagHeight * (pb.flagImage.width / pb.flagImage.height);
            
            for (const waveIndex of this.progress.hugeWaveIndices) {
                // Считаем прогресс "наоборот"
                const flagProgress = 1 - ((waveIndex + 1) / this.progress.totalWaves);
                const flagX = pb.x + barInnerPadding + totalFillWidth * flagProgress;
                const flagY = pb.y - flagHeight * 0.8;
                renderer.drawImage(pb.flagImage, flagX, flagY, flagWidth, flagHeight);
            }
        }

        // 4. Рисуем голову зомби (ИНВЕРТИРОВАННАЯ ЛОГИКА)
        if (pb.headImage) {
            const headHeight = pb.height * 1.2;
            const headWidth = headHeight * (pb.headImage.width / pb.headImage.height);
            // Позиция головы теперь зависит от "незаполненной" части
            const headX = pb.x + pb.width - barInnerPadding - barFillWidth - headWidth / 2;
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