import { Avatar } from "./avatar.js";
import { Cookies } from "./cookies.js";
import { GameScreenController } from "./game-screen-controller.js";
import { HomeScreenController } from "./home-screen-controller.js";
import { searchForGame } from "./networking.js"

class User {
    constructor () {
        this.inGame = false;
        this.loggedIn = false;

        this.gamertag = "";
        this.fullName = "";
        this.address = "";
        this.phoneNumber = "";
        this.socialSecurityNumber = "";
        this.username = "";
        this.elo = 0;
        this.time = 0;

        this.avatar = {};
    }
}

export const user = new User(); 


document.querySelector("#quick-search").addEventListener("click", () => {
    setTimeout(() => {
        searchForGame();
    }, 0)
})



export const cookies = new Cookies();
setTimeout(() => {
    cookies.initiate();
}, 2000)

export const homeScreenController = new HomeScreenController();
export const gameScreenController = new GameScreenController();

export const avatar = new Avatar();
avatar.createRandom();


