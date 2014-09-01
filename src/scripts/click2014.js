/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Fri Aug 08, 2014
 */

var colors = ["#000000", "#FF0000", "#00BF00", "#0000FF", "#EFEF00", "#00DFFF", "#888888"];

function HistoryItem(position, score, moves) {
    this.position = position;
    this.score = score;
    this.moves = moves;
/*
    this.getHTML = function () {
        return '<div class="rowDiv"> <div id="rowInnerDiv' + index + '" class="rowInnerDiv">\
                <div class="leftDiv" id="timeText' + index + '">Time:</div><div class="rightDiv" id="timeValue' + index + '">' + score[0] + '</div>\
                <div class="leftDiv" id="scoreText' + index + '">Score:</div><div class="rightDiv" id="scoreValue' + index + '">' + score[1] + '</div>\
                <div class="filler"></div>\
                <div class="emptyButtonDiv" id="emptyButtonDiv' + index + '">\
                    <div id="emptyButton' + index + '" class="emptyButton">\
                    EMPTY\
                    </div>\
                </div>\
                <div class="linkDiv" id="link' + index + '">\
                    <div id="linkButton' + index + '" class="button linkButton" onclick="promptGameLink(' + index + ')">\
                        x\
                        </div>\
                    </div>\
                    <div class="replayDiv" id="replay' + index + '">\
                        <div id="replayButton' + index + '" class="button replayButton" onclick="replayHistoryPosition(' + index + ')">\
                            x\
                            </div>\
                        </div>\
                    </div></div>';
    }
*/
}

var history, moves, times;
var startPosition, activePosition, currentMove, drawingCanvas, drawingContext;
var startTime, updateTimerInterval, lastClickTime, lastPlayedPositionIndex;

var GameType = {New:0, Replay:1, Imported:2}, gameType;
var GameState = {Ready:0, Active:1, Finished:2}, gameState;
var ImportMethod = {FromAddressBar:0, FromLink:1};

function getQueryParams(qs) {
    var result = {};
    var params = (qs.split('?')[1] || '').split('&');
    var paramParts;

    for(var param in params) {
        if (params.hasOwnProperty(param)) {
            paramParts = params[param].split('=');
            result[paramParts[0]] = decodeURIComponent(paramParts[1] || "");
        }
    }
    return result;
}

function promptGameLink(positionIndex) {
    var gameLinkString = String(document.location).split("?", 1) + "?position=";
    var position, i;

    if (positionIndex == -1) {
        position = startPosition;
    } else {
        position = historyPositions[positionIndex];
    }

    for (i=0; i<12; i++) {
        for (var j=0; j<12; j++) {
            gameLinkString += String(position[i][j]);
        }
    }

    if (moves.length > 0) {
        gameLinkString += "&moves=";

        for (i = 0; i < moves.length; i++) {
            gameLinkString += String(moves[i]);

            if (i < moves.length - 1) {
                gameLinkString += ",";
            }
        }
    }

    if (times.length > 0) {
        gameLinkString += "&times=";

        // times are string coded by moves time differences
        for (i = 1; i < times.length; i++) {
            gameLinkString += String(times[i] - times[i-1]);

            if (i < times.length - 1) {
                gameLinkString += ",";
            }
        }
    }

    prompt("Copy link to clipboard (Ctrl+C)", gameLinkString);
}

function generateStartPosition() {
    var x;

    startPosition = [];
    for (var i=0; i<12; i++) {
        x=[];
        for (var j=0; j<12; j++) {
            x.push(Math.floor(Math.random()*5)+1);
        }

        startPosition.push(x);
    }
}

function stringToStartPosition(positionString) {
    var x, column=[];

    startPosition = [];
    for (var i=0; i<positionString.length; i++) {
        x = parseInt(positionString[i]);

        if (x>0 && x<6) {
            column.push(parseInt(positionString[i]));
        } else {
            column.push(0);
        }

        if (i%12 == 11) {
            startPosition.push(column);
            column = [];
        }
    }
}

