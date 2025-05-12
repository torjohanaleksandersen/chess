import { avatar, user } from "./index.js";
import { socket } from "./networking.js";



export class HomeScreenController {
    constructor () {
        this.buttons = {
            loginOrSignup: document.querySelector("#log-in-sign-up"),
            home: document.querySelector("#home"),
            quickSearch: document.querySelector("#quick-search"),
            createAccount: document.querySelector("#create-account"),
            signUp: document.querySelector("#sign-up"),
            login: document.querySelector("#log-in")
        }

        this.divs = {
            login: document.querySelector(".log-in"),
            home: document.querySelector(".home"),
            quickSearch: document.querySelector(".quick-search"),
            game: document.querySelector(".game"),
            blurContainer: document.querySelector(".blur-background"),
            createAccount: document.querySelector(".create-account"),
            signUp: document.querySelector(".new-account")
        }


        this.buttons.loginOrSignup.addEventListener("click", () => {this.loginOrSignup()});
        this.buttons.home.addEventListener("click", () => {this.home()});
        this.buttons.quickSearch.addEventListener("click", () => {this.quickSearch()});
        this.divs.blurContainer.addEventListener("click", () => {this.home()});
        this.buttons.createAccount.addEventListener("click", () => {this.createAccount()});
        this.buttons.signUp.addEventListener("click", () => {this.newAccount()});
        this.buttons.login.addEventListener("click", () => {this.tryLogin()});
        document.querySelector("#done-with-creating-account").addEventListener("click", () => {
            this.divs.blurContainer.style.display = "none";
            this.divs.signUp.style.display = "none";
        })

        const fullName = document.querySelector("#full-name");
        fullName.addEventListener("input", () => {
            fullName.value = fullName.value.replace(/[^a-zA-Z ]/g, '');
        })
        const address = document.querySelector("#address");
        address.addEventListener("input", () => {
            address.value = address.value.replace(/[^a-zA-Z0-9 ]/g, '');
        })
        const phoneNumber = document.querySelector("#phone-number");
        phoneNumber.addEventListener("input", () => {
            phoneNumber.value = phoneNumber.value.replace(/[^0-9]/g, '');
        })
        const socialSecurityNumber = document.querySelector("#social-security-number");
        socialSecurityNumber.addEventListener("input", () => {
            socialSecurityNumber.value = socialSecurityNumber.value.replace(/[^0-9]/g, '');
        })
        const gamertag = document.querySelector("#gamertag");
        gamertag.addEventListener("input", () => {
            gamertag.value = gamertag.value.replace(/[^a-zA-Z0-9]/g, '');
        })
        const username = document.querySelector("#username");
        username.addEventListener("input", () => {
            username.value = username.value.replace(/[^a-zA-Z0-9]/g, '');
        })
        const password = document.querySelector("#password");
        password.addEventListener("input", () => {
            password.value = password.value
        })
    }

    switchScreen(key) {
        for (const name in this.divs) {
            if (key != name) {
                this.divs[name].style.display = "none";
                continue;
            }
            this.divs[name].style.display = "flex";
        }
    }

    loginOrSignup() {
        this.divs.blurContainer.style.display = "block";
        this.divs.login.style.display = "flex";
    }

    createAccount() {
        this.divs.login.style.display = "none";
        this.divs.createAccount.style.display = "flex";
    }

    newAccount() {
        const fullName = document.querySelector("#full-name");
        const address = document.querySelector("#address");
        const phoneNumber = document.querySelector("#phone-number");
        const socialSecurityNumber = document.querySelector("#social-security-number");
        const gamertag = document.querySelector("#gamertag");
        const username = document.querySelector("#username");
        const password = document.querySelector("#password");

        for (const element of [fullName, address, phoneNumber, socialSecurityNumber, gamertag, username, password]) {
            element.style.borderColor = "white";
        }

        let successfull = true;

        for (const element of [fullName, address, phoneNumber, socialSecurityNumber, gamertag, username, password]) {
            if (!element.value) {
                element.style.borderColor = "red";
                successfull = false;
            }
        }

        if (phoneNumber.value[0] !== '9' && phoneNumber.value[0] !== '4') {
            phoneNumber.style.borderColor = "red";
            successfull = false;
        }

        if (socialSecurityNumber.value.length !== 11) {
            socialSecurityNumber.style.borderColor = "red";
            successfull = false;
        }

        let c = false, n = false, s = false
        for (const char of password.value) {
            if (/[a-zA-Z]/.test(char)) c = true;
            if (/[0-9]/.test(char)) n = true;
            if (/[^a-zA-Z0-9]/.test(char)) s = true;
        }

        if (!c || !n || !s || password.value.length < 5) {
            password.style.borderColor = "red";
            successfull = false;
        };
        
        if (!successfull) return;

        socket.emit("register-account", {
            username: username.value, 
            password: password.value,
            gamertag: gamertag.value,
        });
    }

    deniedAccount() {
        console.log("denied");
    }

    confirmAccount(username) {
        this.divs.createAccount.style.display = "none";
        this.divs.signUp.style.display = "flex";

        const av = avatar.createRandom();
        document.querySelector(".avatar").innerHTML = av;

        user.avatar = avatar.options;

        user.fullName = document.querySelector("#full-name").value;
        user.address = document.querySelector("#address").value
        user.phoneNumber = document.querySelector("#phone-number").value
        user.socialSecurityNumber = document.querySelector("#social-security-number").value
        user.gamertag = document.querySelector("#gamertag").value;

        const elo = 400 + Math.floor(Math.pow(Math.random(), 3) * (3000 - 400));

        document.querySelector(".assigned-ELO").innerHTML = elo;
        user.elo = elo;

        socket.emit("set-user-information", {
            avatar: user.avatar,
            gamertag: user.gamertag,
            elo: user.elo,
            usernameBuffer: username
        });
    }

    tryLogin() {
        const username = document.querySelector("#login-username").value;
        const password = document.querySelector("#login-password").value;

        socket.emit("request-login", { username, password });
    }

    loginSuccessful(data) {
        this.divs.blurContainer.style.display = "none";
        this.divs.login.style.display = "none";

        avatar.options = data.avatar;
        console.log(data)
        user.gamertag = data.gamertag;
        user.elo = data.elo;

        this.setFooterUserData();
    }

    loginNotSuccessful() {
        const username = document.querySelector("#login-username");
        const password = document.querySelector("#login-password");

        username.value = "";
        password.value = "";
        username.style.borderColor = "red";
        password.style.borderColor = "red";
    }

    home() {
        this.switchScreen("home");
    }

    newGame() {
        this.switchScreen("game");
    }

    quickSearch() {
        this.switchScreen("quickSearch");

        const loadingScreen = document.querySelector(".loading-screen-gif");

        const length = 5;
        const random = Math.floor(Math.random() * length)
        const src = `animation/loading-${random}.gif`;
        loadingScreen.src = src;
    }

    setFooterUserData() {
        const av = this.getUserAvatar();
        if(!av) return;

        document.querySelector("#account-avatar").innerHTML = av;
        document.querySelector("#account-gamertag").innerHTML = user.gamertag;
        document.querySelector("#account-ELO").innerHTML = user.elo;
    }

    getUserAvatar() {
        return avatar.Avataaars.create(avatar.options) || null;
    }
}