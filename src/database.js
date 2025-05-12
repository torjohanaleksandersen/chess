


export class Database {
    constructor () {
        this.users = new Map();

        this.register({ username: "admin", password: "admin", gamertag: "admin", elo: 3400, avatar: {}})
        this.register({ username: "user", password: "user", gamertag: "user", elo: 1400, avatar: {}})
    }

    register({ username, password, gamertag, elo, avatar}) {
        if (this.users.has(username)) {
            return { success: false, message: "Username aldready exists" };
        }

        this.users.set(username, {
            username,
            password,
            gamertag,
            elo,
            avatar
        })

        return { success: true, username };
    }

    login(target, username, password) {
        if (!this.users.has(username)) return { success: false, message: "Invalid username" };
        const user = this.users.get(username);
        if (user.password !== password) {
            return { success: false, message: "Invalid username or password" };
        }

        target.username = user.username;
        target.password = user.password;
        target.gamertag = user.gamertag;
        target.elo = user.elo;
        target.avatar = user.avatar;

        return { success: true, user: {
            username: user.username,
            password: user.password,
            gamertag: user.gamertag,
            elo: user.elo,
            avatar: user.avatar
        } };
    }

    updateUser(username, data = {}) {
        if (!this.users.has(username)) return { success: false };

        const storedUser = this.users.get(username);

        for (const key in data) {
            if (storedUser.hasOwnProperty(key)) {
                storedUser[key] = data[key];
            }
        }

        return { success: true };
    }

    deleteUser(username) {
        this.users.delete(username)
    }
}