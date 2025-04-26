import { socket } from "../index.js";
const board = document.querySelector(".board");

const initialPositions = {
    '0,0': 'bR', '0,1': 'bN', '0,2': 'bB', '0,3': 'bQ',
    '0,4': 'bK', '0,5': 'bB', '0,6': 'bN', '0,7': 'bR',
    '1,0': 'bP', '1,1': 'bP', '1,2': 'bP', '1,3': 'bP',
    '1,4': 'bP', '1,5': 'bP', '1,6': 'bP', '1,7': 'bP',
    '6,0': 'wP', '6,1': 'wP', '6,2': 'wP', '6,3': 'wP',
    '6,4': 'wP', '6,5': 'wP', '6,6': 'wP', '6,7': 'wP',
    '7,0': 'wR', '7,1': 'wN', '7,2': 'wB', '7,3': 'wQ',
    '7,4': 'wK', '7,5': 'wB', '7,6': 'wN', '7,7': 'wR'
}

const movableSquares = {
    R: {
        recursive: true,
        directions: [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]
    },
    B: {
        recursive: true,
        directions: [
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1]
        ]
    },
    Q: {
        recursive: true,
        directions: [
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]
    },
    K: {
        recursive: false,
        directions: [
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]
    },
    N: {
        recursive: false,
        directions: [
            [2, 1],
            [2, -1],
            [1, -2],
            [-1, -2],
            [1, 2],
            [-1, 2],
            [-2, 1],
            [-2, -1]
        ]
    },
    P: {
        recursive: false,
        directions: [
            [0, -1],
            [0, -2],
        ]
    }
}

const colors = {
    green: {
        normal: "rgb(115,149,82)",
        yellow: "rgb(185,202,67)",
        red: "rgb(211,108,80)",
    },
    white: {
        normal: "rgb(235,236,208)",
        yellow: "rgb(245,246,130)",
        red: "rgb(235,125,106)",
    },
}

let selectedSquare = null;
let handPiece = null;
let myTurn = false;

function forEachSquare(callback) {
    document.querySelectorAll(".square").forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        callback(square, row, col);
    })
}

function addHandPiece(piece) {
    const img = document.createElement("img");
    img.classList.add("piece-in-hand");
    img.draggable = false;
    img.src = "chess/pieces/" + piece + ".svg";
    const rect = board.getBoundingClientRect();
    img.style.height = rect.height * 0.125 + "px";
    img.style.width = rect.height * 0.125 + "px";

    handPiece = img;

    board.appendChild(img);
}

function moveHandPiece(e) {
    if (!handPiece) return;

    const x = e.screenX;
    const y = e.screenY;

    const rect = handPiece.getBoundingClientRect();

    handPiece.style.left = (x - rect.width / 2) + "px";
    handPiece.style.top = (y - rect.height * 1.75 ) + "px";
}

function removeHandPiece() {
    if (!handPiece) return;
    board.removeChild(handPiece);
}

function recolorBoard() {
    forEachSquare((square, row, col) => {
        if (square.dataset.highlighted === "1") return;
        const isWhite = (row + col) % 2 === 0;
        square.style.backgroundColor = colors[isWhite ? "white" : "green"].normal;
    })
}

