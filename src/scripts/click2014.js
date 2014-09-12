/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Wed Sep 10, 2014
 */
/* jshint strict:false */

var click = new Click();

$(document).ready(function () {
    $(".button").hover(
        function () {$(this).addClass("buttonOn");},
        function () {$(this).removeClass("buttonOn");}
    );

    $("#game").css("display", "inline-block");

    // event listeners
    $("#startButton").click(function(){click.startNewGame();});
    $("#gameCanvas").mousedown(function(event){click.onCanvasClick(event);});
    $("#importButton").click(function(){click.importGame(window.prompt('Paste game link below'));});
    $("#linkButton").click(function(){click.promptGameLink();});
    $("#replayButton").click(function(){click.replayStartPosition();});

    // initialize Click object
    click.init();
});
