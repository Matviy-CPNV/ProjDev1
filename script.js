const BOARD_SIZE = 8;
const CANDY_TYPES = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒'];
const CANDY_COLORS = ['red', 'orange', 'yellow', 'purple', 'green', 'blue'];

let board = [];
let score = 0;
let moves = 30;
let selectedCandy = null;
let gameActive = true;

function initGame() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    board = [];
    
    // Créer le plateau
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            let candyType;
            do {
                candyType = Math.floor(Math.random() * CANDY_TYPES.length);
            } while (wouldCreateMatch(row, col, candyType));
            
            board[row][col] = candyType;
            
            const candy = document.createElement('div');
            candy.className = `candy ${CANDY_COLORS[candyType]}`;
            candy.textContent = CANDY_TYPES[candyType];
            candy.dataset.row = row;
            candy.dataset.col = col;
            candy.addEventListener('click', () => selectCandy(row, col));
            
            gameBoard.appendChild(candy);
        }
    }
    
    updateDisplay();
    showMessage('Alignez 3 bonbons ou plus !', 'info');
}

function wouldCreateMatch(row, col, candyType) {
    // Vérifier horizontalement
    let count = 1;
    if (col >= 2 && board[row][col-1] === candyType && board[row][col-2] === candyType) {
        return true;
    }
    
    // Vérifier verticalement
    if (row >= 2 && board[row-1] && board[row-1][col] === candyType && 
        board[row-2] && board[row-2][col] === candyType) {
        return true;
    }
    
    return false;
}

function selectCandy(row, col) {
    if (!gameActive) return;
    
    const candy = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (selectedCandy) {
        // Désélectionner le bonbon précédent
        document.querySelector('.candy.selected')?.classList.remove('selected');
        
        if (selectedCandy.row === row && selectedCandy.col === col) {
            selectedCandy = null;
            return;
        }
        
        // Vérifier si le mouvement est valide (adjacent)
        if (isAdjacent(selectedCandy.row, selectedCandy.col, row, col)) {
            makeMove(selectedCandy.row, selectedCandy.col, row, col);
        }
        selectedCandy = null;
    } else {
        selectedCandy = { row, col };
        candy.classList.add('selected');
    }
}

function isAdjacent(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function makeMove(row1, col1, row2, col2) {
    // Échanger les bonbons
    const temp = board[row1][col1];
    board[row1][col1] = board[row2][col2];
    board[row2][col2] = temp;
    
    // Vérifier s'il y a des matches
    const matches = findMatches();
    
    if (matches.length > 0) {
        moves--;
        updateBoard();
        setTimeout(() => {
            processMatches(matches);
        }, 300);
    } else {
        // Annuler le mouvement si pas de match
        board[row1][col1] = board[row2][col2];
        board[row2][col2] = temp;
        showMessage('Aucun match trouvé !', 'info');
    }
}

function findMatches() {
    const matches = [];
    
    // Vérifier les matches horizontaux
    for (let row = 0; row < BOARD_SIZE; row++) {
        let count = 1;
        let currentType = board[row][0];
        
        for (let col = 1; col < BOARD_SIZE; col++) {
            if (board[row][col] === currentType) {
                count++;
            } else {
                if (count >= 3) {
                    for (let i = col - count; i < col; i++) {
                        matches.push({ row, col: i });
                    }
                }
                count = 1;
                currentType = board[row][col];
            }
        }
        
        if (count >= 3) {
            for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
                matches.push({ row, col: i });
            }
        }
    }
    
    // Vérifier les matches verticaux
    for (let col = 0; col < BOARD_SIZE; col++) {
        let count = 1;
        let currentType = board[0][col];
        
        for (let row = 1; row < BOARD_SIZE; row++) {
            if (board[row][col] === currentType) {
                count++;
            } else {
                if (count >= 3) {
                    for (let i = row - count; i < row; i++) {
                        matches.push({ row: i, col });
                    }
                }
                count = 1;
                currentType = board[row][col];
            }
        }
        
        if (count >= 3) {
            for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
                matches.push({ row: i, col });
            }
        }
    }
    
    return matches;
}