function getSquare(row, col) {
    return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

function markMovableSquares(selectedSquare, row, col, playerSideCode) {
    const enemySideCode = playerSideCode === "w" ? "b" : "w";
    const pieceName = selectedSquare.dataset.piece[1];
    const data = movableSquares[pieceName];

    if (data.recursive) {
        for (const [dx, dy] of data.directions) {
            for (let i = 1; i < 8; i++) {
                const x = col + i * dx;
                const y = row + i * dy;
                if (x < 0 || x > 7 || y < 0 || y > 7) break;

                const square = getSquare(y, x);
                if (square.dataset.piece[0] === playerSideCode) break;

                markWithCircle(square);
                square.dataset.moveable = 1;
            }
        }
    } else {
        for (const [dx, dy] of data.directions) {
            const inverted = playerSideCode === "w" ? 1 : -1;
            const x = col + (dx) * inverted;
            const y = row + (dy) * inverted;
            if (x < 0 || x > 7 || y < 0 || y > 7) continue;

            const square = getSquare(y, x);
            if (square.dataset.piece[0] === playerSideCode) continue;

            if (pieceName != "P" || square.dataset.piece[0] != enemySideCode) {
                markWithCircle(square);
                square.dataset.moveable = 1;
            }

            if (pieceName == "P") {
                const topLeftSquare = getSquare(y, x - 1)
                if (topLeftSquare && topLeftSquare.dataset.piece[0] === enemySideCode) {
                    markWithCircle(topLeftSquare);
                    topLeftSquare.dataset.moveable = 1;
                }
                const topRightSquare = getSquare(y, x + 1)
                if (topRightSquare && topRightSquare.dataset.piece[0] === enemySideCode) {
                    markWithCircle(topRightSquare);
                    topRightSquare.dataset.moveable = 1;
                }
            }
            const pawnRow = playerSideCode === "w" ? 6 : 1;
            if (pieceName == "P" && row != pawnRow) return;
        }
    }
}

function markWithCircle(square) {
    if (square.querySelector(".circle")) return;
    const circle = document.createElement("div");
    circle.classList.add("circle");
    square.appendChild(circle);
}

function removeCircles() {
    forEachSquare((square) => {
        const circles = square.querySelectorAll(".circle");
        if (circles.length > 0) {
            for (const circle of circles) {
                square.removeChild(circle);
            }
        }
    })
}

function madeMove(piece, startPos, finalPos, playerSideCode) {
    let r0x = parseInt(startPos.x);
    let r0y = parseInt(startPos.y);
    let rx = parseInt(finalPos.x);
    let ry = parseInt(finalPos.y);

    socket.emit("move", {piece, 
        startPos: {x: r0x, y: r0y}, 
        finalPos: {x: rx, y: ry},
    })
}

function removeHighlights() {
    forEachSquare((square) => {
        square.dataset.highlighted = 0;
    })
}

export function receivedMove(data) {
    removeCircles();
    removeHighlights();
    forEachSquare((square) => {
        square.dataset.moveable = 0;
    })
    const startSquare = getSquare(data.startPos.y, data.startPos.x);
    const finalSquare = getSquare(data.finalPos.y, data.finalPos.x);

    const img = document.createElement("img");
    img.src = "chess/pieces/" + data.piece + ".svg";
    img.style.height = "96%";
    img.style.width = "96%";
    img.draggable = false;
    startSquare.innerHTML = "";
    startSquare.dataset.piece = "0";
    finalSquare.dataset.piece = data.piece;
    finalSquare.appendChild(img);

    recolorBoard();

    startSquare.dataset.highlighted = 1;
    finalSquare.dataset.highlighted = 1;

    startSquare.style.backgroundColor = colors[startSquare.classList.contains("white") ? "white" : "green"].yellow;
    finalSquare.style.backgroundColor = colors[finalSquare.classList.contains("white") ? "white" : "green"].yellow;
}

export function startGame(playerSide) {
    board.innerHTML = "";
    const playerSideCode = playerSide[0];

    const rowOrder = playerSide === "white" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
    const colOrder = playerSide === "white" ? [...Array(8).keys()] : [...Array(8).keys()].reverse();

    for (let row of rowOrder) {
        for (let col of colOrder) {
            const square = document.createElement("div");
            square.classList.add("square");
            const isWhite = (row + col) % 2 === 0;
            square.classList.add(isWhite ? "white" : "green");
            square.dataset.row = row;
            square.dataset.col = col;
            square.dataset.piece = 0;
            square.dataset.moveable = 0;
            square.dataset.highlighted = 0;
            board.appendChild(square);
        }
    }
    
    forEachSquare((square, row, col) => {
        const key = `${row},${col}`;
        if (initialPositions[key]) {
            const img = document.createElement("img");
            img.src = "chess/pieces/" + initialPositions[key] + ".svg";
            img.style.height = "96%";
            img.style.width = "96%";
            img.draggable = false;
            square.dataset.piece = initialPositions[key];
            square.appendChild(img);
        }
    })
    
    forEachSquare((square, row, col) => {
        square.addEventListener("mousedown", (e) => {
            if (e.button == 2) return;
            const isWhite = square.classList.contains("white");
            if (!selectedSquare && square.dataset.piece !== "0" && square.dataset.piece[0] === playerSideCode) {
                recolorBoard();
                selectedSquare = square;
                selectedSquare.style.backgroundColor = colors[isWhite ? "white" : "green"].yellow;
                const img = selectedSquare.querySelector("img");
                img.style.display = "none";
                markMovableSquares(selectedSquare, row, col, playerSideCode);
                addHandPiece(selectedSquare.dataset.piece);
            } else if (selectedSquare && square.dataset.moveable === "1" && myTurn) {
                const img = document.createElement("img");
                img.src = "chess/pieces/" + selectedSquare.dataset.piece + ".svg";
                img.style.height = "96%";
                img.style.width = "96%";
                img.draggable = false;
                square.innerHTML = "";
                square.dataset.piece = selectedSquare.dataset.piece;
                square.appendChild(img);
                square.style.backgroundColor = colors[isWhite ? "white" : "green"].yellow;
                
                madeMove(square.dataset.piece, {x: selectedSquare.dataset.col, y: selectedSquare.dataset.row}, {x: square.dataset.col, y: square.dataset.row}, playerSideCode);
                removeHighlights();
                selectedSquare.dataset.highlighted = 1;
                square.dataset.highlighted = 1;

                selectedSquare.dataset.piece = 0;
                selectedSquare.innerHTML = "";
    
                selectedSquare = null;
                forEachSquare((square) => {
                    square.dataset.moveable = 0;
                })
                removeCircles();
                recolorBoard();
            } else if (selectedSquare && square.dataset.piece[0] !== playerSideCode) {
                addHandPiece(selectedSquare.dataset.piece);
                const img = selectedSquare.querySelector("img");
                img.style.display = "none";
            } else if (selectedSquare && square.dataset.piece[0] === playerSideCode) {
                removeCircles();
                recolorBoard();
                selectedSquare = square;
                selectedSquare.style.backgroundColor = colors[isWhite ? "white" : "green"].yellow;
                const img = selectedSquare.querySelector("img");
                img.style.display = "none";
                markMovableSquares(selectedSquare, row, col, playerSideCode);
                addHandPiece(selectedSquare.dataset.piece);
            } else {
                recolorBoard();
            }
        })
    
        square.addEventListener("mouseup", (e) => {
            if (e.button == 2) return;
            const isWhite = square.classList.contains("white");
            if (selectedSquare !== square && selectedSquare && square.dataset.moveable === "1" && myTurn) {
                const img = document.createElement("img");
                img.src = "chess/pieces/" + selectedSquare.dataset.piece + ".svg";
                img.style.height = "96%";
                img.style.width = "96%";
                img.draggable = false;
                square.innerHTML = "";
                square.dataset.piece = selectedSquare.dataset.piece;
                square.appendChild(img);
                square.style.backgroundColor = colors[isWhite ? "white" : "green"].yellow;
    
                madeMove(square.dataset.piece, {x: selectedSquare.dataset.col, y: selectedSquare.dataset.row}, {x: square.dataset.col, y: square.dataset.row}, playerSideCode);
                removeHighlights();
                selectedSquare.dataset.highlighted = 1;
                square.dataset.highlighted = 1;


                selectedSquare.dataset.piece = 0;
                selectedSquare.innerHTML = "";
    
                selectedSquare = null;
                forEachSquare((square) => {
                    square.dataset.moveable = 0;
                })
                removeCircles();
                removeHandPiece();
    
                recolorBoard();
            } else if (selectedSquare) {
                const img = selectedSquare.querySelector("img");
                img.style.display = "block";
                removeHandPiece();
            }
        })
    
        square.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (square.dataset.highlighted === "1") return;
            const isWhite = square.classList.contains("white");
            square.style.backgroundColor = colors[isWhite ? "white" : "green"].red;
            
        })
    })
    
    board.addEventListener("mousemove", (e) => {moveHandPiece(e)})
    board.addEventListener("mouseover", (e) => {moveHandPiece(e)})
}

export function switchTurn(turn) {
    myTurn = turn;
}