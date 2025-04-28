import { socket } from "../networking.js";
const board = document.createElement("div");
board.classList.add("board");
const gameWindow = document.querySelector(".game-window");

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
let kingChecked = false;
let playerSideCode = "";
let gameEnded = false;

let blockingMoves = [];


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
    handPiece.style.top = (y - rect.height * 1.5 ) + "px";
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

function markBlockingMovesWhileInPin(kx, ky, dx, dy, row, col, kingSquare, enemySideCode) {
    const blockingSquares = [];

    // Find direction from pinned piece toward the king
    const stepX = Math.sign(kx);
    const stepY = Math.sign(ky);

    // Step toward the king
    let x = col;
    let y = row;
    while (x !== kingSquare.col || y !== kingSquare.row) {
        if (x !== col || y !== row) blockingSquares.push({ row: y, col: x });
        x += stepX;
        y += stepY;
    }

    // Step toward the attacker (the enemy piece that pinned us)
    // We already know the attack direction: `dx`, `dy`
    x = col;
    y = row;
    while (true) {
        x += dx;
        y += dy;
        if (x < 0 || x > 7 || y < 0 || y > 7) break;

        const square = getSquare(y, x);
        if (square.dataset.piece[0] === playerSideCode) break; // blocked by friendly piece
        blockingSquares.push({ row: y, col: x });

        if (square.dataset.piece === enemySideCode + "B" || square.dataset.piece === enemySideCode + "R" || square.dataset.piece === enemySideCode + "Q") {
            // reached the attacker
            break;
        }
    }

    // Now blockingSquares contains all squares allowed for the pinned piece
    blockingMoves = blockingSquares.map(square => ({
        from: { row, col },
        to: { row: square.row, col: square.col }
    }));
}

function pinnedPiece(row, col) {
    let kingSquare = {row: 0, col: 0};
    forEachSquare((square, row, col) => {
        if (square.dataset.piece === (playerSideCode + "K")) {
            kingSquare = {row, col};
        }
    })

    const kx = kingSquare.col - col;
    const ky = kingSquare.row - row;

    const enemySideCode = playerSideCode === "w" ? "b" : "w";

    if (Math.abs(kx) === Math.abs(ky)) {
        //diagonal pin
        for (const [dx, dy] of movableSquares.B.directions) {
            let foundEnemy = false;
            for (let i = 1; i < 8; i++) {
                const x = col + i * dx;
                const y = row + i * dy;
                if (x < 0 || x > 7 || y < 0 || y > 7 || foundEnemy) break;

                const square = getSquare(y, x);

                if (square.dataset.piece[0] === playerSideCode) break;
                if (square.dataset.piece[0] === enemySideCode) {
                    if (square.dataset.piece === enemySideCode + "B" || square.dataset.piece === enemySideCode + "Q") {
                        
                        markBlockingMovesWhileInPin(kx, ky, dx, dy, row, col, kingSquare, enemySideCode);
                        
                        return true;
                    }
                    foundEnemy = true
                };
            }
        }
    } else if ((Math.abs(ky) === 0 && Math.abs(kx) > 0)) {
        for (const [dx, dy] of [[1, 0],[-1, 0]]) {
            let foundEnemy = false;
            for (let i = 1; i < 8; i++) {
                const x = col + i * dx;
                const y = row + i * dy;
                if (x < 0 || x > 7 || y < 0 || y > 7 || foundEnemy) break;

                const square = getSquare(y, x);

                if (square.dataset.piece[0] === playerSideCode) break;
                if (square.dataset.piece[0] === enemySideCode) {
                    if (square.dataset.piece === enemySideCode + "R" || square.dataset.piece === enemySideCode + "Q") {
                        
                        markBlockingMovesWhileInPin(kx, ky, dx, dy, row, col, kingSquare, enemySideCode);
                        
                        return true;
                    }
                    foundEnemy = true
                };
            }
        }
    } else if ((Math.abs(kx) === 0 && Math.abs(ky) > 0)) {
        for (const [dx, dy] of [[0, 1],[0, -1]]) {
            let foundEnemy = false;
            for (let i = 1; i < 8; i++) {
                const x = col + i * dx;
                const y = row + i * dy;
                if (x < 0 || x > 7 || y < 0 || y > 7 || foundEnemy) break;

                const square = getSquare(y, x);

                if (square.dataset.piece[0] === playerSideCode) break;
                if (square.dataset.piece[0] === enemySideCode) {
                    if (square.dataset.piece === enemySideCode + "R" || square.dataset.piece === enemySideCode + "Q") {
                        
                        markBlockingMovesWhileInPin(kx, ky, dx, dy, row, col, kingSquare, enemySideCode);
                        
                        return true;
                    }
                    foundEnemy = true
                };
            }
        }
    }
    return false;
}

