export default class Background {
    /**
     * @param {AssetLoader} assetLoader 
     * @param {number} virtualWidth 
     * @param {number} virtualHeight 
     * @param {Grid} grid 
     */
    constructor(assetLoader, virtualWidth, virtualHeight, grid) {
        this.assetLoader = assetLoader;
        this.vWidth = virtualWidth;
        this.vHeight = virtualHeight;
        this.grid = grid;

        // Загружаем изображения
        this.sky = this.assetLoader.getImage('bg_sky');
        this.lawn = this.assetLoader.getImage('bg_lawn');
        this.house = this.assetLoader.getImage('bg_house');
        this.bushes = this.assetLoader.getImage('bg_bushes');
        this.road = this.assetLoader.getImage('bg_road')
    }

    // Отрисовка заднего плана (до персонажей)
    drawBack(renderer) {
        // Небо - растягиваем на всю ширину
        if (this.sky) {
            renderer.drawImage(this.sky, 0, 0, this.vWidth, this.vHeight);
        }
        // Газон - идеально вписывается в игровую сетку
        if (this.lawn) {
            renderer.drawImage(this.lawn, this.grid.offsetX, this.grid.offsetY, this.grid.width, this.grid.height);
        }

        // Дом - занимает всю область слева от сетки
        if (this.house) {
            const houseVisibleWidth = 128; // Сколько пикселей дома мы видим
            const houseAspectRatio = this.house.width / this.house.height;
            const houseDrawHeight = this.vHeight;
            const houseDrawWidth = houseDrawHeight * houseAspectRatio;

            // Рисуем дом со смещением влево, чтобы была видна только его правая часть
            const houseX = houseVisibleWidth - houseDrawWidth;
            const houseY = 0;
            
            renderer.drawImage(this.house, houseX, houseY, houseDrawWidth, houseDrawHeight);
        }
        if (this.road) {
            const roadX = this.grid.offsetX + this.grid.width;
            const roadWidth = this.vWidth +400 - roadX; // Ширина от конца сетки до края экрана
            renderer.drawImage(this.road, roadX, 0, roadWidth, this.vHeight);
        }
        
    }

    // Отрисовка переднего плана (после персонажей)
    drawFront(renderer) {
        // Кусты - рисуем по одному на каждой линии справа
        if (this.bushes) {
            const bushAspectRatio = this.bushes.width / this.bushes.height;
            const bushHeight = this.grid.cellHeight * 1.5; // Делаем куст чуть больше ячейки
            const bushWidth = bushHeight * bushAspectRatio;
            for (let j = 0; j < 3; j++){
                for (let i = 0; i < this.grid.rows; i++) {
                    // Позиционируем куст по центру Y каждой линии, справа от сетки
                    const cellCenterY = this.grid.getWorldPos(i, 0).y;
                    const bushX = this.grid.offsetX + this.grid.width - 80 + j * 50// - (bushWidth / 2);
                    let bushY = cellCenterY - (bushHeight / 2);

                    // 3. Добавляем "дрожание" по Y, чтобы кусты не стояли идеально ровно.
                    // Это создает более естественный вид.
                    // Самый передний ряд (j=0) - небольшое смещение.
                    // Средний ряд (j=1) - другое смещение.
                    // Задний ряд (j=2) - третье смещение.
                    if (j === 0) {
                        bushY += 5;
                    } else if (j === 1) {
                        bushY -= 10;
                    } else {
                        bushY += 10;
                    }
                    
                    renderer.drawImage(this.bushes, bushX, bushY, bushWidth, bushHeight);
                }
            }
        }
    }
}