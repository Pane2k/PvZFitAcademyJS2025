export default class Background {
    constructor(assetLoader, virtualWidth, virtualHeight, grid) {
        this.assetLoader = assetLoader;
        this.vWidth = virtualWidth;
        this.vHeight = virtualHeight;
        this.grid = grid;

        this.sky = this.assetLoader.getImage('bg_sky');
        this.lawn = this.assetLoader.getImage('bg_lawn');
        this.house = this.assetLoader.getImage('bg_house');
        this.bushes = this.assetLoader.getImage('bg_bushes');
        this.road = this.assetLoader.getImage('bg_road')
    }

    drawBack(renderer) {
        if (this.sky) {
            renderer.drawImage(this.sky, 0, 0, this.vWidth, this.vHeight);
        }
        if (this.lawn) {
            renderer.drawImage(this.lawn, this.grid.offsetX, this.grid.offsetY, this.grid.width, this.grid.height);
        }

        if (this.house) {
            const houseVisibleWidth = 128;
            const houseAspectRatio = this.house.width / this.house.height;
            const houseDrawHeight = this.vHeight;
            const houseDrawWidth = houseDrawHeight * houseAspectRatio;

            const houseX = houseVisibleWidth - houseDrawWidth;
            const houseY = 0;
            
            renderer.drawImage(this.house, houseX, houseY, houseDrawWidth, houseDrawHeight);
        }
        if (this.road) {
            const roadX = this.grid.offsetX + this.grid.width;
            const roadWidth = this.vWidth +400 - roadX;
            renderer.drawImage(this.road, roadX, 0, roadWidth, this.vHeight);
        }
        
    }

    drawFront(renderer) {
        if (this.bushes) {
            const bushAspectRatio = this.bushes.width / this.bushes.height;
            const bushHeight = this.grid.cellHeight * 1.5;
            const bushWidth = bushHeight * bushAspectRatio;
            for (let j = 0; j < 3; j++){
                for (let i = 0; i < this.grid.rows; i++) {

                    const cellCenterY = this.grid.getWorldPos(i, 0).y;
                    const bushX = this.grid.offsetX + this.grid.width - 80 + j * 50
                    let bushY = cellCenterY - (bushHeight / 2);

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