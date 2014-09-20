/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Sat Sep 06, 2014
 */
/* jshint strict:false */
/*global $:false */

// Game object
var Game = function (linkParamString) {
    this.status = this.StatusInitial;

    this.moves = [];
    this.times = [];
    this.startPosition = [];
    this.currentPosition = [];
    this.generateMask();

    if (linkParamString === undefined) {
        this.generateNewPosition();
        this.status = this.StatusReady;
    } else {
        this.status = this.StatusInitial;
        this.fromLink(linkParamString);
    }

    this.currentMove = 0;
    this.startTime = 0;
    this.error = 0;
};

Game.prototype = {

    // game status
    StatusInitial: 0,
    StatusReady:1,
    StatusPlay: 2,
    StatusOver: 3,
    StatusAutoPlay: 4,

    generateMask: function () {
        var i, j, column;

        this.mask = [];

        for (i = 0; i < 12; i++) {
            column = [];
            for (j = 0; j < 12; j++) {
                column.push(0);
            }
            this.mask.push(column);
        }
    },

    clearMask: function () {
        var i, j;

        for (i = 0; i < 12; i++) {
            for (j = 0; j < 12; j++) {
                this.mask[i][j] = 0;
            }
        }
    },

    fromLink: function (linkParamString) {
        if (typeof linkParamString === "string") {
            var linkParams = getQueryParams(linkParamString);

            if (linkParams.position !== undefined) {
                if (this.stringToPosition(linkParams.position)) {
                    this.status = this.StatusReady;

                    if (linkParams.moves !== undefined) {
                        if (this.stringToMoves(linkParams.moves)) {

                            if (this.isValid()) {
                                this.status = this.StatusOver;
                                this.currentPosition = $.extend(true, [], this.startPosition);

                                if (linkParams.times !== undefined) {
                                    this.stringToTimes(linkParams.times);
                                }
                            } else {
                                // game is NOT valid ! - reset everything
                                this.startPosition = [];
                                this.moves = [];
                                this.status = this.StatusInitial;
                                return false;
                            }
                        } else {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }

        return true;
    },

    generateNewPosition: function () {
        var i, j, column;

        this.startPosition = [];
        for (i = 0; i < 12; i++) {
            column = [];
            for (j = 0; j < 12; j++) {
                column.push(Math.floor(Math.random() * 5) + 1);
            }

            this.startPosition.push(column);
        }
    },

    start: function () {
        this.currentPosition = $.extend(true, [], this.startPosition);
        this.startTime = new Date().getTime();
        this.status = this.StatusPlay;
    },

    replay: function () {
        this.currentPosition = [];
        this.moves = [];
        this.times = [];
        this.currentMove = 0;
        this.status = this.StatusReady;
    },

    stringToPosition: function (positionString) {
        var i, x, column;

        if (positionString.length !== 144) {
            return false;
        }

        this.startPosition = [];
        for (i = 0; i < positionString.length; i++) {
            if (i % 12 === 0) {
                column = [];
            }

            x = parseInt(positionString[i], 10);

            if (x > 0 && x < 6) {
                column.push(parseInt(positionString[i], 10));
            } else {
                column.push(0);
            }

            if (i % 12 === 11) {
                this.startPosition.push(column);
            }
        }

        return true;
    },

    stringToMoves: function (movesString) {
        var i, fieldCodes = movesString.split(','), fieldCode, x, y;

        this.moves = [];
        for (i = 0; i < fieldCodes.length; i++) {
            fieldCode = parseInt(fieldCodes[i], 10);

            x = Math.floor(fieldCode/12);
            y = fieldCode%12;

            if (x < 0 || x > 11) {
                return false;
            }

            this.moves.push([x,y]);
        }

        return true;
    },

    stringToTimes: function (timesString) {
        var i, list = timesString.split(',');

        this.times = [0];
        for (i = 0; i < list.length; i++) {
            this.times.push(this.times[i] + Number(list[i]));
        }
    },

    extractGroup: function (field, context) {
        var x = field[0], y = field[1];

        if (context === undefined) {
            // static variable equivalents
            this.extractGroup.refColor = this.currentPosition[x][y];
            this.extractGroup.group = [];

            // if field is empty
            if (this.extractGroup.refColor === 0) {
                return this.extractGroup.group;
            }
        }

        this.extractGroup.group.push([x, y]);
        this.mask[x][y] = 1;

        if (x > 0) {
            if (this.currentPosition[x - 1][y] === this.extractGroup.refColor && this.mask[x - 1][y] === 0) {
                this.extractGroup([x - 1, y], true);
            }
        }

        if (x < 11) {
            if (this.currentPosition[x + 1][y] === this.extractGroup.refColor && this.mask[x + 1][y] === 0) {
                this.extractGroup([x + 1, y], true);
            }
        }

        if (y > 0) {
            if (this.currentPosition[x][y - 1] === this.extractGroup.refColor && this.mask[x][y - 1] === 0) {
                this.extractGroup([x, y - 1], true);
            }
        }

        if (y < 11) {
            if (this.currentPosition[x][y + 1] === this.extractGroup.refColor && this.mask[x][y + 1] === 0) {
                this.extractGroup([x, y + 1], true);
            }
        }

        if (context === undefined) {
            this.clearMask();
            return this.extractGroup.group;
        }
    },

    getNextMoveGroup: function () {
        if (this.currentMove < this.moves.length) {
            return this.extractGroup(this.moves[this.currentMove]);
        }

        return [];
    },

    markGroup: function (group, mark) {
        var k, field;

        for (k = 0; k < group.length; k++) {
            field = group[k];
            this.currentPosition[field[0]][field[1]] = mark;
        }
    },

    collapseDown: function () {
        var i, j, row, fieldState;

        for (i = 0; i < 12; i++) {
            row = 0;
            for (j = 0; j < 12; j++) {
                fieldState = this.currentPosition[i][j];

                if (fieldState > 0 && fieldState < 6) {
                    this.currentPosition[i][j] = 0;
                    this.currentPosition[i][row] = fieldState;
                    row++;
                } else {
                    this.currentPosition[i][j] = 0;
                }
            }
        }
    },

    collapseLeft: function () {
        var i, col, j, fieldState;

        // scan all columns excepts the last
        for (i = 0; i < 11; i++) {
            if (this.currentPosition[i][0] === 0) {
                // find first non-empty column
                for (col = i + 1; col < 12; col++) {
                    if (this.currentPosition[col][0] > 0) {
                        break;
                    }
                }

                // if it is not the last column
                // copy it to the empty column and make it empty
                if (col < 12) {
                    for (j = 0; j < 12; j++) {
                        fieldState = this.currentPosition[col][j];

                        if (fieldState === 0) {
                            break;
                        }

                        this.currentPosition[i][j] = fieldState;
                        this.currentPosition[col][j] = 0;
                    }
                } else {
                    break;
                }
            }
        }
    },

    collapseGroup: function () {
        this.collapseDown();
        this.collapseLeft();
    },

    addMove: function (move) {
        if (move[0] >= 0 && move[0] < 12 && move[1] >= 0 && move[1] < 12) {
            this.moves.push(move);
        } else {
            this.error = -1;
            return this.error;
        }
    },

    addTime: function (time) {
        if (typeof time === "number" && time >= 0) {
            this.times.push(time);
        } else {
            this.error = -1;
            return this.error;
        }
    },

    getCurrentMoveTime: function () {
        if (this.currentMove <= this.times.length) {
            return this.times[this.currentMove - 1];
        }
    },

    playMove: function (field) {
        var group = this.extractGroup(field);

        if (group.length < 2) {
            return false;
        }

        // if clicked group is larger than a single field
        this.markGroup(group, 6);
        this.collapseGroup();
        this.currentMove++;

        if (this.status === this.StatusPlay) {
            // moves are base 12 coded, as maximal value of coordinates is 11 (0 - 11)
            // this is no pain and makes game link a lot shorter!
            this.addMove(field);

            if (this.currentMove !== 1) {
                this.addTime(new Date().getTime());
            } else {
                this.addTime(this.startTime);
            }

            if (this.isOver()) {
                this.status = this.StatusOver;
            }
        }

        return true;
    },

    playNextMove: function () {
        if (this.currentMove < this.moves.length) {
            this.playMove(this.moves[this.currentMove]);
        }
    },

    rewindToMove: function (moveIndex) {
        var i;

        if (moveIndex < 0 || moveIndex > this.moves.length) {
            return false;
        }

        this.currentPosition = $.extend(true, [], this.startPosition);
        this.currentMove = 0;

        for (i = 0; i < moveIndex; i++) {
            this.playMove(this.moves[i]);
        }

        return true;
    },

    getScore: function () {
        var i, j, position, score = 0;

        if (this.status === this.StatusInitial) {
            return 0;
        }

        if (this.status === this.StatusReady) {
            position = this.startPosition;
        } else {
            position = this.currentPosition;
        }

        for (i = 0; i < 12; i++) {
            // stop counting if you came to empty column
            if (position[i][0] === 0) {
                break;
            }

            for (j = 0; j < 12; j++) {
                if (position[i][j] > 0) {
                    score++;
                } else {
                    // stop counting if you came to empty row
                    break;
                }
            }
        }

        return score;
    },

    isOver: function () {
        var i, j, fieldState;

        // try to find at least two connected fields of the same color
        for (i = 0; i < 12; i++) {
            // stop scanning if you came to empty part
            if (this.currentPosition[i][0] === 0) {
                return true;
            }

            for (j = 0; j < 12; j++) {
                fieldState = this.currentPosition[i][j];

                if (fieldState > 0) {
                    if (i < 11) {
                        if (this.currentPosition[i + 1][j] === fieldState) {
                            return false;
                        }
                    }

                    if (j < 11) {
                        if (this.currentPosition[i][j + 1] === fieldState) {
                            return false;
                        }
                    }
                } else {
                    break;
                }
            }
        }

        return true;
    },

    // replays the game and checks every move actually can be played
    isValid: function () {
        var i, result = true;

        this.currentPosition = $.extend(true, [], this.startPosition);

        for (i = 0; i < this.moves.length; i++) {
            if (!this.playMove(this.moves[i])) {
                result = false;
                break;
            }
        }

        this.currentPosition = [];
        return result;
    },

    toLinkParamString: function () {
        var i, j, field, string = "position=";

        for (i = 0; i < 12; i++) {
            for (j = 0; j < 12; j++) {
                string += String(this.startPosition[i][j]);
            }
        }

        if (this.moves.length > 0) {
            string += "&moves=";

            for (i = 0; i < this.moves.length; i++) {
                field = this.moves[i];
                string += String(12*field[0] + field[1]);

                if (i < this.moves.length - 1) {
                    string += ",";
                }
            }
        }

        if (this.times.length > 0) {
            string += "&times=";

            // times are string coded by moves time differences
            for (i = 1; i < this.times.length; i++) {
                string += String(this.times[i] - this.times[i - 1]);

                if (i < this.times.length - 1) {
                    string += ",";
                }
            }
        }

        return string;
    }
};
