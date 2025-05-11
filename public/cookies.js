



export class Cookies {
    constructor () {
        this.div = document.querySelector(".cookies");
        this.blurDiv = document.querySelector(".blur-background");
        this.customizeButtonPosition = {x: 0, y: 0};
        this.initialized = false;

        this.div.querySelector(".read-more").addEventListener("click", this.readMore);
        this.div.querySelector(".accept").addEventListener("click", () => { this.accept() });
        this.div.addEventListener("mousemove", e => { this.handleMouseMove(e) })
    }

    initiate() {
        this.div.style.display = "block";
        this.blurDiv.style.display = "block";
        this.initialized = true;
    }

    readMore() {
        
    }

    accept() {
        this.div.style.display = "none";
        this.blurDiv.style.display = "none";
    }
    
    handleMouseMove(e) {
        const button = this.div.querySelector(".customize");
        const rect = button.getBoundingClientRect();
        const [x, y] = [e.clientX, e.clientY];

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Distance between mouse and button center
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const max = 200;
        const min = 100;

        let opacity = (distance - min) / (max - min);
        opacity = Math.max(0, Math.min(1, opacity));

        button.style.opacity = opacity.toFixed(2);
    }
}