function stringToMoves(movesString) {
    var list = movesString.split(',');

    moves = [];
    for (var i=0; i<list.length; i++) {
        moves.push(eval(list[i]));
    }
}

function stringToTimes(timesString) {
    var list = timesString.split(',');

    times = [0];
    for (var i=0; i<list.length; i++) {
        times.push(times[i] + eval(list[i]));
    }
}

function markGroup(i, j, context) {
    if (typeof context == 'undefined') {
        // if field is empty
        if (activePosition[i][j] == 0) {
            return 0;
        }
        // static variable equivalents
        markGroup.refColor = activePosition[i][j];
        markGroup.groupSize = 1;
    }

    activePosition[i][j] = 6;

    if (i>0) {
        if (activePosition[i-1][j] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i-1, j, true);
        }
    }

    if (i<11) {
        if (activePosition[i+1][j] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i+1, j, true);
        }
    }

    if (j>0) {
        if (activePosition[i][j-1] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i, j-1, true);
        }
    }

    if (j<11) {
        if (activePosition[i][j+1] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i, j+1, true);
        }
    }

    return markGroup.groupSize;
}

function collapseDown() {
    var row, fieldState;

    for (var i=0; i<12; i++) {
        row = 0;
        for (var j=0; j<12; j++) {
            fieldState = activePosition[i][j];

            if (fieldState>0 && fieldState<6) {
                activePosition[i][j] = 0;
                activePosition[i][row] = fieldState;
                row++;
            } else {
                activePosition[i][j] = 0;
            }
        }
    }
}

function collapseLeft() {
    var fieldState;
    // scan all columns excepts the last
    for (var i=0; i<11; i++) {
        if (activePosition[i][0] == 0) {
            // find first non-empty column
            for (var col=i+1; col<12; col++) {
                if (activePosition[col][0] > 0)
                    break;
            }

            // if it is not the last column
            // copy it to the empty column and make it empty
            if (col < 12) {
                for (var j=0; j<12; j++) {
                    fieldState = activePosition[col][j];

                    if (fieldState == 0) {
                        break;
                    } else {
                        activePosition[i][j] = fieldState;
                        activePosition[col][j] = 0;
                    }
                }
            } else {
                break;
            }
        }
    }
}

function collapseGroup() {
    collapseDown();
    collapseLeft();
}

function getGameScore() {
    var score = 0;

    for (var i=0; i<12; i++) {
        // stop counting if you came to an empty column
        if (activePosition[i][0] == 0) {
            break;
        }

        for (var j=0; j<12; j++) {
            if (activePosition[i][j] > 0) {
                score++;
            } else {
                // stop counting if you came to an empty row
                break;
            }
        }
    }

    return score;
}

function isGameOver() {
    var fieldState;

    // try to find at least two connected activePosition of the same color
    for (var i=0; i<12; i++) {
        // stop scanning if you came to an empty part
        if (activePosition[i][0] == 0) {
            return true;
        }

        for (var j=0; j<12; j++) {
            fieldState = activePosition[i][j];

            if (fieldState > 0) {
                if (i < 11) {
                    if (activePosition[i + 1][j] == fieldState) {
                        return false;
                    }
                }

                if (j < 11) {
                    if (activePosition[i][j + 1] == fieldState) {
                        return false;
                    }
                }
            } else {
                break;
            }
        }
    }

    return true;
}

function drawField(i, j, color) {
    drawingContext.beginPath();
    drawingContext.rect(25*i+6, 300-25*(j+1)+6, 23, 23);
    drawingContext.stroke();

    drawingContext.fillStyle = color;
    drawingContext.fill();
}

function drawAllFields() {
    // clear canvas hack
    drawingCanvas.width = drawingCanvas.width;

    var color;
    for (var i=0; i<12; i++) {
        // stop drawing if you came to empty part
        if (activePosition[i][0] == 0) {
            return;
        }

        for (var j=0; j<12; j++) {
            color = activePosition[i][j];

            // stop drawing this column if you came to empty part
            if (color > 0) {
                drawField(i, j, colors[color]);
            }
        }
    }
}

