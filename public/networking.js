import { Game } from "./chess/game.js";
import { user } from "./index.js";

export const socket = io();
export let game = null;

socket.on("match-found", ({ color, roomId }) => {
    user.inGame = true;
    game = new Game(color);
});

socket.on("move-received", msgData => {
    game.receivedMove(msgData);
})

socket.on("switch-turn", () => {game.switchTurn()});

socket.on("you-win", data => {game.endGame(false, data)});


function searchForGame() {
    socket.emit("find-game-request");
}

export { searchForGame };