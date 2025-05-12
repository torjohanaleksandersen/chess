import { Game } from "./chess/game.js";
import { gameScreenController, homeScreenController, user } from "./index.js";

export const socket = io();
export let game = null;

socket.on("match-found", ({ color, data }) => {
    user.inGame = true;
    game = new Game(color);

    gameScreenController.teamColor = color;
    gameScreenController.initializeGame(data);
});

socket.on("move-received", msgData => {
    game.receivedMove(msgData);
})

socket.on("switch-turn", () => {game.switchTurn()});

socket.on("you-win", data => {game.endGame(false, data)});

socket.on("register-account-result", result => {
    if (result.success) {
        homeScreenController.confirmAccount(result.username);
        return;
    }
    homeScreenController.deniedAccount();
})

socket.on("user-login-result", result => {
    if (result.success) {
        homeScreenController.loginSuccessful(result.user);
        return;
    }
    homeScreenController.loginNotSuccessful();
})


function searchForGame() {
    socket.emit("find-game-request");
}

export { searchForGame };