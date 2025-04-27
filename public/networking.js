import { receivedMove, startGame, switchTurn } from "./chess/game.js";
import { user } from "./index.js";

export const socket = io();

socket.on("match-found", ({ color, roomId }) => {
    user.inGame = true;
    startGame(color);
});

socket.on("move-received", data => {
    receivedMove(data);
})

socket.on("your-turn", () => {switchTurn(true)});
socket.on("end-turn", () => {switchTurn(false)});


function searchForGame() {
    socket.emit("find-game-request");
}

export { searchForGame };