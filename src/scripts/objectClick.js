/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Fri Aug 08, 2014
 */
/* jshint strict: false */
/* global $: false */
/* global extractWheelDelta: false */

var Click = (function () {
    // private variables
    var examples = ["?position=544341454153245551352111315534254113553554342242333515335513533415541542111541422113121311534345113215252332331311244443442542241513343551454125&moves=65,54,21,43,31,42,30,29,17,15,13,13,37,24,25,24,14,13,14,26,26,38,38,54,66,78,89,88,88,77,87,87,73,84,60,37,36,12,1,0,12&times=533,929,374,344,492,642,406,218,320,236,178,414,344,266,344,352,484,586,188,264,258,430,1242,336,679,611,217,455,358,321,171,524,273,235,905,180,406,414,156,320",
                    "?position=544341454153245551352111315534254113553554342242333515335513533415541542111541422113121311534345113215252332331311244443442542241513343551454125&moves=22,45,44,31,42,30,30,29,17,5,4,13,13,25,24,24,39,50,39,38,51,36,49,49,48,60,48,24,37,38,51,61,52,61,61,49,49,24,36,26,14,25,0,0&times=169,172,360,149,156,180,180,171,180,188,509,250,468,287,197,836,298,406,186,422,282,304,156,281,251,290,203,984,187,1250,446,1062,774,374,148,492,766,142,452,282,313,280,149",
                    "?position=325543113314113135211541443415522322133121452555454312541423142452333321342251314552432544244431224151231425333345115312311242234331554443232431&moves=34,19,29,20,6,17,14,17,27,26,13,61,62,61,61,62,61,60,52,84,84,60,63,60,60,49,49,49,36,12,12,12,13,25,12,41,51,39,52,52,51,51,39,49,36,24,25,24&times=529,648,453,202,172,462,562,373,697,366,1196,437,399,303,401,663,180,1186,1188,446,1203,414,524,290,492,616,704,242,446,156,296,367,407,467,1361,344,983,399,180,352,421,600,298,188,594,367,171"],
        colors = ["#000000", "#FF0000", "#00BF00", "#0000FF", "#EFEF00", "#00DFFF", "#888888", "#FFCC66"],
        game = null,
        drawingCanvas = null,
        drawingContext = null,
        updateTimerInterval = null,
        lastClickTime = null;

    // private methods
    var getMousePos = function (event) {
            var rect = $('#gameCanvas')[0].getBoundingClientRect();
            return {
                x: Math.floor((event.clientX - rect.left - 5) / 25),
                y: 11 - Math.floor((event.clientY - rect.top - 5) / 25)
            };
        },

        drawField = function (i, j, color) {
            drawingContext.beginPath();
            drawingContext.rect(25 * i + 6, 300 - 25 * (j + 1) + 6, 23, 23);
            drawingContext.stroke();

            drawingContext.fillStyle = color;
            drawingContext.fill();
        },

        highlightGroup = function (group) {
            var i;

            drawingContext.strokeStyle = colors[7];
            drawingContext.lineWidth = 4;

            for (i = 0; i < group.length; i++) {
                drawField(group[i][0], group[i][1], colors[game.currentPosition[group[i][0]][group[i][1]]]);
            }
        },

        drawAllFields = function () {
            var i, j, color, position;

            // clear canvas hack
            drawingCanvas.width = drawingCanvas.width;

            drawingContext.strokeStyle = colors[0];
            drawingContext.lineWidth = 4;

            if (game.status === game.StatusReady) {
                position = game.startPosition;
            } else if (game.status === game.StatusPlay || game.status === game.StatusOver) {
                position = game.currentPosition;
            } else {
                return;
            }

            for (i = 0; i < 12; i++) {
                // stop drawing if you came to empty part
                if (position[i][0] === 0) {
                    break;
                }

                for (j = 0; j < 12; j++) {
                    color = position[i][j];

                    // stop drawing this column if you came to empty part
                    if (color === 0) {
                        break;
                    }

                    drawField(i, j, colors[color]);
                }
            }

            if (game.status === game.StatusOver) {
                var nextMoveGroup = game.getNextMoveGroup();
                highlightGroup(nextMoveGroup);
            }
        },

        updateTimer = function () {
            var currentTime = (new Date().getTime() - game.startTime) / 1000.0;
            $('#timeValue')[0].textContent = String(currentTime);
            return currentTime;
        },

        updateTimeText = function () {
            var timeText, currentMoveTime;

            if (game.currentMove === 0) {
                timeText = "0";
            } else {
                currentMoveTime = game.getCurrentMoveTime();

                if (currentMoveTime === undefined || currentMoveTime === 0) {
                    timeText = "0";
                } else {
                    timeText = String((currentMoveTime - game.startTime) / 1000.0);
                }
            }

            $('#timeValue')[0].textContent = timeText;
        },

        updateScore = function () {
            var currentScore = game.getScore();
            $('#scoreValue')[0].textContent = currentScore;
            return currentScore;
        },

        updateMove = function () {
            $('#moveValue')[0].textContent = game.currentMove + " / " + game.moves.length;
        },

        showButtons = function () {
            $(".button").css("display", "inherit");
        },

        hideButtons = function () {
            $(".button").css("display", "none");
        },

        prepareInterface = function () {
            drawAllFields();
            $("#timeValue").text("0");
            $("#scoreValue").text(game.getScore());
            $("#moveValue").text("0 / " + game.moves.length);
        },

        gameFromString = function (gameString) {
            game = new Game(gameString);
            prepareInterface();
        },

        processClick = function (event) {
            var mousePos = getMousePos(event);

            if (game.playMove([mousePos.x, mousePos.y])) {
                drawAllFields();
                updateScore();
                updateMove();
            }

            if (game.status === game.StatusOver) {
                clearInterval(updateTimerInterval);

                // make sure timer shows exact time of the last move played
                updateTimeText();
                showButtons();
            }
        },

        processMouseWheel = function (delta) {
            // mouse wheel rewinding enabled only for finished games
            if (game.status !== game.StatusOver) {
                return;
            }

            if (delta === undefined) {
                return;
            }

            if (delta < 0) {
                game.rewindToMove(game.currentMove + 1);
            } else {
                game.rewindToMove(game.currentMove - 1);
            }

            drawAllFields();
            updateScore();
            updateMove();
            updateTimeText();
        },

        checkBrowser = function () {
            var isChrome = (navigator.userAgent.toLowerCase().indexOf("chrome") > -1);
            var isFirefox = (navigator.userAgent.toLowerCase().indexOf("firefox") > -1);

            var warningDiv = $("#Warning");

            if (!isChrome && !isFirefox) {
                $(warningDiv).text("Please use Chrome or Firefox browser!");
                $(warningDiv).css("display", "inherit");
                return false;
            }

            if (isChrome) {
                var chromeVersion = parseInt(navigator.userAgent.match(/Chrome\/(\d+)\./)[1], 10);

                if (chromeVersion < 33) {
                    $(warningDiv).text("Please use Chrome 33 or newer!");
                    $(warningDiv).css("display", "inherit");
                    return false;
                }

                $(warningDiv).css("display", "none");
                $(".button, .icon").addClass("chrome");
                $("#gameCanvas").on("mousewheel", function (event) {
                    processMouseWheel(extractWheelDelta(event));
                });
            }

            if (isFirefox) {
                var firefoxVersion = parseInt(navigator.userAgent.match(/Firefox\/(\d+)\./)[1], 10);

                if (firefoxVersion < 30) {
                    $(warningDiv).text("Please use Firefox 30 or newer!");
                    $(warningDiv).css("display", "inherit");
                    return false;
                }

                $(warningDiv).css("display", "none");
                $(".button, .icon").addClass("firefox");

                $("#gameCanvas").on("DOMMouseScroll", function (event) {
                    processMouseWheel(extractWheelDelta(event));
                });
            }

            return true;
        };

    // public (API) methods
    return {
        promptGameLink: function () {
            window.prompt("Copy link to clipboard (Ctrl+C)",
                    String(document.location).split("?", 1)[0] + "?" + game.toLinkParamString());
        },

        onCanvasClick: function (event) {
            var firstClick = false;

            if (game.status === game.StatusReady) {
                hideButtons();

                game.start();
                lastClickTime = game.startTime;

                updateTimerInterval = setInterval(updateTimer, 17);
                updateScore();

                firstClick = true;
            }

            if (game.status === game.StatusPlay) {
                var currentTime = new Date().getTime();

                // minimal double click time 5ms
                if (firstClick || currentTime - lastClickTime > 5) {
                    processClick(event);
                }

                lastClickTime = currentTime;
            }
        },

        startNewGame: function () {
            gameFromString();
        },

        replayStartPosition: function () {
            game.replay();
            prepareInterface();
        },

        importGame: function (importedString) {
            if (importedString !== "" && importedString !== null) {
                gameFromString(importedString);
            }
        },

        loadExample: function (exampleIndex) {
            if (exampleIndex >= 0 && exampleIndex < examples.length) {
                gameFromString(examples[exampleIndex]);
            }
        },

        init: function () {
            if (!checkBrowser()) {
                return;
            }

            drawingCanvas = $("#gameCanvas")[0];
            drawingContext = drawingCanvas.getContext("2d");

            gameFromString(document.location.search);
        }
    };
} () );
