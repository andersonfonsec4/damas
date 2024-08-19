const board = document.getElementById("game-board");
let currentPlayer = 'white';
let selectedPiece = null;
let validMoves = [];
let hasCaptured = false;
let vsAI = false;
let mustContinue = false;  // Flag para forçar continuação do movimento se houver capturas adicionais

// Função para criar o tabuleiro
function createBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = document.createElement("div");
            square.classList.add("square");

            if ((i + j) % 2 === 0) {
                square.classList.add("light");
            } else {
                square.classList.add("dark");
                square.setAttribute('data-row', i);
                square.setAttribute('data-col', j);

                if (i < 3) {
                    const piece = document.createElement("div");
                    piece.classList.add("piece", "black");
                    piece.setAttribute('data-color', 'black');
                    square.appendChild(piece);
                } else if (i > 4) {
                    const piece = document.createElement("div");
                    piece.classList.add("piece", "white");
                    piece.setAttribute('data-color', 'white');
                    square.appendChild(piece);
                }
            }

            board.appendChild(square);
        }
    }
}

// Função para detectar movimentos válidos e capturas
function getValidMoves(row, col, color, isKing) {
    const moves = [];
    const directions = isKing ? [[1, -1], [1, 1], [-1, -1], [-1, 1]] : color === 'white' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

    directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        const targetSquare = document.querySelector(`.square[data-row="${newRow}"][data-col="${newCol}"]`);

        // Movimento simples
        if (targetSquare && targetSquare.children.length === 0 && !hasCaptured) {
            moves.push(targetSquare);
        }

        // Captura
        const captureRow = newRow + dx;
        const captureCol = newCol + dy;
        const captureSquare = document.querySelector(`.square[data-row="${captureRow}"][data-col="${captureCol}"]`);

        if (targetSquare && targetSquare.children.length > 0 && targetSquare.children[0].getAttribute('data-color') !== color) {
            if (captureSquare && captureSquare.children.length === 0) {
                moves.push(captureSquare);
                captureSquare.setAttribute('data-capture', `${newRow},${newCol}`);
            }
        }
    });

    return moves;
}

// Função para mover a peça
function movePiece(piece, targetSquare) {
    const parentSquare = piece.parentElement;
    const row = parseInt(parentSquare.getAttribute('data-row'));
    const col = parseInt(parentSquare.getAttribute('data-col'));
    
    targetSquare.appendChild(piece);
    piece.classList.remove('selected');
    selectedPiece = null;

    // Promoção para dama
    const newRow = parseInt(targetSquare.getAttribute('data-row'));
    if ((newRow === 0 && piece.getAttribute('data-color') === 'white') || (newRow === 7 && piece.getAttribute('data-color') === 'black')) {
        piece.classList.add('king');
    }

    // Captura
    if (targetSquare.hasAttribute('data-capture')) {
        const [captureRow, captureCol] = targetSquare.getAttribute('data-capture').split(',').map(Number);
        const capturedPiece = document.querySelector(`.square[data-row="${captureRow}"][data-col="${captureCol}"]`).children[0];
        capturedPiece.parentElement.removeChild(capturedPiece);
        targetSquare.removeAttribute('data-capture');
        hasCaptured = true;
        mustContinue = true;  // Forçar continuidade do movimento após uma captura
    }

    // Remove destaques e listeners de quadrados anteriores
    validMoves.forEach(square => {
        square.classList.remove('highlight');
        square.replaceWith(square.cloneNode(true));
    });
    validMoves = [];

    // Verifica se há capturas adicionais e força o movimento contínuo
    if (hasCaptured && checkForAdditionalCapture(piece, newRow, col)) {
        piece.classList.add('selected');
        selectedPiece = piece;
        return;
    }

    // Se não houver capturas ou movimentos adicionais, passa o turno
    hasCaptured = false;
    mustContinue = false;
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

    if (vsAI && currentPlayer === 'black') {
        setTimeout(computerMove, 500); // Jogada do computador
    }

    checkForVictory();
}

