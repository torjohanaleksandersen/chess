import { searchForGame } from "./networking.js"

class User {
    constructor () {
        this.inGame = false;
    }
}

export const user = new User();


document.querySelector(".search-for-game").addEventListener("click", () => {
    searchForGame()
})