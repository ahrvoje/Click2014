/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Fri Aug 08, 2014
 */
/* jshint strict:false */
/*global $:false */

var Click = function () {
    this.game = null;
    this.drawingCanvas = null;
    this.drawingContext = null;
    this.updateTimerInterval = null;
    this.lastClickTime = null;
};

Click.Colors = ["#000000", "#FF0000", "#00BF00", "#0000FF", "#EFEF00", "#00DFFF", "#888888", "#FFCC66"];
Click.ImportMethod = {FromAddressBar:0, FromLink:1};

Click.prototype = {

    getMousePos: function (event) {
        var rect = $('#gameCanvas')[0].getBoundingClientRect();
        return {
            x: Math.floor((event.clientX - rect.left - 5) / 25),
            y: 11 - Math.floor((event.clientY - rect.top - 5) / 25)
        };
    },

    promptGameLink: function () {
        window.prompt("Copy link to clipboard (Ctrl+C)",
                String(document.location).split("?", 1)[0] + "?" + this.game.toLinkParamString());
    },

    drawField: function (i, j, color) {
        this.drawingContext.beginPath();
        this.drawingContext.rect(25 * i + 6, 300 - 25 * (j + 1) + 6, 23, 23);
        this.drawingContext.stroke();

        this.drawingContext.fillStyle = color;
        this.drawingContext.fill();
    },

    highlightGroup: function (group) {
        var i;

        this.drawingContext.strokeStyle = Click.Colors[7];
        this.drawingContext.lineWidth = 4;

        for (i = 0; i < group.length; i++) {
            this.drawField(group[i][0], group[i][1], Click.Colors[this.game.currentPosition[group[i][0]][group[i][1]]]);
        }
    },

    drawAllFields: function () {
        var i, j, color, position;

        // clear canvas hack
        this.drawingCanvas.width = this.drawingCanvas.width;

        this.drawingContext.strokeStyle = Click.Colors[0];
        this.drawingContext.lineWidth = 4;

        if (this.game.status === Game.Status.Ready) {
            position = this.game.startPosition;
        } else if (this.game.status === Game.Status.Play || this.game.status === Game.Status.Over) {
            position = this.game.currentPosition;
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
                if (color > 0 && color < Click.Colors.length) {
                    this.drawField(i, j, Click.Colors[color]);
                } else {
                    this.drawField(i, j, Click.Colors[0]);
                }
            }
        }

        if (this.game.status === Game.Status.Over) {
            var nextMoveGroup = this.game.getNextMoveGroup();
            this.highlightGroup(nextMoveGroup);
        }
    },

    updateTimer: function () {
        var currentTime = (new Date().getTime() - this.game.startTime) / 1000.0;
        $('#timeValue')[0].textContent = String(currentTime);
        return currentTime;
    },

    updateTimeText: function () {
        var timeText, currentMoveTime;

        if (this.game.currentMove === 0) {
            timeText = "0";
        } else {
            currentMoveTime = this.game.getCurrentMoveTime();

            if (currentMoveTime === 0) {
                timeText = "0";
            } else {
                timeText = String((currentMoveTime - this.game.startTime) / 1000.0);
            }
        }

        $('#timeValue')[0].textContent = timeText;
    },

    updateScore: function () {
        var currentScore = this.game.getScore();
        $('#scoreValue')[0].textContent = currentScore;
        return currentScore;
    },

    showButtons: function () {
        $(".button").css("display", "inherit");
    },

    hideButtons: function () {
        $(".button").css("display", "none");
    },

    processClick: function (event) {
        var mousePos = this.getMousePos(event);

        if (this.game.playMove([mousePos.x, mousePos.y])) {
            this.drawAllFields();
            this.updateScore();
        }

        if (this.game.status === Game.Status.Over) {
            clearInterval(this.updateTimerInterval);

            // make sure timer shows exact time of the last move played
            this.updateTimeText();
            this.showButtons();
        }
    },

    processMouseWheel: function (delta) {
        // mouse wheel rewinding enabled only for finished games
        if (this.game.status !== Game.Status.Over) {
            return;
        }

        if (delta === undefined) {
            return;
        }

        if (delta < 0) {
            this.game.rewindToMove(this.game.currentMove + 1);
        } else {
            this.game.rewindToMove(this.game.currentMove - 1);
        }

        this.drawAllFields();
        this.updateScore();
        this.updateTimeText();
    },

    onCanvasClick: function (event) {
        var firstClick = false;

        if (this.game.status === Game.Status.Ready) {
            this.hideButtons();

            this.game.start();
            this.lastClickTime = this.game.startTime;

            var that = this;
            this.updateTimerInterval = setInterval(function () {that.updateTimer();}, 17);
            this.updateScore();

            firstClick = true;
        }

        if (this.game.status === Game.Status.Play) {
            var currentTime = new Date().getTime();

            // minimal double click time 5ms
            if (firstClick || currentTime - this.lastClickTime > 5) {
                this.processClick(event);
            }

            this.lastClickTime = currentTime;
        }
    },

    prepareInterface: function () {
        this.drawAllFields();
        $("#timeValue").text("0");
        $("#scoreValue").text(this.game.getScore());
    },

    startNewGame: function () {
        this.game = new Game();
        this.prepareInterface();
    },

    replayStartPosition: function () {
        this.game.replay();
        this.prepareInterface();
    },

    importGame: function (importedString) {
        this.game = new Game(importedString);
        this.prepareInterface();
    },

    checkBrowser: function () {
        var that = this;
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
                that.processMouseWheel(extractWheelDelta(event));
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
                that.processMouseWheel(extractWheelDelta(event));
            });
        }

        return true;
    },

    init: function () {
        if (!this.checkBrowser()) {
            return;
        }

        this.drawingCanvas = $("#gameCanvas")[0];
        this.drawingContext = this.drawingCanvas.getContext("2d");

        this.importGame(document.location.search);
    }
};
