import { homeScreenController } from "../index.js";
import { socket } from "../networking.js";
const boardDiv = document.createElement("div");
boardDiv.classList.add("board");
const gameWindow = document.querySelector(".game-board-container");

const board = [
    [0b11101, 0b11010, 0b11100, 0b11110, 0b11011, 0b11100, 0b11010, 0b11101],
    [0b11001, 0b11001, 0b11001, 0b11001, 0b11001, 0b11001, 0b11001, 0b11001],
    [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
    [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001],
    [0b10101, 0b10010, 0b10100, 0b10110, 0b10011, 0b10100, 0b10010, 0b10101],
]

const pieces = {
    P: {
        code: 0b001,
        recursive: false,
        directions: [
            [0, -1],
            [0, -2],
        ]
    },
    N: {
        code: 0b010,
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
    K: {
        code: 0b011,
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
    B: {
        code: 0b100,
        recursive: true,
        directions: [
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1]
        ]
    },
    R: {
        code: 0b101,
        recursive: true,
        directions: [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ]
    },
    Q: {
        code: 0b110,
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
}

const colors = {
    green: {
        /*
        normal: "rgb(115,149,82)",
        yellow: "rgb(185,202,67)",
        red: "rgb(211,108,80)",
        */
        normal: "#C89768",
        yellow: "#E1C35A",
        red: "rgb(211,108,80)",
    },
    white: {
        /*
        normal: "rgb(235,236,208)",
        yellow: "rgb(245,246,130)",
        red: "rgb(235,125,106)",
        */
        normal: "#E2D4BB",
        yellow: "rgb(245,246,130)",
        red: "rgb(235,125,106)",
    },
}

class Square {
    constructor (code, div) {
        this.code = code;
        this.div = div;
        this.color = null;
        this.attacked = false;
        this.attackedFrom = null;
        this.row = parseInt(div.dataset.row);
        this.col = parseInt(div.dataset.col);

        
        document.querySelector(".game").style.display = "flex";
        document.querySelector(".home").style.display = "none";
    }

    getPieceFromCode() {
        let key = "";
        for (const k in pieces) {
            if (pieces[k].code === (this.code & 0b00111)) {
                key = k;
            }
        }

        return key;
    }

    getCodeFromPiece(piece) {
        return pieces[piece.toUpperCase()].code || 0b000;
    }

    decode() {
        const empty = ((this.code & (1 << 4)) > 0) ? 0 : 1;
        const enemy = ((this.code & (1 << 3)) > 0) ? 1 : 0;
        const pieceCode = this.code & 0b111;
        
    
        return { empty, enemy, pieceCode };
    }
    
}

export class Game {
    constructor (team) {
        this.team = team
        this.myTurn = this.team === "white" ? true : false;
        this.selectedSquare = null;
        this.handPieceDiv = null;
        this.ended = false;
        this.kingMoved = false;
        this.queensRookMoved = false;
        this.kingsRookMoved = false;
        
        this.board = [];
        this.history = [];
        this.legalMoves = [];
        this.currentLegalMoves = [];

        this.start();
    }

    //initializing

    start() {
        gameWindow.appendChild(boardDiv);
        this.initializeBoard();
        this.initializeEventListeners();

        homeScreenController.newGame();
    }

    initializeBoard() {
        boardDiv.innerHTML = "";

        let __board = board;
        if (this.team == "black") {
            __board = this.reverseBoard(board);
        }
        
        for (let y = 0; y < 8; y++) {
            this.board[y] = []; 
            for (let x = 0; x < 8; x++) {
                const squareDiv = document.createElement("div");
                squareDiv.classList.add("square");
                const isWhite = (y + x) % 2 === 0;
                squareDiv.classList.add(isWhite ? "white" : "green");
                squareDiv.dataset.row = y;
                squareDiv.dataset.col = x;
    
                const square = new Square(__board[y][x], squareDiv);
                square.color = isWhite ? "white" : "green";
                this.board[y][x] = square;
                
                boardDiv.appendChild(squareDiv);
            }
        }
    
        this.drawPieces();


    }
    
    reverseBoard(board) {
        const q1 = board[0][3];
        const q2 = board[7][3];

        board[0][3] = board[0][4];
        board[0][4] = q1;

        board[7][3] = board[7][4];
        board[7][4] = q2;

        return board;
    }

    //main methods
    drawPieces() {
        this.forEachSquare((square) => {
            const decodedSquare = square.decode(); // Pass team to decode method
            if (decodedSquare.empty) return;
    
            const exisitingImage = square.div.querySelector("img");
            if (exisitingImage) square.div.removeChild(exisitingImage);
    
            const img = document.createElement("img");
            const piece = square.getPieceFromCode();
    
            // Determine the side (whether it is white or black based on the current team)
            const side = (decodedSquare.enemy && this.team === "white") || (!decodedSquare.enemy && this.team === "black") ? "b" : "w";
    
            img.src = `chess/pieces/${side + piece}.svg`;
            img.style.height = "96%";
            img.style.width = "96%";
            img.draggable = false;
    
            square.div.appendChild(img);
        });
    }

    initializeEventListeners() {
        this.forEachSquare((square) => {
            
            square.div.addEventListener("mousedown", (e) => {
                if (e.button == 2 || this.ended) return;

                this.recolorBoard()

                if (!this.selectedSquare && this.myPiece(square)) {
                    this.selectPiece(square);
                } else if (this.selectedSquare && !this.myPiece(square) && this.myTurn) {
                    this.movePiece(square);
                } else if (this.selectedSquare) {
                    this.selectPiece(square);
                } else if (this.selectedSquare) {
                    this.selectedSquare = null;
                    this.drawPieces();
                    this.removeHandPiece();
                    this.recolorBoard();
                    this.removeCircles();
                }
            })

            square.div.addEventListener("mouseup", (e) => {
                if (e.button == 2 || !this.selectedSquare || this.ended) return;

                if (this.selectedSquare != square && !this.myPiece(square) && this.myTurn) {
                    this.movePiece(square);
                } else if (this.selectedSquare != square && this.myPiece(square) && this.myTurn) {
                    this.drawPieces();
                    this.removeHandPiece()
                } else if (this.selectedSquare == square) {
                    this.drawPieces();
                    this.removeHandPiece()
                } else if (this.selectedSquare) {
                    this.selectedSquare = null;
                    this.drawPieces();
                    this.removeHandPiece()
                    this.recolorBoard();
                    this.removeCircles();
                }
            })

            square.div.addEventListener("contextmenu", (e) => {
                if (this.ended) return;

                e.preventDefault();
                square.div.style.backgroundColor = colors[square.color].red;
            })

        })

        boardDiv.addEventListener("mousemove", (e) => {
            this.moveHandPiece(e);
        })

        boardDiv.addEventListener("mouseover", (e) => {
            this.moveHandPiece(e);
        })
    }

    selectPiece(square) {
        if (square.decode().enemy) return;

        this.removeCircles();
        this.recolorBoard();

        this.legalMoves = [];
        this.currentLegalMoves = [];
        this.selectedSquare = square;
        this.selectedSquare.div.style.backgroundColor = colors[this.selectedSquare.color].yellow;
        this.selectedSquare.div.querySelector("img").style.display = "none";
        const teamChar = this.team[0];

        this.addHandPiece(teamChar + this.selectedSquare.getPieceFromCode());

        this.findLegalMoves();

        const moves = this.getLegalMoveFromSquare(this.selectedSquare);

        moves.forEach(({row, col}) => {
            this.addCircle(this.getSquare(row, col));
            this.currentLegalMoves.push({row, col});
        })
    }

    movePiece(square) {
        let legal = false;
        for (const {row, col} of this.currentLegalMoves) {
            if (square.row === row && square.col === col) {
                legal = true;
            };
        }
        if (!legal) {
            this.selectedSquare = null;
            this.drawPieces();
            this.removeHandPiece();
            this.recolorBoard();
            this.removeCircles();
            return;
        }

        this.removeHandPiece();
        this.removeCircles();
        this.sendMove(square, this.selectedSquare);

        this.handleCastlingOnMove(square);

        this.updateAllowedToCastle(this.selectedSquare);

        square.code = this.selectedSquare.code;
        square.div.style.backgroundColor = colors[square.color].yellow;

        this.selectedSquare.code = 0b00000;
        this.selectedSquare.div.innerHTML = "";
        this.selectedSquare = null;

        this.drawPieces();
        this.removeHandPiece();
    }

    findLegalMoves() {
        this.legalMoves = [];
    
        this.forEachSquare((sq) => {
            if (!this.myPiece(sq)) return;
    
            const pieceName = sq.getPieceFromCode();
            const piece = pieces[pieceName];
    
            // Special handling for pawns
            if (pieceName === "P") {
                const forward = -1;  // Assume your pawns move up (row - 1). Adjust if needed.
                const startRow = 6;  // Replace with 1 if your pawns start at row 1
    
                // Forward move
                const oneStep = this.getSquare(sq.row + forward, sq.col);
                if (oneStep && oneStep.decode().empty) {
                    this.legalMoves.push({
                        from: { col: sq.col, row: sq.row },
                        to: { col: oneStep.col, row: oneStep.row }
                    });
    
                    // Two-step move from starting row
                    if (sq.row === startRow) {
                        const twoStep = this.getSquare(sq.row + 2 * forward, sq.col);
                        if (twoStep && twoStep.decode().empty) {
                            this.legalMoves.push({
                                from: { col: sq.col, row: sq.row },
                                to: { col: twoStep.col, row: twoStep.row }
                            });
                        }
                    }
                }
    
                // Diagonal captures
                for (const dx of [-1, 1]) {
                    const target = this.getSquare(sq.row + forward, sq.col + dx);
                    if (target && !target.decode().empty && target.decode().enemy === 1) {
                        this.legalMoves.push({
                            from: { col: sq.col, row: sq.row },
                            to: { col: target.col, row: target.row }
                        });
                    }
                }
    
                return; // Skip normal directional logic for pawns
            }

            if (pieceName === "K") {
                this.handleCastlingOnSelect()
            }
    
            // Other pieces
            for (const [dx, dy] of piece.directions) {
                let steps = piece.recursive ? 8 : 1;
    
                for (let i = 1; i <= steps; i++) {
                    const x = sq.col + dx * i;
                    const y = sq.row + dy * i;
    
                    if (!this.isInBounds(x, y)) break;
    
                    const target = this.getSquare(y, x);
                    const isMy = this.myPiece(target);
                    const isEnemy = this.enemyPiece(target);
    
                    if (isMy) break;
    
                    this.legalMoves.push({
                        from: { col: sq.col, row: sq.row },
                        to: { col: x, row: y }
                    });
    
                    if (isEnemy) break; // Stop after capturing
                }
            }
        });
    
        // Filter out illegal moves that leave king in check
        const filteredMoves = [];
    
        this.legalMoves.forEach(move => {
            const { from, to } = move;
    
            const fromSq = this.getSquare(from.row, from.col);
            const toSq = this.getSquare(to.row, to.col);
    
            const fromSqSaved = fromSq.code;
            const toSqSaved = toSq.code;
    
            toSq.code = fromSq.code;         // Simulate move
            fromSq.code = 0b00000;       // Clear from square

            this.forEachSquare(sq => {
                sq.attacked = false;
                sq.attackedFrom = null;
            });

            this.findEnemyAttacks()
    
            if (!this.kingChecked()) {
                filteredMoves.push(move);
            }
    
            // Revert state
            fromSq.code = fromSqSaved;
            toSq.code = toSqSaved;

            
        });
    
        this.legalMoves = filteredMoves;

        this.checkIfCheckMated();
    }

    findEnemyAttacks() {
        this.forEachSquare((sq) => {
            if (!this.enemyPiece(sq)) return;
    
            const pieceName = sq.getPieceFromCode();
            const piece = pieces[pieceName];
    
            if (pieceName === "P") {
                for (const dx of [-1, 1]) {
                    const x = sq.col + dx;
                    const y = sq.row + 1;
    
                    if (!this.isInBounds(x, y)) continue;
    
                    const target = this.getSquare(y, x);
                    target.attacked = true;
                    target.attackedFrom = sq.div;
                }
                return; // Skip generic piece logic
            }
    
            // All other pieces
            for (const [dx, dy] of piece.directions) {
                let steps = piece.recursive ? 8 : 1;
    
                for (let i = 1; i <= steps; i++) {
                    const x = sq.col + dx * i;
                    const y = sq.row + dy * i;
    
                    if (!this.isInBounds(x, y)) break;
    
                    const target = this.getSquare(y, x);
    
                    const isAlly = this.enemyPiece(target);  // From enemy’s perspective, this is their own piece
                    const isEnemy = this.myPiece(target)

                    if (isAlly) break;
                    
                    target.attacked = true;
                    target.attackedFrom = sq.div;

                    if (isEnemy) break;
                }
            }
        });
    }

    kingChecked() {
        if (this.getKingsSquare().attacked) return true;
        return false;
    }

    getLegalMoveFromSquare(square) {
        return this.legalMoves
            .filter(move => move.from.col === square.col && move.from.row === square.row)
            .map(move => ({ row: move.to.row, col: move.to.col }));
    }

    updateAllowedToCastle(sq) {
        const name = sq.getPieceFromCode();
        if (name !== "R" && name !== "K") return;

        if (name === "K") {
            this.kingMoved = true;
            return;
        }

        // Rook positions are always the same: 0 (queenside), 7 (kingside)
        if (sq.col === 7) {
            this.kingsRookMoved = true;
        } else if (sq.col === 0) {
            this.queensRookMoved = true;
        }
    }

    handleCastlingOnSelect() {
        if (this.kingMoved) return;

        const kingsSq = this.getKingsSquare();
        const row = 7;
        const kingSideCol = this.team === "white" ? 6 : 1;
        const queenSideCol = this.team === "white" ? 2 : 5;

        let kingsSideEmpty = true, queensSideEmpty = true;

        // Check if squares between king and kingside rook are empty
        for (let i = kingsSq.col + 1; i < 7; i++) {
            const square = this.getSquare(row, i);
            if (square.decode().empty === 0) {
                kingsSideEmpty = false;
                break;
            }
        }

        if (kingsSideEmpty && !this.kingsRookMoved) {
            this.legalMoves.push({
                from: { row: kingsSq.row, col: kingsSq.col },
                to: { row: kingsSq.row, col: kingSideCol }
            });
        }

        // Check if squares between king and queenside rook are empty
        for (let i = kingsSq.col - 1; i > 0; i--) {
            const square = this.getSquare(row, i);
            if (square.decode().empty === 0) {
                queensSideEmpty = false;
                break;
            }
        }

        if (queensSideEmpty && !this.queensRookMoved) {
            this.legalMoves.push({
                from: { row: kingsSq.row, col: kingsSq.col },
                to: { row: kingsSq.row, col: queenSideCol }
            });
        }
    }

    handleCastlingOnMove(square) {
        if (this.kingMoved) return;

        const row = 7;
        const isKingSquare = this.selectedSquare === this.getKingsSquare();

        const kingSideCol = this.team === "white" ? 6 : 1;
        const queenSideCol = this.team === "white" ? 2 : 5;

        const kingSideRookCol = this.team === "white" ? 5 : 2;
        const queenSideRookCol = this.team === "white" ? 3 : 4;

        const kingSideRook = this.team === "white" ? 7 : 0;
        const queenSideRook = this.team === "white" ? 0 : 7;

        if (isKingSquare && square.row === row && square.col === kingSideCol) {
            // King-side castling
            const rook = this.board[row][kingSideRook].code;
            this.board[row][kingSideRook].code = 0b00000;
            this.board[row][kingSideRook].div.innerHTML = "";
            this.board[row][kingSideRookCol].code = rook;
        } else if (isKingSquare && square.row === row && square.col === queenSideCol) {
            // Queen-side castling
            const rook = this.board[row][queenSideRook].code;
            this.board[row][queenSideRook].code = 0b00000;
            this.board[row][queenSideRook].div.innerHTML = "";
            this.board[row][queenSideRookCol].code = rook;
        }
    }

    handleCastlingOnReceivingMove(startSq, endSq) {
        if (startSq.getPieceFromCode() !== "K") return;
        if (Math.abs(startSq.col - endSq.col) < 2) return;

        const row = 0;
        let rookStartCol, rookEndCol;

        if (endSq.col === (this.team === "white" ? 6 : 1)) {
            // King-side castling
            rookStartCol = (this.team === "white" ? 7 : 0);
            rookEndCol = (this.team === "white" ? 5 : 2);
        } else if (endSq.col === (this.team === "white" ? 2 : 5)) {
            // Queen-side castling
            rookStartCol = (this.team === "white" ? 0 : 7);
            rookEndCol = (this.team === "white" ? 3 : 4);
        } else {
            return;
        }

        const rook = this.board[row][rookStartCol].code;
        this.board[row][rookStartCol].code = 0b00000;
        this.board[row][rookStartCol].div.innerHTML = "";
        this.board[row][rookEndCol].code = rook;
    }

    

    //networking

    sendMove(startSquare, endSquare) {
        let startPos = 0b000000;
        let endPos = 0b000000;

        startPos |= (startSquare.row << 3) | (startSquare.col);
        endPos |= (endSquare.row << 3) | (endSquare.col);

        let dataMsg = 0b000000000000 | ((startPos << 6) | endPos);

        socket.emit("move", dataMsg);
    }

    receivedMove(msgData) {
        this.legalMoves = [];
        this.recolorBoard();
        

        // Extract start and end positions
        const startPos = (msgData >> 6) & 0b111111;  // Extract start position (bits 6-11)
        const endPos = msgData & 0b111111;           // Extract end position (bits 0-5)
    
        // Extract row and column for the start square (startPos)
        const toRow = 7 - ((startPos >> 3) & 0b111); // Reverse the row and mask out the last 3 bits for row
        const toCol = 7 - (startPos & 0b111);            // Mask out the last 3 bits for column
    
        // Extract row and column for the end square (endPos)
        const fromRow = 7 - ((endPos >> 3) & 0b111);     // Reverse the row and mask out the last 3 bits for row
        const fromCol = 7 - (endPos & 0b111);                // Mask out the last 3 bits for column
    
        // Get the square objects
        const fromSq = this.getSquare(fromRow, fromCol);
        const toSq = this.getSquare(toRow, toCol);

        if (this.selectedSquare === toSq) {
            this.selectedSquare = null;
            this.removeCircles();
        }

        this.handleCastlingOnReceivingMove(fromSq, toSq);
    
        // Copy the piece from the source to the target square
        toSq.code = fromSq.code;              // Simulate the move (copy the piece)
        fromSq.code = 0b00000;                // Clear the from square (empty it)

        fromSq.div.innerHTML = "";

        fromSq.div.style.backgroundColor = colors[fromSq.color].yellow
        toSq.div.style.backgroundColor = colors[toSq.color].yellow
    
        // Recolor the board and redraw the pieces
        this.drawPieces();

        this.findLegalMoves();
    }

    endGame(lost, data) {
        this.ended = true;
        if (lost) {
            socket.emit("game-ended", data);

            const kingSq = this.getKingsSquare();
            kingSq.div.style.backgroundColor = colors[kingSq.color].red;
            return;
        }

        this.forEachSquare(sq => {
            if (sq.getPieceFromCode() === "K" && this.enemyPiece(sq)) {
                sq.div.style.backgroundColor = colors[sq.color].red;
            }
        })

        console.log("youve won!")
    }

    //small methods

    getKingsSquare() {
        let kingsSquare = null;
        this.forEachSquare(sq => {
            if (sq.getPieceFromCode() === "K" && this.myPiece(sq)) {
                kingsSquare = sq;
            }
        })
        return kingsSquare;
    }

    checkIfCheckMated() {
        if (this.legalMoves.length === 0) {
            this.endGame(true, 0b01);
        }
    }

    resign() {
        this.endGame(true, 0b10);
    }

    addHandPiece(pieceName) {
        const img = document.createElement("img");
        img.classList.add("piece-in-hand");
        img.draggable = false;
        img.src = "chess/pieces/" + pieceName + ".svg";
        const rect = boardDiv.getBoundingClientRect();
        //img.style.height = rect.height * 0.125 + "px";
        //img.style.width = rect.height * 0.125 + "px";

        this.handPieceDiv = img;

        boardDiv.appendChild(img);
    }

    moveHandPiece(e) {
        if (! this.handPieceDiv) return;
        this.handPieceDiv.style.top = e.clientY - ((window.innerHeight * 0.08) / 2) + "px";
        this.handPieceDiv.style.left = e.clientX - ((window.innerHeight * 0.08) / 2) + "px";
    }

    removeHandPiece() {
        // Check if handPieceDiv is valid and exists in the DOM
        if (this.handPieceDiv) {
            // Ensure the handPieceDiv is a child of boardDiv before removing it
            if (boardDiv.contains(this.handPieceDiv)) {
                boardDiv.removeChild(this.handPieceDiv);
                this.handPieceDiv = null; // Optionally reset the reference to prevent further issues
            }
        }
    }

    switchTurn() {
        if (this.myTurn) {
            this.myTurn = false;
        } else {
            this.myTurn = true;
        }
    }

    addCircle(square) {
        const div = document.createElement("div");
        div.classList.add("circle");

        square.div.appendChild(div);
    }

    removeCircles() {
        this.forEachSquare(square => {
            const circles = square.div.querySelectorAll(".circle");
            if (circles.length > 0) {
                for (const circle of circles) {
                    square.div.removeChild(circle);
                }
            }
        })
    }

    recolorBoard() {
        this.forEachSquare((square) => {
            square.div.style.backgroundColor = colors[square.color].normal;
        })
    }

    myPiece(square) {
        const decodedSquare = square.decode();
        if (decodedSquare.empty) return false;
        return decodedSquare.enemy === 1 ? false : true;
    }
    
    enemyPiece(square) {
        const decodedSquare = square.decode();
        if (decodedSquare.empty) return false;
        return decodedSquare.enemy === 1 ? true : false;
    }

    isInBounds(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    forEachSquare(callback) {
        this.board.forEach((row, y) => {
            row.forEach((square, x) => {
                callback(square, y, x);
            })
        })
    }

    getSquare(row, col) {
        let square = null;
        this.forEachSquare(sq => {
            if (sq.row == row && sq.col == col) {
                square = sq;
            }
        })
        return square;
    }
}

