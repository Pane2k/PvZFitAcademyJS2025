import Debug from "../core/Debug.js"
import eventBus from "../core/EventBus.js"
import soundManager from "../core/SoundManager.js";

export default class HUD {
    constructor(){
        this.sunCount = 50;
        this.cardBackgroundImage = null;
        this.sunIconImage = null;
        this.plantCards = []; 
        this.cardFont = '16px Arial'; 
        this.uiPanel = { x: 0, y: 0, width: 0, height: 0, image: null };
        this.sunCounter = { x: 0, y: 0, icon: null, font: '28px Arial' };
        this.fillStyle = 'white';
        this.introState = 'idle'; 
        this.introTimer = 0;
        this.introText = '';

        this.progress = { currentWave: 0, totalWaves: 1, hugeWaveIndices: [] };
        this.visualProgress = 0;
        this.progressBar = {
            x: 0, y: 0, width: 0, height: 0,
            image: null, flagImage: null, headImage: null
        };
        this.progressFlags = [];

        this.announcement = {
            text: "A Huge Wave is Approaching!",
            alpha: 0,
            timer: 0,
            state: 'idle', 
            FADE_TIME: 1.0,
            HOLD_TIME: 2.0
        };

        eventBus.subscribe('wave:progress', (data) => {
            this.progress = data;
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

    isIntroFinished() {
        return this.introState === 'finished';
    }

    startIntroSequence() {
        this.introState = 'ready';
        this.introTimer = 0.60;
        this.introText = 'READY?';
        soundManager.playSoundEffect('ready_set_plant');
        Debug.log("HUD: Intro sequence started.");
    }

    initialize(plantPrototypes, availablePlants, assetLoader, virtualWidth, virtualHeight) {
        this.uiPanel.image = assetLoader.getImage('ui_panel');
        this.sunCounter.icon = assetLoader.getImage('sun');
        this.cardBackgroundImage = assetLoader.getImage('card_background');
        this.sunIconImage = assetLoader.getImage('sun_icon');

        const panelHeight = 110;
        this.uiPanel.height = panelHeight;
        this.uiPanel.y = 0;

        const sunCounterWidth = 100;
        this.sunCounter.font = `${Math.round(panelHeight * 0.28)}px Arial`;
        
        const cardWidth = 75;
        const cardHeight = 90;
        this.cardFont = `${Math.round(cardHeight * 0.17)}px Arial`;
        const cardSpacing = 10;
        const cardsTotalWidth = availablePlants.length * (cardWidth + cardSpacing);

        this.uiPanel.width = sunCounterWidth + cardsTotalWidth + 20;
        this.uiPanel.x = 10;

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

        this.progressBar.image = assetLoader.getImage('ui_progress_bar');
        this.progressBar.flagImage = assetLoader.getImage('ui_progress_flag');
        this.progressBar.headImage = assetLoader.getImage('ui_zombie_head');
        
        this.progressBar.height = virtualHeight * 0.05;
        this.progressBar.width = virtualWidth * 0.25;
        this.progressBar.x = virtualWidth - this.progressBar.width - 20;
        this.progressBar.y = virtualHeight - this.progressBar.height - 10;

        this.progressFlags = [];
    }

    _initializeFlags() {
        const totalWaves = this.progress.totalWaves || 1;
        const hugeWaveIndices = this.progress.hugeWaveIndices || [];

        const flagRestingY = this.progressBar.y - this.progressBar.height * 0.4;
        const flagRaisedY = this.progressBar.y - this.progressBar.height * 0.8;

        for (const waveIndex of hugeWaveIndices) {
            this.progressFlags.push({
                triggerWaveIndex: waveIndex,
                state: 'resting',
                currentY: flagRestingY,
                raisedY: flagRaisedY,
            });
        }
        Debug.log('Progress flags initialized:', this.progressFlags);
    }

    update(deltaTime) {
        if (this.progress.hugeWaveIndices.length > 0 && this.progressFlags.length === 0) {
            this._initializeFlags();
        }

        if (this.introState !== 'idle' && this.introState !== 'finished') {
            this.introTimer -= deltaTime;
            if (this.introTimer <= 0) {
                if (this.introState === 'ready') {
                    this.introState = 'set';
                    this.introTimer = 0.7;
                    this.introText = 'SET';
                } else if (this.introState === 'set') {
                    this.introState = 'plant';
                    this.introTimer = 1.0;
                    this.introText = 'PLANT!!!';
                } else if (this.introState === 'plant') {
                    this.introState = 'finished';
                    this.introText = '';
                }
            }
        }

        for (const card of this.plantCards) {
            if (card.cooldownTimer > 0) {
                card.cooldownTimer -= deltaTime;
                if (card.cooldownTimer < 0) {
                    card.cooldownTimer = 0;
                }
            }
        }

        if (this.progress.totalWaves > 0) {
            const LERP_FACTOR = 0.05;
            const targetProgress = this.progress.currentWave / this.progress.totalWaves;
            const difference = targetProgress - this.visualProgress;
            
            this.visualProgress += difference * LERP_FACTOR;

            if (Math.abs(difference) < 0.001) {
                this.visualProgress = targetProgress;
            }
        }
        
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

        for (const flag of this.progressFlags) {
            if (flag.state === 'resting' && (this.progress.currentWave - 1) >= flag.triggerWaveIndex) {
                flag.state = 'raising';
            }
            if (flag.state === 'raising') {
                const diff = flag.raisedY - flag.currentY;
                flag.currentY += diff * 0.05; 
                if (Math.abs(diff) < 1) {
                    flag.currentY = flag.raisedY;
                    flag.state = 'raised';
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
                    soundManager.playSoundEffect('error_buzz', 0.5);
                    return null;
                }
                if (this.sunCount < card.cost) {
                    Debug.log(`Not enough sun for ${card.name}.`);
                    soundManager.playSoundEffect('error_buzz', 0.5);
                    return null;
                }
                eventBus.publish('card:selected', { cardName: card.name });
                Debug.log(`Clicked on plant card: ${card.name}`);
                return card.name;
            }
        }
        return null;
    }
    
    draw(renderer, selectedPlantName = null) {
        if (this.uiPanel.image) {
            renderer.drawImage(this.uiPanel.image, this.uiPanel.x, this.uiPanel.y, this.uiPanel.width, this.uiPanel.height);
        }

        this.drawSunCounter(renderer);
        this.drawPlantCards(renderer, selectedPlantName);
        this.drawProgressBar(renderer);
        this.drawAnnouncement(renderer);

        if (this.introText) {
            const x = renderer.VIRTUAL_WIDTH / 2;
            const y = renderer.VIRTUAL_HEIGHT / 2;
            const fontSize = Math.round(renderer.VIRTUAL_HEIGHT * 0.207); 
            const font = `${fontSize}px Arial`;
            const shadowOffset = renderer.VIRTUAL_HEIGHT * 0.003; 

            renderer.drawText(this.introText, x + shadowOffset, y + shadowOffset, font, 'rgba(0,0,0,0.5)', 'center', 'middle'); 
            renderer.drawText(this.introText, x, y, font, '#33cc33', 'center', 'middle');
        }
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
        
        if (this.sunCounter.icon) {
            const iconSize = 50;
            renderer.drawImage(this.sunCounter.icon, this.sunCounter.x - iconSize/2, this.sunCounter.y - iconSize - 5, iconSize, iconSize);
        }
        
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
        ctx.restore();
    }

    drawPlantCards(renderer, selectedPlantName) {
        for (const card of this.plantCards) {
            const canAfford = this.sunCount >= card.cost;
            const isOnCooldown = card.cooldownTimer > 0;
            const alpha = canAfford ? 1.0 : 0.6;

            if (this.cardBackgroundImage) {
                renderer.drawImage(this.cardBackgroundImage, card.rect.x, card.rect.y, card.rect.width, card.rect.height);
            }

            const ctx = renderer.ctx;
            ctx.save();
            ctx.globalAlpha = alpha;

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

            const costText = `${card.cost}`;
            const bottomAreaY = card.rect.y + card.rect.height * 0.88;
            const centerAreaX = card.rect.x + card.rect.width / 2;
            const textX = centerAreaX -2; 
            const textY = bottomAreaY + 1
            renderer.drawText(
                costText,
                textX,
                textY,
                this.cardFont,
                'black',
                'center',
                'middle'
            );

            if (this.sunIconImage) {
                const iconSize = 20;
                const iconX = centerAreaX + 15;
                const iconY = bottomAreaY - iconSize / 2;
                renderer.drawImage(this.sunIconImage, iconX, iconY, iconSize, iconSize);
            }
            
            ctx.restore();

            if (isOnCooldown) {
                const progress = card.cooldownTimer / card.maxCooldown;
                const overlayHeight = card.rect.height * progress;
                const pRect = {
                    x: card.rect.x * renderer.scale + renderer.offsetX,
                    y: card.rect.y * renderer.scale + renderer.offsetY,
                    w: card.rect.width * renderer.scale,
                    h: card.rect.height * renderer.scale
                };
                const pOverlayHeight = overlayHeight * renderer.scale;
                const ctx = renderer.ctx;
                ctx.save();
                const gradient = ctx.createLinearGradient(pRect.x, pRect.y, pRect.x, pRect.y + pOverlayHeight);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
                gradient.addColorStop(1, 'rgba(50, 50, 50, 0.5)');
                ctx.fillStyle = gradient;
                ctx.fillRect(pRect.x, pRect.y, pRect.w, pOverlayHeight);
                ctx.restore();
            }

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
        if (!pb.image || !this.progress.totalWaves) return;

        renderer.drawImage(pb.image, pb.x, pb.y, pb.width, pb.height);
        
        const barInnerPadding = pb.width * 0.05;
        const totalFillableWidth = pb.width - barInnerPadding * 2;
        
        const progressPercentage = this.visualProgress;
        const barFillWidth = totalFillableWidth * progressPercentage;
        
        const pX = (pb.x + pb.width - barInnerPadding - barFillWidth) * renderer.scale + renderer.offsetX;
        const pY = (pb.y + pb.height * 0.2) * renderer.scale + renderer.offsetY;
        const pW = barFillWidth * renderer.scale;
        const pH = (pb.height * 0.6) * renderer.scale;
        
        renderer.ctx.fillStyle = '#6ab04c';
        renderer.ctx.fillRect(pX, pY, pW, pH);

        if (pb.flagImage) {
            const flagHeight = pb.height * 0.8;
            const flagWidth = flagHeight * (pb.flagImage.width / pb.flagImage.height);
            
            for (const flag of this.progressFlags) {
                const flagProgress = (flag.triggerWaveIndex + 1) / this.progress.totalWaves;
                const flagX = (pb.x + pb.width - barInnerPadding) - (totalFillableWidth * flagProgress) - (flagWidth / 2);
                renderer.drawImage(pb.flagImage, flagX, flag.currentY, flagWidth, flagHeight);
            }
        }
        
        if (pb.headImage) {
            const headHeight = pb.height * 1.2;
            const headWidth = headHeight * (pb.headImage.width / pb.headImage.height);
            const headX = (pb.x + pb.width - barInnerPadding) - (totalFillableWidth * progressPercentage) - (headWidth / 2);
            const headY = pb.y + (pb.height - headHeight) / 2;
            renderer.drawImage(pb.headImage, headX, headY, headWidth, headHeight);
        }
    }

    getSunCounterPosition() {
        return { 
            x: this.sunCounter.x, 
            y: this.sunCounter.y - 25
        };
    }
}