function processMatches(matches) {
    // Animer la disparition des bonbons
    matches.forEach(match => {
        const candy = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
        candy.classList.add('matched');
    });
    
    // Calculer le score
    const points = matches.length * 100;
    score += points;
    showMessage(`+${points} points !`, 'success');
    
    setTimeout(() => {
        // Faire tomber les bonbons
        dropCandies(matches);
        
        setTimeout(() => {
            // Vérifier s'il y a de nouveaux matches
            const newMatches = findMatches();
            if (newMatches.length > 0) {
                processMatches(newMatches);
            } else {
                checkGameEnd();
            }
        }, 600);
    }, 400);
}

function dropCandies(matches) {
    // Marquer les positions vides
    matches.forEach(match => {
        board[match.row][match.col] = -1;
    });
    
    // Faire tomber les bonbons
    for (let col = 0; col < BOARD_SIZE; col++) {
        let writePos = BOARD_SIZE - 1;
        
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            if (board[row][col] !== -1) {
                board[writePos][col] = board[row][col];
                if (writePos !== row) {
                    board[row][col] = -1;
                }
                writePos--;
            }
        }
        
        // Remplir avec de nouveaux bonbons
        for (let row = writePos; row >= 0; row--) {
            board[row][col] = Math.floor(Math.random() * CANDY_TYPES.length);
        }
    }
    
    updateBoard();
}

function updateBoard() {
    const gameBoard = document.getElementById('gameBoard');
    const candies = gameBoard.children;
    
    for (let i = 0; i < candies.length; i++) {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        const candy = candies[i];
        
        candy.className = `candy ${CANDY_COLORS[board[row][col]]}`;
        candy.textContent = CANDY_TYPES[board[row][col]];
        candy.classList.add('falling');
        
        setTimeout(() => {
            candy.classList.remove('falling', 'matched', 'selected');
        }, 500);
    }
    
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
}

function checkGameEnd() {
    if (moves <= 0) {
        gameActive = false;
        if (score >= 5000) {
            showMessage('🎉 Félicitations ! Vous avez gagné ! 🎉', 'success');
        } else {
            showMessage('😔 Partie terminée ! Essayez encore !', 'info');
        }
    }
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = `message ${type}`;
}

function newGame() {
    score = 0;
    moves = 30;
    gameActive = true;
    selectedCandy = null;
    initGame();
}

function showHint() {
    if (!gameActive) return;
    
    // Trouver un mouvement possible
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // Vérifier les mouvements adjacents
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            
            for (let [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    // Simuler l'échange
                    const temp = board[row][col];
                    board[row][col] = board[newRow][newCol];
                    board[newRow][newCol] = temp;
                    
                    if (findMatches().length > 0) {
                        // Annuler l'échange
                        board[newRow][newCol] = board[row][col];
                        board[row][col] = temp;
                        
                        // Montrer l'indice
                        const candy1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        const candy2 = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                        
                        candy1.style.boxShadow = '0 0 20px #00ff00';
                        candy2.style.boxShadow = '0 0 20px #00ff00';
                        
                        setTimeout(() => {
                            candy1.style.boxShadow = '';
                            candy2.style.boxShadow = '';
                        }, 2000);
                        
                        showMessage('Essayez d\'échanger ces bonbons !', 'info');
                        return;
                    }
                    
                    // Annuler l'échange
                    board[newRow][newCol] = board[row][col];
                    board[row][col] = temp;
                }
            }
        }
    }
    
    showMessage('Aucun mouvement possible trouvé !', 'info');
}

// Initialiser le jeu
initGame();

// (script additionnel inchangé)
(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'97535fd095f327b5',t:'MTc1NjIxMTc4MS4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();
