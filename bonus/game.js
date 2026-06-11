function shuffleBoard() { //Фішер-Йєтс+перевірка к-сті інверсій
    let state = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];

    for (let i = state.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state[i], state[j]] = [state[j], state[i]];
    }

    let inversions = 0;
    for (let i = 0; i < state.length - 1; i++) {
        for (let j = i + 1; j < state.length; j++) {
            if (state[i] !== 0 && state[j] !== 0 && state[i] > state[j]) {
                inversions++;
            }
        }
    }
    
    let zeroIdx = state.indexOf(0);
    let zeroRow = Math.floor(zeroIdx / 4);
    
    if ((inversions + zeroRow) % 2 === 0) {
        if (state[0] !== 0 && state[1] !== 0) {
            [state[0], state[1]] = [state[1], state[0]];
        } else {
            [state[2], state[3]] = [state[3], state[2]];
        }
    }
    
    return state;
}

let puzzleState;
let movesCount;
let isGameOver;

function saveCurrentGame() {
    const gameState = {
        state: puzzleState,
        moves: movesCount,
        over: isGameOver
    };
    localStorage.setItem('puzzle_15_current_game', JSON.stringify(gameState));
}

function loadCurrentGame() {
    const saved = localStorage.getItem('puzzle_15_current_game');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.over) {
            return parsed;
        }
    }
    return null;
}

const restoredGame = loadCurrentGame();
if (restoredGame) {
    puzzleState = restoredGame.state;
    movesCount = restoredGame.moves;
    isGameOver = restoredGame.over;
} else {
    puzzleState = shuffleBoard();
    movesCount = 0;
    isGameOver = false;
    saveCurrentGame();
}

let initialMovesEl = document.getElementById("moves-count");
if (initialMovesEl) initialMovesEl.innerText = movesCount;

