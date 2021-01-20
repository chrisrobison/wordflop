function $(str) {
    return document.querySelector(str);
}

function $$(str) {
    return document.querySelectorAll(str);
}

(function() {
    const app = {
        config: {
            scoreGoal: 300,
            cellHeight: 34,
            cellWidth: 34,
            rows: 20,
            cols: 15,
            items: { "A": { freq: 82, value: 1 }, "B": { freq: 15, value: 3 }, "C": { freq: 28, value: 3 }, "D": { freq: 43, value: 2 }, "E": { freq: 127, value: 1 }, "F": { freq: 22, value: 4 }, "G": { freq: 20, value: 2 }, "H": { freq: 61, value: 4 }, "I": { freq: 70, value: 1 }, "J": { freq: 2, value: 8 }, "K": { freq: 8, value: 5 }, "L": { freq: 40, value: 1 }, "M": { freq: 24, value: 3 }, "N": { freq: 67, value: 1 }, "O": { freq: 75, value: 1 }, "P": { freq: 19, value: 3 }, "Q": { freq: 1, value: 10 }, "R": { freq: 60, value: 1 }, "S": { freq: 63, value: 1 }, "T": { freq: 91, value: 1 }, "U": { freq: 28, value: 1 }, "V": { freq: 10, value: 4 }, "W": { freq: 24, value: 4 }, "X": { freq: 2, value: 8 }, "Y": { freq: 20, value: 4 }, "Z": { freq: 1, value: 10 } }
        },
        state: {
            loaded: false,
            board: [],
            words: [],
            letters: [],
            events: {},
            currentWord: "",
            currentWordScore: 0,
            current: {
                cells: [],
                word: [],
                used: [],
                lines: []
            },
            currentPlayer: 0,
            queue: [],
            players: [{
                    name: "Player 1",
                    words: [],
                    scores: [],
                    score: 0
                },
                {
                    name: "Player 2",
                    words: [],
                    scores: [],
                    score: 0
                }
            ]
        },
        init: function() {
            app.state.loaded = true;
            fetch("all.js").then(response => response.json()).then(data => { app.state.dictionary = data; });

            app.initLetters();

            app.buildBoard();
            app.fillBoard();

            $("#board").addEventListener("mousedown", app.doDown);
        },
        initLetters: function() {
            // Create a pool of letters that is filled according to letter frequencies
            let letterString = "";

            for (const [key, value] of Object.entries(app.config.items)) {
                letterString += key.repeat(value.freq);
            }

            app.state.letters = letterString.split('');
            app.shuffle(app.state.letters);
            app.shuffle(app.state.letters);
            app.state.letterString = app.state.letters.join('');
            console.log(app.state.letterString);
        },
        checkWord: function(word) {
            let d = app.state.dictionary;
            let letter, fullword = word;
            let letters = word.split('');

            while (letter = letters.shift()) {
                console.log("letter: " + letter);
                if (!d || (d && !d[letter] && !d['$'])) {
                    return false;
                } else {
                    if (d[letter]) {
                        d = d[letter];
                    } else {
                        return false;
                    }
                }
            }
            console.dir(d);
            if (d['$']) {
                return fullword;
            }
        },
        getCoord: function(id) {
            id = id.replace(/^letter_/, '');
            let parts = id.split(/\D/).slice(1);

            return {
                y: parts[0], row: parts[0],
                x: parts[1], col: parts[1]
            };
        },
        getCell: function(x, y) {
            let col = Math.floor(x / app.config.cellWidth);
            let row = Math.floor(y / app.config.cellHeight);
            return { 
                id: `r${row}c${col}`, 
                el: $(`#r${row}c${col}`), 
                row: row,
                col: col
            };
        },
        mkLine: function(x, y) {
            app.state.current.lines.push(app.state.currentLine);

            const line = document.createElement('div');
            app.state.currentLine = line;

            // Use maths to determine line length and angle between 
            // last known position and current x,y coordinates
            let dx = app.state.lastPos.x - x;
            let dy = app.state.lastPos.y - y;

            let theta = Math.atan2(dy, dx);
            theta *= 180 / Math.PI;
            if (theta < 0) theta = 360 + theta;
            theta -= 180;
            let angle = Math.round(theta / 45) * 45;
            let len = Math.sqrt((dx * dx) + (dy * dy));

            line.classList.add('line');
            line.style.top = ((Math.round(app.state.lastPos.y / app.config.cellHeight) * app.config.cellHeight) - 19) + 'px';
            line.style.left = ((Math.round(app.state.lastPos.x / app.config.cellWidth) * app.config.cellWidth) - 19) + 'px';
            line.style.transform = `rotate(-${angle}deg)`;
            line.style.width = len + 'px';
            line.style.height = (app.config.cellHeight - 3) + "px";
            $("main").appendChild(line);

            app.state.current.lines.unshift(line);

            return line;
        },
        doDown: function(e) {
            console.dir(e);
//            if (!e.target.id.match(/^letter_/)) { return false; }
            app.state.lastPos = {
                x: e.clientX,
                y: e.clientY
            };
            app.state.offsetPos = {
                x: e.target.offsetX,
                y: e.target.offsetY
            };
            //e.target.classList.add('selected');
            let coord = app.getCoord(e.target.id);
            app.state.currentWord = app.state.board[coord.y][coord.x];
            $("#currentWord").innerHTML = app.state.currentWord;
            app.state.current.cells.push(e.target);

            app.state.events.mouseover = $("#board").addEventListener("mouseover", app.doOver);

            $("#board").addEventListener("mouseup", app.doUp);
            $("#board").addEventListener("mousemove", app.doMove);
            app.state.currentWordScore = 0;
            app.mkLine(e.clientX + 5, e.clientY + 5);
        },
        doMove: function(e) {
            let dx, dy, theta, len;
            dx = app.state.lastPos.x - e.clientX;
            dy = app.state.lastPos.y - e.clientY;

            len = Math.sqrt((dx * dx) + (dy * dy));
            theta = 360 - (Math.atan2(dy, dx) * (180 / Math.PI));

            let angle = Math.round(theta / 45) * 45;
            //l.style.top = ((Math.round(app.state.lastPos.y / app.config.cellHeight) * app.config.cellHeight)  ) + 'px';
            //l.style.left = ((Math.round(app.state.lastPos.x / app.config.cellWidth) * app.config.cellWidth) ) + 'px';

            // let newwidth = Math.round(len / app.config.cellWidth) * app.config.cellWidth;
            if (app.state.current.lines[0]) {
                app.state.current.lines[0].style.transform = `scaleX(-1) rotate(${angle}deg)`;
                app.state.current.lines[0].style.width = len + app.config.cellWidth + 'px';
            }
            
            /*
            let cell = app.getCell(e.x, e.y);
            let start = app.getCell(app.state.lastPos.x, app.state.lastPos.y);

            let newword = app.getLetters(start.id, cell.id);
            app.state.currentWord = newword;
            $("#currentWord").innerHTML = newword;
            */
        },
        doUp: function(e) {
            console.log("mouseup");
            $("#board").removeEventListener("mouseover", app.doOver);
            $("#board").removeEventListener("mouseup", app.doUp);
            $("#board").removeEventListener("mousemove", app.doMove);
            app.state.currentLine.remove();

            let cell = app.getCell(e.x, e.y);
            let start = app.getCell(app.state.lastPos.x, app.state.lastPos.y);

            let newword = app.getLetters(start.id, cell.id);
            app.state.currentWord = newword;
            $("#currentWord").innerHTML = newword;

            let word = app.checkWord(app.state.currentWord);

            if (word) {
                app.gotWord(word);
            } else {
                app.state.current.cells = [];
                app.state.current.used = [];
                app.state.current.word = [];
            }

            $$(".selected").forEach(function(el) {
                el.classList.remove('selected');
            });
            app.state.currentWord = "";
            app.state.current.word = [];
            //app.state.currentPlayer ^= 1;
            app.switchPlayer();

            //$("#currentWord").innerHTML = app.state.currentWord;
        },
        switchPlayer: function() {
            $("main").classList.remove("player" + app.state.currentPlayer);
            app.state.currentPlayer ^= 1;
            $("main").classList.add("player" + app.state.currentPlayer);
        },
        doOver: function(e) {
            clearTimeout(app.state.overTimeout);
            clearTimeout(app.state.lineTimeout);
            console.log("doOver");
            console.dir(e);
            let tgt = e.target;
            //$(`#r${coords.y}c${coords.x}`).classList.add('selected');
            
//            if (e.target.id.match(/^letter/)) {
                app.state.overTimeout = setTimeout(function() { app.addCell(e.target); }, 200);
                app.state.lineTimeout = setTimeout(function() { app.newSegment(e.target, e.clientX, e.clientY); }, 1000);
//            }

        },
        newSegment: function(cell, x, y) {
            app.state.lastPos = {
                x: x,
                y: y
            };
            let line = app.mkLine(x + 5, y + 5);
            
        },
        addCell: function(cell) {
            const key = cell.id.replace(/^letter_/, '');
            const coords = app.getCoord(cell.id);

            if (!app.state.current.used.includes(key)) {
                let ltr = app.state.board[coords.y][coords.x];
                console.log("Adding " + ltr + " to word [" + app.state.currentWord + "]");
                app.state.currentWord += ltr;
                app.state.currentWordScore += (app.config.items[ltr].value * (app.state.currentWord.length + 1));
                $("#currentWord").innerHTML = app.state.currentWord + '[' + app.state.currentWordScore + ']';
                app.state.current.word.push(ltr);
                app.state.current.cells.push(cell);
                app.state.current.used.push(key);
            }
             
        },
        getLetters: function() {
            let out = '';

            app.state.current.cells.forEach(function(item) { 
                const [r, c] = item.id.replace(/^letter_/,'').split(/\D/).splice(1);
                out += app.state.board[r][c];
            });

            return out;
        },
        shuffle: function(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        },
        buildBoard: function() {
            let out = "",
                x1 = 0,
                x2 = 14,
                xtra = "";
            const extra = ['ls-2x', 'ls-3x', 'ws-2x', 'ws-3x'];
            for (let r = 0; r < app.config.rows; r++) {
                out += "<div class='row'>";
                for (let c = 0; c < app.config.cols; c++) {
                    if ((x1 == c) || (x2 == c)) {
                        xtra = extra[2];
                    } else {
                        xtra = '';
                    }
                    out += `<div class='cell ${xtra}' id='r${r}c${c}'></div>`;
                }
                x1++;
                x2--;
                if (x1 > 14) x1 = 0;
                if (x2 < 0) x2 = 14;
                out += "</div>";
            }

            out += "<div id='currentWord'></div>";
            $("#board").innerHTML = out;

        },
        fillBoard: function() {
            for (let r = 0; r < app.config.rows; r++) {
                app.state.board[r] = [];
                for (let c = 0; c < app.config.cols; c++) {
                    app.state.board[r][c] = app.state.letters[Math.floor(Math.random() * app.state.letters.length)];
                    const el = app.mkletter(r, c, app.state.board[r][c]);
                    $("#board").appendChild(el);
                    // $(`#r${r}c${c}`).innerHTML = app.state.board[r][c];
                }
            }
        },
        dropCells: function() {
            for (let c = 0; c < app.config.cols; c++) {
                for (let r = app.config.rows - 1; r >= 0; r--) {
                    if (app.state.board[r][c] == "") {
                        app.shiftDown(c);
                    }
                }
            }
        },
        moveItem: function(el, x, y, delay = 10) {
            setTimeout(function() {
                if (x) {
                    el.style.left = x;
                }
                if (y) {
                    el.style.top = y;
                }
            }, delay);
        },
        runqueue: function() {
            if (app.state.queue.length) {
                let obj = app.state.queue.shift();

                if (obj) {
                    setTimeout(function() {
                        obj.el.style.top = obj.y;
                        obj.el.style.left = obj.x;
                        obj.el.id = obj.id;

                        app.runqueue();
                    }, obj.delay);
                }
            }
        },
        shiftDown: function(col) {
            let cnt = 0;
            for (let r = 0; r < app.config.rows; r++) {
                if (app.state.board[r][col] == "") {
                    cnt++;
                    $("#letter_r" + r + "c" + col).parentElement.removeChild($("#letter_r" + r + "c" + col));
                    for (let r2 = r; r2 > 0; r2--) {
                        app.state.board[r2][col] = app.state.board[r2 - 1][col];
                        let obj = {
                            el: $("#letter_r" + (r2 - 1) + "c" + col),
                            x: (col * app.config.cellWidth) + "px",
                            y: (r2 * app.config.cellHeight) + "px",
                            newid: "#letter_r" + r2 + "c" + col,
                            delay: 100
                        };
                        let el = $("#letter_r" + (r2 - 1) + "c" + col);
                        app.moveItem(el, obj.x, obj.y, 10);
                        $("#letter_r" + (r2 - 1) + "c" + col).id = "letter_r" + r2 + "c" + col;
                    }
                    app.state.board[0][col] = app.state.letters[Math.floor(Math.random() * app.state.letters.length)];
                    let el = app.mkletter(0, col, app.state.board[0][col]);
                    el.style.top = '-' + app.config.cellHeight + 'px';
                    $("#board").appendChild(el);
                    setTimeout(function() {
                        $("#letter_r0c" + col).style.top = '0px';
                    }, cnt * 100);
                }
            }
            if (cnt && cnt < 10) {
                setTimeout(function() {
                    app.shiftDown(col);
                }, cnt * 500);
            }
        },
        gotWord: function(word) {
            if (!word) return false;
            app.state.players[app.state.currentPlayer].words.push(word);
            app.state.players[app.state.currentPlayer].scores.push(app.state.currentWordScore);
            app.state.players[app.state.currentPlayer].score += app.state.currentWordScore;

            $(`#player${app.state.currentPlayer}Words`).innerHTML += `<div class='found'>${word} [${app.state.currentWordScore}]</div>`;
            $(`#player${app.state.currentPlayer}Score`).innerHTML = app.state.players[app.state.currentPlayer].score + " / " + app.config.scoreGoal;

            app.state.current.cells.forEach((item) => {
                let c = app.getCoord(item.id);
                app.state.board[c.y][c.x] = '';
                //                    item.parentElement.removeChild(item);
            });
            app.state.current.cells = [];
            app.state.current.used = [];
            app.state.current.word = [];

            let elClone = $("#currentWord").cloneNode(true);
            elClone.classList.add("currentWord");
            elClone.style.top = "100%";
            elClone.style.left = "50%";
            $("#board").appendChild(elClone);
            elClone.addEventListener('transitionend', function(e) {
                elClone.remove();
            });
            let ll = (app.state.currentPlayer) ? "140%" : "-40%";


            setTimeout(function() {
                elClone.style.top = '10%';
                elClone.style.left = ll;
            }, 100);
            setTimeout(function() {
                app.dropCells();
            }, 300);

        },
        mkletter: function(row = 0, col = 0, letter = '') {
            let el = document.createElement('div');
            el.id = `letter_r${row}c${col}`;
            el.className = 'letter';
            el.innerHTML = letter;
            //            el.draggable = "true";

            el.style.top = ((row * app.config.cellHeight)) + 'px';
            el.style.left = ((col * app.config.cellWidth)) + 'px';

            return el;
        },
        dumpBoard: function() {
            let out = '';
            for (let r = 0; r < app.config.rows; r++) {

                for (let c = 0; c < app.config.cols; c++) {
                    out += app.state.board[r][c];
                }
                out += "\n";
            }
            console.log(out);
        }

    }
    window.app = app;
    app.init();
})();