function markMovableSquares(selectedSquare, row, col, playerSideCode, simulation = false) {
    const enemySideCode = playerSideCode === "w" ? "b" : "w";
    const pieceName = selectedSquare.dataset.piece[1];
    const data = movableSquares[pieceName];

    const piecePinned = pinnedPiece(row, col);

    if (blockingMoves.length > 0 && simulation === false) {
        forEachSquare((square) => {
            square.dataset.moveable = 0;
        });
        removeCircles();
        blockingMoves.forEach(move => {
            if (move.from.row == row && move.from.col == col) {
                const square = getSquare(move.to.row, move.to.col);

                markWithCircle(square);
                square.dataset.moveable = 1;
            }
        })

        return;
    }

    if (piecePinned) return;


    if (data.recursive) {
        for (const [dx, dy] of data.directions) {
            let foundEnemy = false;
            for (let i = 1; i < 8; i++) {
                const x = col + i * dx;
                const y = row + i * dy;
                if (x < 0 || x > 7 || y < 0 || y > 7 || foundEnemy) break;

                const square = getSquare(y, x);

                if (square.dataset.piece[0] === playerSideCode) break;
                if (square.dataset.piece[0] === enemySideCode) foundEnemy = true;

                markWithCircle(square);
                square.dataset.moveable = 1;
            }
        }
    } else {
        let allyInFront = false;
        for (const [dx, dy] of data.directions) {
            if (allyInFront) continue;
            const inverted = playerSideCode === "w" ? 1 : -1;
            const x = col + (dx) * inverted;
            const y = row + (dy) * inverted;
            if (x < 0 || x > 7 || y < 0 || y > 7) continue;

            const square = getSquare(y, x);

            if (square.dataset.piece[0] === playerSideCode) {
                allyInFront = true;
                continue;
            }
            if (pieceName === "K" && square.dataset.attacked === "1") continue;

            if (pieceName != "P" || square.dataset.piece[0] != enemySideCode) {
                markWithCircle(square);
                square.dataset.moveable = 1;
            }

            const pawnRow = playerSideCode === "w" ? 6 : 1;

            if (pieceName == "P" && !(row === pawnRow && (y == 4 || y == 3))) {
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

            if (pieceName == "P" && (row != pawnRow || square.dataset.piece !== "0")) return;
        }
    }
}

function markEnemyAttackingSquares(square, row, col, playerSideCode) {
    const enemySideCode = playerSideCode === "w" ? "b" : "w";
    const pieceName = square.dataset.piece[1];
    const data = movableSquares[pieceName];

    if (data.recursive) {
        for (const [dx, dy] of data.directions) {
            let foundEnemy = false, foundAlly;
            for (let i = 1; i < 8; i++) {
                const x = col + i * dx;
                const y = row + i * dy;
                if (x < 0 || x > 7 || y < 0 || y > 7 || foundEnemy || foundAlly) break;

                const square = getSquare(y, x);
                if (square.dataset.piece[0] === playerSideCode) foundAlly = true;
                if (square.dataset.piece[0] === enemySideCode) foundEnemy = true;

                square.dataset.attacked = 1;
            }
        }
    } else {
        for (const [dx, dy] of data.directions) {
            const inverted = playerSideCode === "w" ? 1 : -1;
            const x = col + (dx) * inverted;
            const y = row + (dy) * inverted;
            if (x < 0 || x > 7 || y < 0 || y > 7) continue;

            const square = getSquare(y, x);
            //if (square.dataset.piece[0] === playerSideCode) continue;

            if (pieceName != "P" && square.dataset.piece[0] != enemySideCode) {
                square.dataset.attacked = 1;
            }

            const pawnRow = playerSideCode === "w" ? 6 : 1;

            if (pieceName == "P" && row != pawnRow) {
                const topLeftSquare = getSquare(y, x - 1)
                if (topLeftSquare && topLeftSquare.dataset.piece[0] === enemySideCode) {
                    topLeftSquare.dataset.attacked = 1;
                }
                const topRightSquare = getSquare(y, x + 1)
                if (topRightSquare && topRightSquare.dataset.piece[0] === enemySideCode) {
                    topRightSquare.dataset.attacked = 1;;
                }
            }
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

export function calculateEnemyAttacks(enemySideCode) {
    const playerSideCode = enemySideCode === "w" ? "b" : "w";
    
    // First, reset all attacked squares
    forEachSquare((square) => {
        square.dataset.attacked = 0;
    });

    // Mark squares attacked by enemy
    forEachSquare((square, row, col) => {
        if (square.dataset.piece[0] === enemySideCode) {
            markEnemyAttackingSquares(square, row, col, enemySideCode);
        }
    });

    let checked = false;
    let checkMated = false;
    let kingCanMove = false;
    let kingSquare = null;

    // Find if player king is in check and if it can move
    forEachSquare((square, row, col) => {
        if (square.dataset.piece === (playerSideCode + "K")) {
            kingSquare = square;
            if (square.dataset.attacked === "1") {
                checked = true;
                
                movableSquares.K.directions.forEach(([dx, dy]) => {
                    const newRow = parseInt(square.dataset.row) + dy;
                    const newCol = parseInt(square.dataset.col) + dx;
                    const target = getSquare(newRow, newCol);
                    
                    if (target && target.dataset.piece[0] !== playerSideCode && target.dataset.attacked === "0") {
                        kingCanMove = true;
                        blockingMoves.push({
                            from: {row: parseInt(square.dataset.row), col: parseInt(square.dataset.col)},
                            to: {row: newRow, col: newCol}
                        })
                    }
                });
            }
        }
    });

    if (!checked) {
        kingChecked = false;
        return;
    }

    // If king can move, it's not checkmate
    if (kingCanMove) {
        console.log("king can move")
        checkMated = false;
    }

    // Else, check if other pieces can block or capture
    let blockingPossible = false;

    forEachSquare((square, row, col) => {
        if (square.dataset.piece[0] === playerSideCode && square.dataset.piece[1] !== "K") {
            markMovableSquares(square, row, col, playerSideCode, true);
            removeCircles();
            forEachSquare((target) => {
                if (target.dataset.moveable === "1") {
                    // Simulate move
                    const originalPiece = target.dataset.piece;
                    const originalSourcePiece = square.dataset.piece;

                    target.dataset.piece = square.dataset.piece;
                    square.dataset.piece = "0";

                    removeAllAttackMarks();
                    forEachSquare((sq) => {
                        if (sq.dataset.piece[0] === enemySideCode) {
                            markEnemyAttackingSquares(sq, parseInt(sq.dataset.row), parseInt(sq.dataset.col), enemySideCode);
                        }
                    });

                    if (kingSquare.dataset.attacked === "0") {
                        blockingMoves.push({
                            from: { row, col },
                            to: { row: parseInt(target.dataset.row), col: parseInt(target.dataset.col) }
                        });
                    }

                    // Undo simulated move
                    square.dataset.piece = originalSourcePiece;
                    target.dataset.piece = originalPiece;
                    removeAllAttackMarks();
                    forEachSquare((sq) => {
                        if (sq.dataset.piece[0] === enemySideCode) {
                            markEnemyAttackingSquares(sq, parseInt(sq.dataset.row), parseInt(sq.dataset.col), enemySideCode);
                        }
                    });
                }
            });
        }
    });

    // After scanning all squares
    blockingPossible = blockingMoves.length > 0;

    if (!blockingPossible) {
        checkMated = true;
        console.log("Checkmate!");
        endGame(false);
    } else {
        console.log("Check but not checkmate.");
    }

}

function removeAllAttackMarks() {
    forEachSquare((square) => {
        square.dataset.attacked = 0;
    });
}

export function receivedMove(data) {
    removeHighlights();

    const startSquare = getSquare(data.startPos.y, data.startPos.x);
    const finalSquare = getSquare(data.finalPos.y, data.finalPos.x);

    if (finalSquare.dataset.piece !== "0") {
        finalSquare.innerHTML = "";
    }

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


    calculateEnemyAttacks(data.piece[0]);
}

export function startGame(playerSide) {
    gameWindow.appendChild(board);
    board.innerHTML = "";
    playerSideCode = playerSide[0];

    document.querySelector(".game").style.display = "flex";
    document.querySelector(".home").style.display = "none";

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
            square.dataset.attacked = 0;
            board.appendChild(square);
        }
    }

    calculateEnemyAttacks(playerSideCode === "w" ? "b" : "w");
    
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
            removeCircles();
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

                blockingMoves = [];

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

                blockingMoves = [];


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


export function endGame(playerWon) {
    gameEnded = true;
    socket.emit("player-lost");

    forEachSquare((square) => {
        const isKingSquare = square.dataset.piece === playerSideCode + "K";
        const isWhite = square.classList.contains("white");

        const newSquare = square.cloneNode(true);

        if (isKingSquare) {
            newSquare.style.backgroundColor = colors[isWhite ? "white" : "green"].red;
            console.log("redded");
        }

        square.parentNode.replaceChild(newSquare, square);
    });
}