const leaderboard = {
    get() {
        const data = localStorage.getItem('puzzle_15_history_v2');
        return data ? JSON.parse(data) : {};
    },
    save(name, movesUsed, isCompleted) {
        let records = this.get();
        if (!records[name]) records[name] = [];
        
        records[name].push({ moves: movesUsed, completed: isCompleted });
        localStorage.setItem('puzzle_15_history_v2', JSON.stringify(records));
        this.render();
    },
    clear() {
        if (confirm("Точно видалити всі рекорди з таблиці?")) {
            localStorage.removeItem('puzzle_15_history_v2');
            this.render();
        }
    },
    render() {
        const records = this.get();
        const container = document.getElementById('leaderboard-container');
        const players = Object.keys(records);

        if (players.length === 0) {
            container.innerHTML = '<p class="empty-leaderboard">Таблиця порожня. Зіграй першим!</p>';
            return;
        }

        let maxGames = 0;
        players.forEach(p => {
            if (records[p].length > maxGames) maxGames = records[p].length;
        });

        let html = '<table><thead><tr>';
        html += `
          <th class="diagonal-split">
            <span class="top-right">Спроба</span>
            <span class="bottom-left">Ім'я</span>
          </th>
        `;

        for (let i = 1; i <= maxGames; i++) {
            html += `<th>${i}</th>`;
        }
        html += '</tr></thead><tbody>';

        players.forEach(name => {
            html += `<tr><td><strong>${name}</strong></td>`;
            const history = records[name];
            for (let i = 0; i < maxGames; i++) {
                if (i < history.length) {
                    let icon = history[i].completed ? '✅' : '❌';
                    html += `<td>${icon} ${history[i].moves}</td>`;
                } else {
                    html += `<td></td>`;
                }
            }
            html += `</tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }
};

function generateGridData() {
    let data = [];
    let index = 0;
    for (let r = 1; r <= 4; r++) {
        for (let c = 1; c <= 4; c++) {
            data.push({ "Рядок": "R" + r, "Колонка": "C" + c, "Значення": puzzleState[index] });
            index++;
        }
    }
    return data;
}

let reportConfig = {
    dataSource: { data: generateGridData() },
    slice: {
        rows: [{ uniqueName: "Рядок" }],
        columns: [{ uniqueName: "Колонка" }],
        measures: [{ uniqueName: "Значення", aggregation: "sum" }]
    },
    options: { 
        grid: { 
            type: "classic",
            showTotals: "off", 
            showGrandTotals: "off" 
        },
        drillThrough: false
    }
};

let pivot = new WebDataRocks({
    container: "#wdr-component",
    toolbar: false,
    report: reportConfig,
    customizeCell: function(cellBuilder, cellData) {
        if (cellData && cellData.type === "value") {
            let val = cellData.value;
            if (val === 0) {
                cellBuilder.text = `<div class="tile-empty"></div>`;
            } else {
                cellBuilder.text = `<div class="tile-number" onclick="window.handleTileClick(${val})">${val}</div>`;
            }
        }
    }
});

window.handleTileClick = function(clickedValue) {
    if (isGameOver) return;

    let emptyIndex = puzzleState.indexOf(0);
    let clickedIndex = puzzleState.indexOf(clickedValue);
    
    let emptyRow = Math.floor(emptyIndex / 4);
    let emptyCol = emptyIndex % 4;
    let clickedRow = Math.floor(clickedIndex / 4);
    let clickedCol = clickedIndex % 4;
    
    let canMove = Math.abs(emptyRow - clickedRow) + Math.abs(emptyCol - clickedCol) === 1;
    
    if (canMove) {
        puzzleState[emptyIndex] = clickedValue;
        puzzleState[clickedIndex] = 0;
        
        movesCount++;
        let movesEl = document.getElementById("moves-count");
        if (movesEl) movesEl.innerText = movesCount;
        
        saveCurrentGame();
        checkWinCondition();
        
        pivot.updateData({
            data: generateGridData()
        });
    }
};

function checkWinCondition() {
    const winningPattern = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
    let isWin = true;
    
    for (let i = 0; i < puzzleState.length; i++) {
        if (puzzleState[i] !== winningPattern[i]) {
            isWin = false;
            break;
        }
    }
    
    if (isWin) {
        isGameOver = true;
        saveCurrentGame();
        
        let statusElement = document.getElementById("game-status");
        if (statusElement) {
            statusElement.innerText = "Перемога! 🎉";
            statusElement.className = "win-status";
        }

        document.getElementById('restart-btn').classList.remove('hidden');
        
        setTimeout(() => {
            const name = prompt(`Вітаємо! Ти зібрав п'ятнашки за ${movesCount} кроків. Введи своє ім'я для таблиці:`);
            if (name && name.trim() !== '') {
                leaderboard.save(name.trim(), movesCount, true);
            }
        }, 500);
    }
}

function restartGame() {
    puzzleState = shuffleBoard();
    movesCount = 0;
    isGameOver = false;
    saveCurrentGame();

    let movesEl = document.getElementById("moves-count");
    if (movesEl) movesEl.innerText = movesCount;

    let statusElement = document.getElementById("game-status");
    if (statusElement) {
        statusElement.innerText = "Гра триває";
        statusElement.className = "";
    }

    document.getElementById('restart-btn').classList.add('hidden');

    pivot.updateData({
        data: generateGridData()
    });
}

document.getElementById('give-up-btn').addEventListener('click', function() {
    if (isGameOver) return;
    
    isGameOver = true;
    saveCurrentGame();
    
    let statusElement = document.getElementById("game-status");
    if (statusElement) {
        statusElement.innerText = "Гру перервано ❌";
        statusElement.className = "lose-status";
    }

    document.getElementById('restart-btn').classList.remove('hidden');
    
    setTimeout(() => {
        const name = prompt(`Ти здався після ${movesCount} кроків. Введи своє ім'я для таблиці:`);
        if (name && name.trim() !== '') {
            leaderboard.save(name.trim(), movesCount, false);
        }
    }, 200);
});

document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('clear-btn').addEventListener('click', () => leaderboard.clear());

leaderboard.render();