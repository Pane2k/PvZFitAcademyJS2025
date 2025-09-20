import Debug from "../core/Debug.js"

export default class HUD {
    constructor(){
        this.sunCount = 50
        this.sunCounterX = 30
        this.sunCounterY = 50
        this.font = '32px Arial'
        this.fillStyle = 'white'

        this.plantCards = []; 
        this.cardStartX = 150;
        this.cardStartY = 15;
        this.cardWidth = 60;
        this.cardHeight = 80;
        this.cardSpacing = 10;
    }
    initializeCards(plantPrototypes, availablePlants, assetLoader) {
        this.plantCards = [];
        let currentX = this.cardStartX;

        for (const plantName of availablePlants) {
            const proto = plantPrototypes[plantName];
            if (!proto) {
                Debug.warn(`HUD: Prototype not found for ${plantName}`);
                continue;
            }

            const card = {
                name: plantName,
                cost: proto.cost,
                image: assetLoader.getImage(proto.components.SpriteComponent.assetKey),
                rect: {
                    x: currentX,
                    y: this.cardStartY,
                    width: this.cardWidth,
                    height: this.cardHeight,
                }
            };
            this.plantCards.push(card);
            currentX += this.cardWidth + this.cardSpacing;
        }
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
    

    draw(renderer, selectedPlantName = null){
        const ctx = renderer.ctx
        ctx.save()

        // Отрисовка счетчика солнца
        ctx.font = this.font
        ctx.fillStyle = this.fillStyle
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        const text = `Sun: ${this.sunCount}`
        ctx.fillText(text, this.sunCounterX, this.sunCounterY)

        // Отрисовка карточек растений
        for (const card of this.plantCards) {
            // Фон карточки
            ctx.fillStyle = this.sunCount >= card.cost ? 'rgba(80, 80, 80, 0.8)' : 'rgba(40, 40, 40, 0.9)';
            ctx.fillRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height);

            // Подсветка, если выбрано
            if (card.name === selectedPlantName) {
                ctx.strokeStyle = 'lime';
                ctx.lineWidth = 3;
                ctx.strokeRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height);
            }

            // Изображение растения
            if (card.image) {
                ctx.drawImage(card.image, card.rect.x + 5, card.rect.y + 5, card.rect.width - 10, card.rect.width - 10);
            }

            // Текст стоимости
            ctx.fillStyle = this.fillStyle;
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(card.cost, card.rect.x + card.rect.width / 2, card.rect.y + card.rect.height - 5);
            if (Debug.showInteractables) {
                renderer.drawRect(card.rect.x, card.rect.y, card.rect.width, card.rect.height, 'rgba(0, 150, 255, 0.5)', 2);
            }
        }

        ctx.restore()
    }

}