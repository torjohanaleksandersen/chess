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
    constructor () {
        this.id = null;
        this.players = {
            white: null,
            black: null
        }
        this.turn = "white";
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
    }
}

class NetworkManager {
    constructor() {
        this.users = [];
        this.gameRooms = [];
        this.queue = [];
    }

    update(dt) {
        this.users.forEach(user => {
            if (user.searching && !user.inQueue && !user.currentGame?.enemy) {
                this.queue.push(user);
                user.inQueue = true;
                user.queueTime = 60000;
            }
        })

        let filteredQueue = [];
        this.queue.forEach(user => {
            user.queueTime -= dt;

            if (user.queueTime > 0) {
                filteredQueue.push(user);
            }
        })

        this.queue = filteredQueue;

        if (this.queue.length >= 2) {
            const gameRoom = new GameRoom();
            gameRoom.id = Math.random() //must change
            const white = Math.round(Math.random());
            gameRoom.players.white = this.queue[white];
            gameRoom.players.black = this.queue[white == 1 ? 0 : 1];

            const pl1 = gameRoom.players.white;
            const pl2 = gameRoom.players.black;

            pl1.searching = false;
            pl1.inQueue = false;
            pl2.searching = false;
            pl2.inQueue = false;

            pl1.currentGame = {
                enemy: pl2,
                room: gameRoom
            };
            
            pl2.currentGame = {
                enemy: pl1,
                room: gameRoom
            };
            
            
            pl1.socket.emit("match-found", { color: "white", roomId: gameRoom.id });
            pl2.socket.emit("match-found", { color: "black", roomId: gameRoom.id });

            pl1.socket.emit("your-turn");

            this.gameRooms.push(gameRoom);

            this.queue.splice(0, 2);
        }
    }
}

const networkManager = new NetworkManager();
export const database = new Database();

const dt = 100;
setInterval(() => {
    networkManager.update(dt);
}, dt)


io.on('connection', socket => {
    const user = new User(socket);
    networkManager.users.push(user);
    socket.on('disconnect', () => {
        networkManager.users = networkManager.users.filter(element => element !== user);
        networkManager.queue = networkManager.queue.filter(element => element !== user);
    });
})

app.use(express.static("public"));

httpServer.listen(PORT);