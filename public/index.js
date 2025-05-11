import { Avatar } from "./avatar.js";
import { Cookies } from "./cookies.js";
import { HomeScreenController } from "./home-screen-controller.js";
import { searchForGame } from "./networking.js"

class User {
    constructor () {
        this.inGame = false;

        this.gamertag = "";
        this.fullName = "";
        this.address = "";
        this.phoneNumber = "";
        this.socialSecurityNumber = "";
        this.username = "";
        this.ELO = 0;

        this.avatar = {};
    }

    setELO() {
        this.ELO = 400 + Math.exp(Math.random(), 3) * (3170 - 400);
    }
}

export const user = new User(); 


document.querySelector("#quick-search").addEventListener("click", () => {
    setTimeout(() => {
        searchForGame();
    }, 4000)
})



const cookies = new Cookies();
setTimeout(() => {
    cookies.initiate();
}, 2000)

export const homeScreenController = new HomeScreenController();

export const avatar = new Avatar();
avatar.createRandom();