// Função para verificar capturas adicionais
function checkForAdditionalCapture(piece, row, col) {
    const color = piece.getAttribute('data-color');
    const isKing = piece.classList.contains('king');
    const captureMoves = getValidMoves(row, col, color, isKing).filter(square => square.hasAttribute('data-capture'));

    if (captureMoves.length > 0) {
        captureMoves.forEach(square => {
            square.classList.add('highlight');
            square.addEventListener('click', () => {
                movePiece(piece, square);
            }, { once: true });
        });
        return true;
    }

    return false;
}

// Função para selecionar uma peça
function selectPiece(piece) {
    // Se a flag mustContinue estiver ativa, forçamos o jogador a continuar com a mesma peça
    if (mustContinue && selectedPiece !== piece) return;

    // Permite mover novamente a peça que já foi movida
    if (selectedPiece === piece && !hasCaptured) return;

    // Impede a seleção de peças do adversário ou peças do AI quando está jogando
    if (piece.getAttribute('data-color') !== currentPlayer || (vsAI && currentPlayer === 'black')) return;

    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
    }

    selectedPiece = piece;
    selectedPiece.classList.add('selected');

    const parentSquare = piece.parentElement;
    const row = parseInt(parentSquare.getAttribute('data-row'));
    const col = parseInt(parentSquare.getAttribute('data-col'));
    const isKing = piece.classList.contains('king');

    validMoves = getValidMoves(row, col, currentPlayer, isKing);

    validMoves.forEach(square => {
        square.classList.add('highlight');
        square.addEventListener('click', () => {
            movePiece(selectedPiece, square);
        }, { once: true });
    });
}

// Função para verificar a vitória
function checkForVictory() {
    const whitePieces = document.querySelectorAll(".piece.white").length;
    const blackPieces = document.querySelectorAll(".piece.black").length;

    if (whitePieces === 0) {
        alert("Jogador Preto venceu!");
        resetGame();
    } else if (blackPieces === 0) {
        alert("Jogador Branco venceu!");
        resetGame();
    }
}

// Função para resetar o jogo
function resetGame() {
    board.innerHTML = '';
    currentPlayer = 'white';  // Reset para o jogador branco começar
    hasCaptured = false;
    selectedPiece = null;
    validMoves = [];
    mustContinue = false;  // Reset flag forçando o movimento contínuo
    createBoard();
    initializeGame();
}

// Lógica básica do computador com captura prioritária
function computerMove() {
    const blackPieces = document.querySelectorAll(".piece.black");
    const captureMoves = [];
    const regularMoves = [];

    blackPieces.forEach(piece => {
        const parentSquare = piece.parentElement;
        const row = parseInt(parentSquare.getAttribute('data-row'));
        const col = parseInt(parentSquare.getAttribute('data-col'));
        const isKing = piece.classList.contains('king');
        const moves = getValidMoves(row, col, 'black', isKing);

        moves.forEach(move => {
            if (move.hasAttribute('data-capture')) {
                captureMoves.push({ piece, move });
            } else {
                regularMoves.push({ piece, move });
            }
        });
    });

    if (captureMoves.length > 0) {
        // Executa a captura
        const { piece, move } = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        movePiece(piece, move);
    } else if (regularMoves.length > 0) {
        // Executa um movimento regular
        const { piece, move } = regularMoves[Math.floor(Math.random() * regularMoves.length)];
        movePiece(piece, move);
    }

    checkForVictory();
}

// Inicializa o jogo
function initializeGame() {
    const pieces = document.querySelectorAll(".piece");

    pieces.forEach(piece => {
        piece.addEventListener("click", () => {
            selectPiece(piece);
        });
    });
}

document.getElementById("play-vs-ai").addEventListener("click", () => {
    vsAI = true;
    resetGame();
});

createBoard();
initializeGame();
