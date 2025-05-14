import { avatar, user } from "./index.js";
import { game, searchForGame } from "./networking.js";



export class GameScreenController {
    constructor () {
        this.divs = {
            you: {
                profile_pic: document.querySelector("#pl-1 .profile-picture"),
                gamertag: document.querySelector("#pl-1 .game-gamertag"),
                ELO: document.querySelector("#pl-1 .game-ELO"),
                material: document.querySelector("#pl-1 .material-number"),
                img_parent: document.querySelector("#pl-1 .taken-pieces"),
                minutes: document.querySelector("#pl-1 #minutes"),
                seconds: document.querySelector("#pl-1 #seconds")
            },
            opp: {
                profile_pic: document.querySelector("#pl-2 .profile-picture"),
                gamertag: document.querySelector("#pl-2 .game-gamertag"),
                ELO: document.querySelector("#pl-2 .game-ELO"),
                material: document.querySelector("#pl-2 .material-number"),
                img_parent: document.querySelector("#pl-2 .taken-pieces"),
                minutes: document.querySelector("#pl-2 #minutes"),
                seconds: document.querySelector("#pl-2 #seconds")
            }
        }

        document.querySelectorAll(".gamemode").forEach(element => {
            element.addEventListener("click", () => {
                const id = element.id;
                searchForGame(id);
            })
        })

        this.timeInterval = null;
    }

    initializeGame(data) {
        this.divs.you.profile_pic.innerHTML = avatar.Avataaars.create(avatar.options);
        this.divs.you.gamertag.innerHTML = user.gamertag;
        this.divs.you.ELO.innerHTML = user.elo;
        let time = data.time;
        if (time < 9) time = "0" + time;
        this.divs.you.minutes.innerHTML = time;
        this.divs.you.seconds.innerHTML = "00";

        this.divs.opp.profile_pic.innerHTML = avatar.Avataaars.create(data.avatar);
        this.divs.opp.gamertag.innerHTML = data.gamertag;
        this.divs.opp.ELO.innerHTML = data.elo;
        this.divs.opp.minutes.innerHTML = time;
        this.divs.opp.seconds.innerHTML = "00";

        this.updateTimeInterval();
    }

    appendTakenPiece() {

    }

    updateTimeInterval() {
        this.timeInterval = setInterval(() => {
            if (!game) return;
            const pl = game.myTurn ? "you" : "opp";

            let obsSeconds = parseInt(this.divs[pl].seconds.innerHTML);
            let obsMinutes = parseInt(this.divs[pl].minutes.innerHTML);
            if (obsSeconds === 0) {
                obsSeconds = 60;
                obsMinutes--;
            }
            this.divs[pl].seconds.innerHTML = obsSeconds - 1;
            this.divs[pl].minutes.innerHTML = obsMinutes;

            if (pl === "you") {
                user.time = obsMinutes * 60 + obsSeconds - 1;
            }
        }, 1000)
    }
}