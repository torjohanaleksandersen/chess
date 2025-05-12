import { avatar, user } from "./index.js";



export class GameScreenController {
    constructor () {
        this.divs = {
            you: {
                profile_pic: document.querySelector("#pl-1 .profile-picture"),
                gamertag: document.querySelector("#pl-1 .game-gamertag"),
                ELO: document.querySelector("#pl-1 .game-ELO"),
                material: document.querySelector("#pl-1 .material-number"),
                img_parent: document.querySelector("#pl-1 .taken-pieces")
            },
            opp: {
                profile_pic: document.querySelector("#pl-2 .profile-picture"),
                gamertag: document.querySelector("#pl-2 .game-gamertag"),
                ELO: document.querySelector("#pl-2 .game-ELO"),
                material: document.querySelector("#pl-2 .material-number"),
                img_parent: document.querySelector("#pl-2 .taken-pieces")
            }
        }

        this.teamColor = "";
    }

    initializeGame() {
        this.divs.you.profile_pic.innerHTML = avatar.Avataaars.create(avatar.options);
        this.divs.you.gamertag.innerHTML = user.gamertag;
        this.divs.you.ELO.innerHTML = user.ELO;
    }

    appendTakenPiece() {

    }
}