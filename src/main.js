import Game from "./game/Game.js"
import Debug from "./core/Debug.js"


// Debug.disable()
Debug.log('PvZ Fussion: main.js Loaded successfully.')


window.debug = Debug

const game = new Game()
game.start().catch(err => Debug.error('Failed to start the game: ', err))

window.game = game