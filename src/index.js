import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 5000;

import { Database } from "./database.js";
import { User } from "./user.js";

class GameRoom {
    constructor (timemode) {
        this.id = null;

        const [time, addon] = timemode.split("+");
        this.time = time;
        this.addon = addon;

        
        
        this.players = {
            white: null,
            black: null
        }
        this.turn = "white";
    }

    start() {
        this.players.white.time = this.time;
        this.players.black.time = this.time;
    }

    switchTurn() {
        this.players.white.socket.emit("switch-turn");
        this.players.black.socket.emit("switch-turn");

        this.turn = this.turn === "white" ? "black" : "white";
    }

    end(socketId, data) {
        for (const key in this.players) {
            const player = this.players[key]
            if (player.socket.id !== socketId) {
                player.socket.emit("you-win", data);
            }
        }

        this.players.white.gameRoom = {};
        this.players.black.gameRoom = {};
        this.players.white.inGame = false;
        this.players.black.inGame = false;
    }
}

class NetworkManager {
    constructor() {
        this.users = [];
        this.gameRooms = [];
        this.queue = {};
    }

    update(dt) {
        this.users.forEach(user => {

            if (user.searching && !user.inQueue && !user.inGame && user.searchingGamemode !== "") {
                if (!this.queue[user.searchingGamemode]) this.queue[user.searchingGamemode] = [];
                this.queue[user.searchingGamemode].push(user);
                user.inQueue = true;
                user.queueTime = 60000;
            }
        })

        /*
        let filteredQueue = [];
        this.queue.forEach(user => {
            user.queueTime -= dt;

            if (user.queueTime > 0) {
                filteredQueue.push(user);
            }
        })
        */

        //this.queue = filteredQueue;

        for (const gamemode in this.queue) {
            if (this.queue[gamemode].length >= 2) {
                const gameRoom = new GameRoom(gamemode);
                gameRoom.id = Math.random() //must change
                const white = Math.round(Math.random());
                gameRoom.players.white = this.queue[gamemode][white];
                gameRoom.players.black = this.queue[gamemode][white == 1 ? 0 : 1];

                const pl1 = gameRoom.players.white;
                const pl2 = gameRoom.players.black;

                pl1.searching = false;
                pl1.inQueue = false;
                pl1.inGame = true;
                pl2.searching = false;
                pl2.inQueue = false;
                pl2.inGame = true;

                pl1.currentGame = {
                    enemy: pl2,
                    room: gameRoom
                };
                
                pl2.currentGame = {
                    enemy: pl1,
                    room: gameRoom
                };
                
                
                pl1.socket.emit("match-found", { color: "white", data: {
                    avatar: pl2.avatar,
                    gamertag: pl2.gamertag,
                    elo: pl2.elo,
                    time: gameRoom.time
                } });
                pl2.socket.emit("match-found", { color: "black", data: {
                    avatar: pl1.avatar,
                    gamertag: pl1.gamertag,
                    elo: pl1.elo,
                    time: gameRoom.time
                } });

                pl1.socket.emit("your-turn");

                this.gameRooms.push(gameRoom);

                this.queue[gamemode].splice(0, 2);
            }
        }
    }
}

const networkManager = new NetworkManager();
export const database = new Database();

const dt = 100;
setInterval(() => {
    networkManager.update(dt);
}, dt)

setInterval(() => {
    console.log(database.users);
}, 1000 * 60 * 60)


io.on('connection', socket => {
    const user = new User(socket);
    networkManager.users.push(user);
    socket.on('disconnect', () => {
        networkManager.users = networkManager.users.filter(element => element !== user);
        for (const gamemode in networkManager.queue) {
            networkManager.queue[gamemode] = networkManager.queue[gamemode].filter(element => element !== user);
        }
    });
})

app.use(express.static("public"));

httpServer.listen(PORT);