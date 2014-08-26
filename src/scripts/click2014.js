/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Fri Aug 08, 2014
 */

var colors = ['#000000', '#FF0000', '#00BF00', '#0000FF', '#EFEF00', '#00DFFF', '#888888'];

function HistoryItem(position, score, index) {
    this.position = position;
    this.score = score;
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
}

var history = [];

var startPosition, activePosition, drawingContext, startTime, updateTimerInterval, lastClickTime, lastPlayedPositionIndex;

var GameType = {New:0, Replay:1, Imported:2}, gameType;
var GameState = {Ready:0, Active:1, Finished:2}, gameState;
var ImportMethod = {FromAddressBar:0, FromLink:1};

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

function promptGameLink(positionIndex) {
    var gameLinkString = String(document.location).split('?', 1) + '?position=';

    var position;
    if (positionIndex == -1) {
        position = startPosition;
    } else {
        position = historyPositions[positionIndex];
    }

    for (var i=0; i<12; i++) {
        for (var j=0; j<12; j++) {
            gameLinkString += String(position[i][j]);
        }
    }

    prompt('Copy link to clipboard (Ctrl+C)', gameLinkString);
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

function stringToPosition(positionString) {
    var x, column=[], position=[];

    for (var i=0; i<positionString.length; i++) {
        x = parseInt(positionString[i]);

        if (x>0 && x<6) {
            column.push(parseInt(positionString[i]));
        } else {
            column.push(0);
        }

        if (i%12 == 11) {
            position.push(column);
            column = [];
        }
    }

    return position;
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
    drawingContext.strokeStyle = '#000000';
    drawingContext.lineWidth = 4;

    drawingContext.beginPath();
    drawingContext.rect(25*i+5, 300-25*(j+1)+5, 25, 25);
    drawingContext.stroke();

    drawingContext.fillStyle = color;
    drawingContext.fill();
}

function drawAllFields() {
    for (var i=0; i<12; i++) {
        for (var j=0; j<12; j++) {
            drawField(i, j, colors[activePosition[i][j]]);
        }
    }
}

function updateTimer() {
    var currentTime = ((new Date()).getTime() - startTime) / 1000;
    $('#timeValue')[0].textContent = String(currentTime);
    return currentTime;
}

function updateScore() {
    var currentScore = getGameScore();
    $('#scoreValue')[0].textContent = currentScore;
    return currentScore;
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
    var fieldState = activePosition[mousePos.x][mousePos.y];

    // if clicked group is larger than a single field
    if (markGroup(mousePos.x, mousePos.y) > 1) {
        collapseGroup();
        drawAllFields();
        updateScore();
    } else {
        activePosition[mousePos.x][mousePos.y] = fieldState;
    }

    if (isGameOver()) {
        gameState = GameState.Finished;
        clearInterval(updateTimerInterval);
/*
        if (gameType == GameType.New) {
            appendHistory([updateTimer(), updateScore()]);
        }
*/
        showButtons();
    }
}

function onCanvasClick(event) {
    var firstClick = false;

    if (gameState == GameState.Ready) {
        hideButtons();

        lastClickTime = startTime = (new Date()).getTime();
        updateTimerInterval = setInterval(updateTimer, 67);
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
    $('#timeValue')[0].textContent = '';
    $('#scoreValue')[0].textContent = '';
    gameState = GameState.Ready;
}

function startNewGame() {
    generateStartPosition();
    prepareGame();
    lastPlayedPositionIndex = -1;
    gameType = GameType.New;
}

function replayHistoryPosition(positionIndex) {
    startPosition = $.extend(true, [], historyPositions[positionIndex]);
    prepareGame();
    lastPlayedPositionIndex = positionIndex;
    gameType = GameType.Replay;
}

function replayStartPosition() {
    prepareGame();
    lastPlayedPositionIndex = -1;
    gameType = GameType.Replay;
}

function importGame(importMethod) {
    var importedString;

    if (importMethod == ImportMethod.FromAddressBar)
        importedString = getQueryParams(document.location.search).position;
    else
        importedString = prompt('Paste game link below').split('=')[1];

    if (typeof importedString == "string") {
        if (importedString.length == 144)
            startPosition = stringToPosition(importedString);
        else
            return;
    } else
        return;

    prepareGame();
    lastPlayedPositionIndex = -1;
    gameType = GameType.Imported;
}

function init() {
    drawingContext = $("#gameCanvas")[0].getContext('2d');

    $(".button").hover(
        function () {$(this).addClass("buttonOn");},
        function () {$(this).removeClass("buttonOn");}
    );

    var isChrome = (navigator.userAgent.toLowerCase().indexOf("chrome")>-1);
    var isFirefox = (navigator.userAgent.toLowerCase().indexOf("firefox")>-1);

    if (isChrome || isFirefox) {
        $("#IEWarning").css("display", "none");
        $("#game").css("display", "inline-block");
    }

    if (isChrome) {
        $(".button, .icon").addClass("chrome");
    }

    if (isFirefox) {
        $(".button, .icon").addClass("firefox");
    }

    gameType = GameType.New;
    gameState = GameState.Finished;

    importGame(ImportMethod.FromAddressBar);
}

$(document).ready(init);