function updateTimer() {
    var currentTime = ((new Date()).getTime() - startTime) / 1000;
    $('#timeValue')[0].textContent = String(currentTime);
    return currentTime;
}

function updateTimeText() {
    var timeText;

    if (currentMove == 0) {
        timeText = "0";
    } else {
        if (times[currentMove - 1] == 0)
            timeText = "0";
        else
            timeText = String(times[currentMove - 1] / 1000.);
    }

    $('#timeValue')[0].textContent = timeText;
}

function updateScore() {
    var currentScore = getGameScore();
    $('#scoreValue')[0].textContent = currentScore;
    return currentScore;
}

function playMove(x, y) {
    var fieldState = activePosition[x][y];

    // if clicked group is larger than a single field
    if (markGroup(x, y) > 1) {
        collapseGroup();
        currentMove++;
        return true;
    } else {
        activePosition[x][y] = fieldState;
        return false;
    }
}

function rewindToMove(move) {
    if (move < 0 || move > moves.length) {
        return;
    }

    activePosition = $.extend(true, [], startPosition);
    currentMove = 0;

    for (var i=0; i<move; i++) {
        playMove(Math.floor(moves[i]/12), moves[i]%12);
    }
}

function appendHistory(score) {
    historyPositions.unshift(startPosition);
    if (historyPositions.length > 6) {
        historyPositions.pop();
    }

    historyScores.unshift(score);
    if (historyScores.length > 6) {
        historyScores.pop();
    }

    for (var i=0; i<historyScores.length; i++) {
        $('#timeValue'+i)[0].textContent = historyScores[i][0];
        $('#scoreValue'+i)[0].textContent = historyScores[i][1];
    }

    $('#rowInnerDiv'+String(historyScores.length-1)).css('display', 'inherit');
}

function getMousePos(event) {
    var rect = $('#gameCanvas')[0].getBoundingClientRect();
    return {
        x: Math.floor((event.clientX - rect.left - 5) / 25),
        y: 11 - Math.floor((event.clientY - rect.top - 5) / 25)
    };
}

function showButtons() {
    $('.button').css('display', 'inherit');
}

function hideButtons() {
    $('.button').css('display', 'none');
}

function processClick(event) {
    var mousePos = getMousePos(event);

    if (playMove(mousePos.x, mousePos.y)) {
        drawAllFields();
        updateScore();

        // moves are base 12 coded, as maximal value of coordinates is 11 (0 - 11)
        // this is no pain, but makes a game link a lot shorter!
        moves.push(12*mousePos.x + mousePos.y);

        // time is expressed in milliseconds
        // first move is always played at t=0
        if (currentMove == 1) {
            times.push(0);
        } else {
            times.push(((new Date()).getTime() - startTime));
        }
    }

    if (isGameOver()) {
        gameState = GameState.Finished;
        clearInterval(updateTimerInterval);

        // make sure timer shows exact time of the last move played
        updateTimeText();
/*
        if (gameType == GameType.New) {
            appendHistory([updateTimer(), updateScore()]);
        }
*/
        showButtons();
    }
}

function extractWheelDelta(e) {
    if (e.wheelDelta) {
        return e.wheelDelta;
    }

    if (e.originalEvent.detail) {
        return e.originalEvent.detail * -40;
    }

    if (e.originalEvent && e.originalEvent.wheelDelta) {
        return e.originalEvent.wheelDelta;
    }
}

function processMouseWheel(delta) {
    // mouse wheel rewinding not enabled during active game playing
    if (gameState == GameState.Active) {
        return;
    }

    if (typeof delta == "undefined") {
        alert("Mouse wheel delta type undefined!!");
        return;
    }

    if (delta < 0) {
        rewindToMove(currentMove+1);
    } else {
        rewindToMove(currentMove-1);
    }

    drawAllFields();
    updateScore();
    updateTimeText();
}

