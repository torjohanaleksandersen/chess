import { database } from "./index.js";


export class User {
    constructor (socket) {
        this.socket = socket;
        this.searching = false;
        this.inQueue = false;
        this.queueTime = 0;
        this.currentGame = {};


        this.avatar = {};
        this.username = "";
        this.password = "";
        this.gamertag = ""; 
        this.elo = 0;

        this.socket.on("find-game-request", () => {
            this.searching = true;
        })

        this.socket.on("move", data => {
            if (this.currentGame?.enemy?.socket) {
                this.currentGame.enemy.socket.emit("move-received", data); // keep bit 12 intact
            }
        
            if (this.currentGame?.room) {
                this.currentGame.room.switchTurn();
            }
        });        

        this.socket.on("game-ended", data => {
            if (this.currentGame?.room) {
                this.currentGame.room.end(this.socket.id, data);
            }
        })
        
        this.socket.on("register-account", data => {
            
            const result = database.register(data);

            socket.emit("register-account-result", result);
        })

        this.socket.on("request-login", data => {
            const result = database.login(this, data.username, data.password);

            if (result.success) {
                this.updateData(data);
            }

            this.socket.emit("user-login-result", result);
        })

        this.socket.on("set-user-information", data => {

            this.updateData(data);

            database.updateUser(data.usernameBuffer, data);
        })
    }

    updateData(data) {
        for (const key in data) {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        }
    }
}