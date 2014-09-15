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
/*global $:false */
/*global Click:false */

$(document).ready(function () {
    $(".button").hover(
        function () {$(this).addClass("buttonOn");},
        function () {$(this).removeClass("buttonOn");}
    );

    $("#game").css("display", "inline-block");

    // event listeners
    $("#startButton").click(function(){Click.startNewGame();});
    $("#gameCanvas").mousedown(function(event){Click.onCanvasClick(event);});
    $("#importButton").click(function(){Click.importGame(window.prompt('Paste game link below'));});
    $("#linkButton").click(function(){Click.promptGameLink();});
    $("#replayButton").click(function(){Click.replayStartPosition();});

    $("#example0").click(function(){Click.loadExample(0);});
    $("#example1").click(function(){Click.loadExample(1);});
    $("#example2").click(function(){Click.loadExample(2);});

    // initialize Click object
    Click.init();
});
