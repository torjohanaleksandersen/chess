import { receivedMove, startGame, switchTurn } from "./chess/game.js";

export const socket = io();


socket.emit("find-game-request")

socket.on("match-found", ({ color, roomId }) => {
    console.log("Match found! You are", color, "in room", roomId);
    startGame(color);
});

socket.on("move-received", data => {
    receivedMove(data);
})

socket.on("your-turn", () => {switchTurn(true)});
socket.on("end-turn", () => {switchTurn(false)});