/**
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Wed Sep 10, 2014
 */
/*jshint strict:false */
/*global $:false */
/*global Click:false */

$(document).ready(function () {
    $("#game").css("display", "inline-block");

    $(".icon").hover(
        function () {
            var par = $(this).parent();
            par.find(".on").hide();
            par.find(".off").show();
        },
        function () {
            var par = $(this).parent();
            par.find(".on").show();
            par.find(".off").hide();
        }
    );

    // events
    // ***************

    $("#gameCanvas")
        // disable mouse wheel page scroll while over the canvas
        .hover(
        function () {$("body").css("overflow-y", "hidden");},
        function () {$("body").css("overflow-y", "auto");}
    )
        .mousedown(function(event){Click.onCanvasClick(event);}
    );

    $("#startButton").click(function(){Click.startNewGame();});
    $(".backward").click(function(){Click.rewindBackward();});
    $(".autoPlay").click(function(){Click.autoPlay();});
    $(".forward").click(function(){Click.rewindForward();});
    $(".import").click(function(){Click.importGame(window.prompt("Paste game link below"));});
    $(".link").click(function(){Click.promptGameLink();});
    $(".replay").click(function(){Click.replayStartPosition();});

    $("#example0").click(function(){Click.loadExample(0); setTimeout(function(){Click.stopAutoPlay(); Click.autoPlay();}, 1000);});
    $("#example1").click(function(){Click.loadExample(1); setTimeout(function(){Click.stopAutoPlay(); Click.autoPlay();}, 1000);});
    $("#example2").click(function(){Click.loadExample(2); setTimeout(function(){Click.stopAutoPlay(); Click.autoPlay();}, 1000);});

    $("#mail").click(function(){window.prompt("Contact mail:", "ahrvoje@gmail.com");});

    // initialize Click object
    Click.init();
});
