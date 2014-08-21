/*
    Author: Hrvoje Abraham
    Email: ahrvoje@gmail.com
    Date: 08.08.2014.
*/

var colors = ['#000000', '#FF0000', '#00BF00', '#0000FF', '#EFEF00', '#00DFFF', '#888888'];
var highScores = [['',''], ['',''], ['',''], ['',''], ['',''], ['','']];
var startPosition = [];
var fields, startTime, updateTimerInterval, gameActive, lastClickTime;

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

function markGroup(i, j, context) {
    if (typeof context == 'undefined') {
        // if field is empty
        if (fields[i][j] == 0) {
            return 0;
        }
        // static variable equivalents
        markGroup.refColor = fields[i][j];
        markGroup.groupSize = 1;
    }

    fields[i][j] = 6;

    if (i>0) {
        if (fields[i-1][j] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i-1, j, true);
        }
    }

    if (i<11) {
        if (fields[i+1][j] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i+1, j, true);
        }
    }

    if (j>0) {
        if (fields[i][j-1] == markGroup.refColor) {
            markGroup.groupSize++;
            markGroup(i, j-1, true);
        }
    }

    if (j<11) {
        if (fields[i][j+1] == markGroup.refColor) {
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
            fieldState = fields[i][j];

            if (fieldState>0 && fieldState<6) {
                fields[i][j] = 0;
                fields[i][row] = fieldState;
                row++;
            } else {
                fields[i][j] = 0;
            }
        }
    }
}

function collapseLeft() {
    var fieldState;
    // scan all columns excepts the last
    for (var i=0; i<11; i++) {
        if (fields[i][0] == 0) {
            // find first non-empty column
            for (var col=i+1; col<12; col++) {
                if (fields[col][0] > 0)
                    break;
            }

            // if it is not the last column
            // copy it to the empty column and make it empty
            if (col < 12) {
                for (var j=0; j<12; j++) {
                    fieldState = fields[col][j];

                    if (fieldState == 0) {
                        break;
                    } else {
                        fields[i][j] = fieldState;
                        fields[col][j] = 0;
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
        if (fields[i][0] == 0) {
            break;
        }

        for (var j=0; j<12; j++) {
            if (fields[i][j] > 0) {
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

    // try to find at least two connected fields of the same color
    for (var i=0; i<12; i++) {
        // stop scanning if you came to an empty part
        if (fields[i][0] == 0) {
            return true;
        }

        for (var j=0; j<12; j++) {
            fieldState = fields[i][j];

            if (fieldState > 0) {
                if (i < 11) {
                    if (fields[i + 1][j] == fieldState) {
                        return false;
                    }
                }

                if (j < 11) {
                    if (fields[i][j + 1] == fieldState) {
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
    var context = $("#clickCanvas")[0].getContext('2d');

    context.strokeStyle = '#000000';
    context.lineWidth = 4;

    context.beginPath();
    context.rect(25*i+5, 300-25*(j+1)+5, 25, 25);
    context.stroke();

    context.fillStyle = color;
    context.fill();
}

function drawAllFields() {
    for (var i=0; i<12; i++) {
        for (var j=0; j<12; j++) {
            drawField(i, j, colors[fields[i][j]]);
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

function appendHighScores(highScore) {
    highScores.unshift(highScore);
    highScores.pop();

    for (var i=0; i<highScores.length; i++) {
        $('#timeValue'+i)[0].textContent = highScores[i][0];
        $('#scoreValue'+i)[0].textContent = highScores[i][1];
    }
}

function getMousePos(event) {
    var rect = $('#clickCanvas')[0].getBoundingClientRect();
    return {
        x: Math.floor((event.clientX - rect.left - 5) / 25),
        y: 11 - Math.floor((event.clientY - rect.top - 5) / 25)
    };
}

function enableButtons() {
    $('#startButton')[0].style.display = 'inherit';
    $('#replayButton')[0].style.display = 'inherit';
}

function disableButtons() {
    $('#startButton')[0].style.display = 'none';
    $('#replayButton')[0].style.display = 'none';
}

function processClick(event) {
    if (gameActive) {
        var mousePos = getMousePos(event);
        var fieldState = fields[mousePos.x][mousePos.y];

        // if clicked group is larger than a single field
        if (markGroup(mousePos.x, mousePos.y) > 1) {
            collapseGroup();
            drawAllFields();
            updateScore();
        } else {
            fields[mousePos.x][mousePos.y] = fieldState;
        }

        if (isGameOver()) {
            clearInterval(updateTimerInterval);
            appendHighScores([updateTimer(), updateScore()]);
            enableButtons();
            gameActive = false;
        }
    }
}

function onClick(event) {
    if (gameActive) {
        var currentTime = (new Date()).getTime();

        // minimal double click time 5ms
        if (currentTime - lastClickTime > 5) {
            processClick(event);
        }

        lastClickTime = currentTime;
    }
}

function startGame() {
    fields = $.extend(true, [], startPosition);
    drawAllFields();
    disableButtons();

    lastClickTime = startTime = (new Date()).getTime();
    updateTimerInterval = setInterval(updateTimer, 67);
    updateScore();

    gameActive = true;
}

function startNewGame() {
    generateStartPosition();
    startGame();
}