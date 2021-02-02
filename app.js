function $(str) {
    return document.querySelector(str);
}

function $$(str) {
    return document.querySelectorAll(str);
}

(function() {
    /** @type {*} */
    const app = {
        config: {
            scoreGoal: 300,
            cellHeight: 34,
            cellWidth: 34,
            rows: 15,
            cols: 10,
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
            app.initLetters();
            app.buildBoard();
            fetch("all.js").then(response => response.json()).then(data => {
                app.state.dictionary = data;
                app.findWords();
            });

            fetch("4-6letter.txt").then(response => response.text()).then(data => {
                app.state.allwords = data.split(/\n/);
                //console.dir(app.state.allwords);
                app.saltBoard();
                app.fillBoard();
            });
            
            //app.fillBoard();
            // app.makeTimer(10);

            $("#board").addEventListener("mousedown", app.doDown);
            $("#player0Words").addEventListener("mouseover", app.highlightWord);
        },
        highlightWord: function(e) {
            if (e.target.id.match(/^word/)) {
                const hl = $$(".highlighted");
                hl.forEach(item => item.classList.remove('highlighted'));
                let parts = e.target.id.split(/\-/);
                let start = app.getCoord(parts[1]);
                let end = app.getCoord(parts[2]);

                let r1 = parseInt(start.row),
                    c1 = parseInt(start.col),
                    r2 = parseInt(end.row),
                    c2 = parseInt(end.col);

                let ri = (r1 == r2) ? 0 : ((r1 > r2) ? -1 : 1);
                let ci = (c1 == c2) ? 0 : ((c1 > c2) ? -1 : 1);

                if (r1 == r2) ri = 0;
                if (c1 == c2) ci = 0;
                let curRow = r1,
                    curCol = c1, cnt = 1;

                while ((curRow != r2 ) || (curCol != c2 )) {
                    $(`#letter_r${curRow}c${curCol}`).classList.add('highlighted');
                    curRow += ri;
                    curCol += ci;
                }
            } 
        },
        doHighlight: function(e) {
            const hl = $$(".highlighted");
            hl.forEach(item => item.classList.remove('highlighted'));

            let id = e.target.id.replace(/^letter_/, '');
            $(`#${id}`).classList.add('highlighted');

        },
        /**
         *  initLetters
         * 
         *  Create a pool of letters that is filled according to letter frequencies
         *
         **/
        initLetters: function() {
            let letterString = "";

            for (const [key, value] of Object.entries(app.config.items)) {
                letterString += key.repeat(value.freq);
            }

            app.state.letters = letterString.split('');
            app.shuffle(app.state.letters);
            app.shuffle(app.state.letters);
            app.state.letterString = app.state.letters.join('');
            //console.log(app.state.letterString);
        },
        checkWord: function(word) {
            let d = app.state.dictionary;
            let letter, fullword = word;
            let letters = word.split('');

            while (letter = letters.shift()) {
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
            //console.dir(d);
            if (d['$']) {
                return fullword;
            }
        },
        getCoord: function(id) {
            id = id.replace(/^letter_/, '');
            let parts = id.split(/\D/).slice(1);

            return {
                y: parseInt(parts[0]) * app.config.cellHeight,
                row: parseInt(parts[0]),
                x: parseInt(parts[1]) * app.config.cellWidth,
                col: parseInt(parts[1])
            };
        },
        getCell: function(x, y) {
            //console.log("getting cell: [" + x + "," + y + "]");

            let col = Math.floor(x / app.config.cellWidth);
            let row = Math.floor(y / app.config.cellHeight);
            let out = {
                id: `r${row}c${col}`,
                el: $(`#r${row}c${col}`),
                row: row,
                col: col
            };
            return out;
        },
        makeTimer: function(amt) {
            let pie = $("#pie");

            let p = parseFloat(amt),
                NS = "http://www.w3.org/2000/svg",
                svg = document.createElementNS(NS, "svg"),
                circle = document.createElementNS(NS, "circle"),
                circle2 = document.createElementNS(NS, "circle"),
                circle3 = document.createElementNS(NS, "circle"),
                title = document.createElementNS(NS, "title");
            svg.setAttribute("class", "timer");
            svg.setAttribute("id", "countdown");

            circle3.setAttribute("r", 16);
            circle3.setAttribute("id", "second");
            circle3.setAttribute("cx", 16);
            circle3.setAttribute("cy", 16);
            circle3.setAttribute("stroke-dasharray", "0 100");

            circle2.setAttribute("r", 16);
            circle2.setAttribute("id", "groove");
            circle2.setAttribute("cx", 16);
            circle2.setAttribute("cy", 16);
            circle2.setAttribute("stroke-dasharray", "0 100");

            circle.setAttribute("r", 16);
            circle.setAttribute("id", "timer");
            circle.setAttribute("cx", 16);
            circle.setAttribute("cy", 16);
            circle.setAttribute("stroke-dasharray", "0 100");

            svg.setAttribute("viewBox", "0 0 32 32");
            title.textContent = amt;
            svg.appendChild(title);
            svg.appendChild(circle3);
            svg.appendChild(circle2);
            svg.appendChild(circle);
            pie.appendChild(svg);
            setTimeout(function() { circle.setAttribute("stroke-dasharray", "100 100"); }, 500);
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
            
           // line.style.top = ((Math.round(app.state.lastPos.y / app.config.cellHeight) * app.config.cellHeight) - 19) + 'px';
            line.style.top = ((Math.round(app.state.lastPos.y / app.config.cellHeight) * app.config.cellHeight) - 20) + 'px';
            
           line.style.left = ((Math.round(app.state.lastPos.x / app.config.cellWidth) * app.config.cellWidth) -14) + 'px';
            
            line.style.transform = `scale(-1) rotate(-${angle}deg)`;
            line.style.width = (len + app.config.cellWidth) + 'px';
            line.style.height = (app.config.cellHeight - 3) + "px";
            $("main").appendChild(line);

            app.state.current.lines.unshift(line);

            return line;
        },
        doDown: function(e) {
            console.dir(e);
            //            if (!e.target.id.match(/^letter_/)) { return false; }
            //            app.state.lastPos = {
            //                x: e.clientX,
            //                y: e.clientY
            //            };

            let coord = app.getCoord(e.target.id);

            app.state.lastPos = {
                row: coord.row,
                col: coord.col,
                x: e.clientX,
                y: e.clientY
            };
            console.dir(app.state.lastPos);
            //e.target.classList.add('selected');
            app.state.currentWord = app.state.board[coord.row][coord.col];
            $("#currentWord").innerHTML = app.state.currentWord;

            app.state.events.mouseover = $("#board").addEventListener("mouseover", app.doOver);

            $("#board").addEventListener("mouseup", app.doUp);
            $("#board").addEventListener("mousemove", app.doMove);
            app.state.currentWordScore = app.config.items[app.state.board[coord.row][coord.col]].value;
            app.mkLine(e.clientX, e.clientY);
        },
        doMove: function(e) {
            let dx, dy, theta, len;
            dx = app.state.lastPos.x - e.clientX;
            dy = app.state.lastPos.y - e.clientY;

            len = Math.sqrt((dx * dx) + (dy * dy));
            theta = 360 - (Math.atan2(dy, dx) * (180 / Math.PI));

            let angle = Math.round(theta / 45) * 45;

            if (app.state.current.lines[0]) {
                app.state.current.lines[0].style.transform = `scaleX(-1) rotate(${angle}deg)`;
                app.state.current.lines[0].style.width = len + app.config.cellWidth + 'px';
            }
        },
        doUp: function(e) {
            //console.log("mouseup");
            clearTimeout(app.state.overTimeout);
            $("#board").removeEventListener("mouseover", app.doOver);
            $("#board").removeEventListener("mouseup", app.doUp);
            $("#board").removeEventListener("mousemove", app.doMove);
            app.state.currentLine.remove();

            let cell = app.getCoord(e.target.id);
            let start = app.state.lastPos; 
            let newword = app.getLetters(start, cell);
            
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
            //clearTimeout(app.state.lineTimeout);
            //console.log("doOver");
            //console.dir(e);
            let tgt = e.target;
            let coords = app.getCoord(e.target.id);

            let newword = app.getLetters(app.state.lastPos, coords);
            //console.log("newword: " + newword);
            app.state.currentWord = newword;
            $("#currentWord").innerHTML = newword + ' [' + app.state.currentWordScore + ']';
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
                let ltr = app.state.board[coords.row][coords.col];

                if (ltr) {
                    $(`#r${coords.row}c${coords.col}`).classList.add('selected');
                    //console.log("Adding " + ltr + " to word [" + app.state.currentWord + "]");
                    app.state.currentWord += ltr;
                    app.state.currentWordScore += (app.config.items[ltr].value * (app.state.currentWord.length + 1));
                    $("#currentWord").innerHTML = app.state.currentWord + '[' + app.state.currentWordScore + ']';
                    app.state.current.word.push(ltr);
                    app.state.current.cells.push(cell);
                    app.state.current.used.push(key);
                }
            }

        },
        getLetters: function(start, end) {
            let out = '';
            
            // Make sure we are selecting a straight or diagonal line by check 
            // the slope of the line formed by our start and end cells: ±1=diagonal, ±Infinity=vertical or 0=horizontal)
            const slope = (start.row - end.row) / (start.col - end.col);
            if ((slope !== 0) && (Math.abs(slope) !== 1) && (Math.abs(slope) !== Infinity)) {
                return app.state.currentWord;
            }
            //console.log(`getting letters from [${start.col},${start.row}] to [${end.col},${end.row}]`);
            let r1 = parseInt(start.row),
                c1 = parseInt(start.col),
                r2 = parseInt(end.row),
                c2 = parseInt(end.col);

            let ri = (r1 == r2) ? 0 : ((r1 > r2) ? -1 : 1);
            let ci = (c1 == c2) ? 0 : ((c1 > c2) ? -1 : 1);

            if (r1 == r2) ri = 0;
            if (c1 == c2) ci = 0;
            let curRow = r1,
                curCol = c1, cnt = 1;
            app.state.current.cells = [];
            app.state.currentWordScore = 0;

            while ((curRow != r2 + ri) || (curCol != c2 + ci)) {
                app.state.current.cells.push($(`#letter_r${curRow}c${curCol}`));
                app.state.currentWordScore += (app.config.items[app.state.board[curRow][curCol]].value * cnt);
                cnt++;
                //app.addCell($(`#letter_r${curRow}c${curCol}`));
                out += app.state.board[curRow][curCol];
                //console.log("[" + curRow + "," + curCol + "] " + out);
                curRow += ri;
                curCol += ci;
            }
            //console.log("cells");
            //console.dir(app.state.current.cells);

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
            app.state.board = [];
            for (let r = 0; r < app.config.rows; r++) {
                out += "<div class='row'>";
                app.state.board[r] = [];
                for (let c = 0; c < app.config.cols; c++) {
                    app.state.board[r][c] = '';
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
                if (!app.state.board[r]) app.state.board[r] = [];
                for (let c = 0; c < app.config.cols; c++) {
                    if (!app.state.board[r][c]) {
                        app.state.board[r][c] = app.state.letters[Math.floor(Math.random() * app.state.letters.length)];
                        const el = app.mkletter(r, c, app.state.board[r][c]);
                        $("#board").appendChild(el);
                        app.flipLetter(el, app.state.board[r][c], 10 + app.rand(0, 100));
                    }
                }
            }
        },
        rand: function(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        },
        checkBoard: function(from, to, word='') {
            
            let curcol = from.col;
            let currow = from.row;
            let rowinc = (to.row == from.row) ? 0 : 1;
            let colinc = (to.col == from.col) ? 0 : 1;

            while ((curcol !== to.col) || (currow !== to.row)) {
                if (app.state.board[currow][curcol]) {
                    return false;
                }
                curcol += colinc;
                currow += rowinc;

            }
            
            return true;
        },
        saltBoard: function() {
            let picks = [];
            for (let i=0; i<12; i++) {
                let word = app.state.allwords[app.rand(0, app.state.allwords.length)];
                let pick = word.split('');

                picks.push(word); 
                let dir = app.rand(0, 3);
                let r, c, t = 0, el;
                
                let clen = pick.length, rlen = pick.length;
                let cinc = 1, rinc = 1;
                
                switch (dir) {

                    case 0:
                        clen = cinc = 0;
                        rlen = pick.length;
                        rinc = 1;
                        break;
                    case 1:
                        clen = pick.length;
                        cinc = 1;
                        rlen = rinc = 0;
                        break;
                    case 2:
                        clen = pick.length;
                        rlen = pick.length;
                        cinc = 1;
                        rinc = 1;
                        break;
                    default:
                        clen = pick.length;
                        rlen = rinc = 0;
                        cinc = 1;
                }

                do { 
                    c = app.rand(0, app.config.cols - clen);
                    r = app.rand(0, app.config.rows - rlen);
                    t++;
                } while (!app.checkBoard( { row: r, col: c }, { row: r + rlen, col: c + clen }, word) && (t<100) );

                if (t < 10) { 
                    for (let i = 0; i < pick.length; i++) {
                        app.state.board[r][c] = pick[i];
                        //console.log(`set [${x}, ${r}] to ${pick[cnt]}`);
                        el = app.mkletter(r, c, pick[i]);
                        $("#board").appendChild(el);
                        app.flipLetter(el, pick[i], 10 + app.rand(0,100));
                        c += cinc;
                        r += rinc;
                    }
                } else {
                    i--;
                    picks.pop();
                }
 
 
            }
            //console.dir(picks);
            app.state.picks = picks;

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
                            x: (app.config.cellWidth / 4) + (col * app.config.cellWidth) + "px",
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
            //console.log("gotWord: "+word);
            //console.dir(app.state.current.cells);
            if (!word) return false;
            app.state.players[app.state.currentPlayer].words.push(word);
            app.state.players[app.state.currentPlayer].scores.push(app.state.currentWordScore);
            app.state.players[app.state.currentPlayer].score += app.state.currentWordScore;

            $(`#player${app.state.currentPlayer}Words`).innerHTML += `<div class='found'>${word} [${app.state.currentWordScore}]</div>`;
            $(`#player${app.state.currentPlayer}Score`).innerHTML = app.state.players[app.state.currentPlayer].score + " / " + app.config.scoreGoal;

            app.state.current.cells.forEach((item) => {
                let c = app.getCoord(item.id);
                app.state.board[c.row][c.col] = '';
                // item.parentElement.removeChild(item);
            });
            app.state.current.cells = [];
            app.state.current.used = [];
            app.state.current.word = [];

            let elClone = $("#currentWord").cloneNode(true);
            elClone.classList.add("currentWord");
            elClone.style.top = "100%";
            elClone.style.left = "50%";
            $("#board").appendChild(elClone);
            $("#currentWord").innerHTML = "";
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
                app.findWords();
            }, 300);

        },
        mkletter: function(row = 0, col = 0, letter = '') {
            let oldel = $(`letter_r${row}c${col}`);
            if (oldel) oldel.remove();

            let el = document.createElement('div');
            el.id = `letter_r${row}c${col}`;
            el.className = 'letter';
            el.innerHTML = letter;
            //            el.draggable = "true";

            el.style.top = ((row * app.config.cellHeight)) + 'px';
            el.style.left = ((col * app.config.cellWidth) + (app.config.cellWidth / 4)) + 'px';

            return el;
        },
        dumpBoard: function() {
            let out = '',cols = '   ';

            
            for (let r = 0; r < app.config.rows; r++) {
                let sr = (r < 10) ? ' ' + r : r;
                out += sr + ' ';
                for (let c = 0; c < app.config.cols; c++) {
                    if (r===0) {
                        cols += c.toString().slice(-1);
                    }
                    out += app.state.board[r][c] || '-';
                }
                if (r ===0) out = cols + "\n" + out;
                out += "\n";
            }
            //console.log(out);
        },
        flipLetter: function(el, ltr, cnt=0) {
            cnt--;
            if (cnt <= 0) {
                el.innerHTML = ltr;
                return true;
            } else {
                let tmpltr = String.fromCharCode(app.rand(65, 90));
                el.innerHTML = tmpltr;
                setTimeout(app.flipLetter, 30, el, ltr, cnt);
            }
        },
        /**
         * findWord

         * Takes board cell coordinates and row/col increment/decrement values
         * and attempts to crawl dictionary trie in app.state.dictionary to 
         * find words.  Only have it returning 4+ letter words now as result sets 
         * were much too large when including 2/3 letter words
         **/
        findWord: function(row, col, rowInc=1, colInc=1) {
            let r = row, 
                c = col, 
                point = app.state.dictionary,
                tmpword = '', words = [];
            
            while ((r > 0) && (r < app.config.rows) && (c > 0) && (c < app.config.cols)) {
                if (point[app.state.board[r][c]]) {
                    tmpword += app.state.board[r][c];
                    point = point[app.state.board[r][c]];
                } else if (point['$']) {
                    if (tmpword.length > 3) {
                        words.push({word:tmpword, start: `r${row}c${col}`, end: `r${r}c${c}`, dir: `${rowInc}:${colInc}`});
                        console.log("Found word: "+tmpword);
                    }

                    tmpword = '';
                    point = app.state.dictionary;
                    break;
                } else {
                    tmpword = '';
                    point = app.state.dictionary;
                    break;
                }
                r += rowInc;
                c += colInc;
            }

            return words;
        },
        findWords: function() {
            let words = [];
            // Instead of having multiple loops checking each direction
            // we simply loop over each board space and call generic method
            // 'findWord' with cell coordinates and row/col increment values
            for (let r = 0; r < app.config.rows; r++) {
                for (let c = 0; c < app.config.cols; c++) {
                    words = words.concat(app.findWord(r, c, 0, 1));
                    words = words.concat(app.findWord(r, c, 0, -1));
                    words = words.concat(app.findWord(r, c, 1, 0));
                    words = words.concat(app.findWord(r, c, -1, 0));
                    words = words.concat(app.findWord(r, c, 1, 1));
                    words = words.concat(app.findWord(r, c, 1, -1));
                    words = words.concat(app.findWord(r, c, -1, 1));
                    words = words.concat(app.findWord(r, c, -1, -1));
                }
            }
            words.sort(function(a, b) { 
                if (a.word < b.word) {
                    return -1;
                } 
                if (a.word > b.word) {
                    return 1;
                }
                return 0;
            });
            words.sort(function(a, b) {
                return b.word.length - a.word.length;
            });
            console.dir(words);

            app.state.found = words;
            
            let dir = {
                "1:1": "↘",
                "-1:-1":"↖",
                "1:-1": "↙",
                "-1:1": "↗",
                "0:1": "→",
                "1:0": "↓",
                "0:-1": "←",
                "-1:0": "↑"
                    };
            let out = '';
            words.forEach((item)=>{ 
                out += '<div class="word" id="word-'+item.start+'-'+item.end+'">'+item.word+' [' + dir[item.dir] + ']</div>\n';
            });
            $("#player0Words").innerHTML = out;
            return words;
        }

    };
    
    window.app = app;
    app.init();
})();