function onCanvasClick(event) {
    var firstClick = false;

    if (gameState == GameState.Ready) {
        hideButtons();

        lastClickTime = startTime = (new Date()).getTime();
        updateTimerInterval = setInterval(updateTimer, 17);
        updateScore();

        gameState = GameState.Active;
        firstClick = true;
    }

    if (gameState == GameState.Active) {
        var currentTime = (new Date()).getTime();

        // minimal double click time 5ms
        if (firstClick || currentTime - lastClickTime > 5) {
            processClick(event);
        }

        lastClickTime = currentTime;
    }
}

function prepareGame() {
    activePosition = $.extend(true, [], startPosition);
    drawAllFields();
    $("#timeValue").text("0");
    $("#scoreValue").text(getGameScore());
    currentMove = 0;
}

function startNewGame() {
    generateStartPosition();
    prepareGame();
    moves = [];
    times = [];
    lastPlayedPositionIndex = -1;
    gameType = GameType.New;
    gameState = GameState.Ready;
}

function replayHistoryPosition(positionIndex) {
    startPosition = $.extend(true, [], historyPositions[positionIndex]);
    prepareGame();
    lastPlayedPositionIndex = positionIndex;
    gameState = GameState.Ready;
    gameType = GameType.Replay;
}

function replayStartPosition() {
    prepareGame();
    moves = [];
    times = [];
    lastPlayedPositionIndex = -1;
    gameType = GameType.Replay;
    gameState = GameState.Ready;
}

function importGame(importedString) {
    var importParams = getQueryParams(importedString);

    // import position
    var positionString = importParams.position;
    if (typeof positionString == "string") {
        if (positionString.length == 144)
            stringToStartPosition(positionString);
        else
            return;
    } else
        return;

    // import moves
    var movesString = importParams.moves;
    if (typeof movesString == "string") {
        stringToMoves(movesString);
        gameState = GameState.Finished;
    } else {
        gameState = GameState.Ready;
    }

    // import times
    var timesString = importParams.times;
    if (typeof timesString == "string") {
        stringToTimes(timesString);
    }

    // initialize
    prepareGame();
    lastPlayedPositionIndex = -1;
    gameType = GameType.Imported;
}

function checkBrowser() {
    var isChrome = (navigator.userAgent.toLowerCase().indexOf("chrome")>-1);
    var isFirefox = (navigator.userAgent.toLowerCase().indexOf("firefox")>-1);

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
        } else {
            $(warningDiv).css("display", "none");
            $(".button, .icon").addClass("chrome");
            $("#gameCanvas").on("mousewheel", function(event){processMouseWheel(extractWheelDelta(event));});
        }
    }

    if (isFirefox) {
        var firefoxVersion = parseInt(navigator.userAgent.match(/Firefox\/(\d+)\./)[1], 10);

        if (firefoxVersion < 30) {
            $(warningDiv).text("Please use Firefox 30 or newer!");
            $(warningDiv).css("display", "inherit");
            return false;
        } else {
            $(warningDiv).css("display", "none");
            $(".button, .icon").addClass("firefox");
            $("#gameCanvas").on("DOMMouseScroll", function(event){processMouseWheel(extractWheelDelta(event));});
        }
    }

    return true;
}

function init() {
    if (!checkBrowser()) {
        return;
    }

    drawingCanvas = $("#gameCanvas")[0];
    drawingContext = drawingCanvas.getContext('2d');
    drawingContext.strokeStyle = '#000000';
    drawingContext.lineWidth = 4;

    $(".button").hover(
        function () {$(this).addClass("buttonOn");},
        function () {$(this).removeClass("buttonOn");}
    );

    $("#game").css("display", "inline-block");

    gameType = GameType.New;
    gameState = GameState.Finished;

    importGame(document.location.search);
}

$(document).ready(init);