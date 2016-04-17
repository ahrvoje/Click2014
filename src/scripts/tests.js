/**
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Tue Feb 16, 2016
 */

Tests = (function () {
    var testIndex = 0, testIter = 0, testInitialized = -1, testOver = false, testsStopped = false, report = $("#progressReport"),

        tests = [{
            name: 'Game serialization',
            count: 10000,
            groupSize: 100,
            prologText: 'Game 1,000,000 (de)serializations running...\n',
            epilogText: 'Test finished.\n',
            blocking: false,
            exec: function () {
                var position, serialized, deserialized;

                position = Game().getStartPosition();
                serialized = Serializer.serializeGame(2, position, [], []);
                deserialized = Serializer.deserializeGame('?' + serialized);
                if (JSON.stringify(position) != JSON.stringify(deserialized.p)) {
                    log(JSON.stringify(
                            ['Test failed: Position (de)serialization',
                                ['position', position],
                                ['serialized', serialized],
                                ['deserialized', deserialized]
                            ]) + "\n");
                    return false
                }
                return true
            }}, {
            name: 'Position serialization',
            count: 10000,
            groupSize: 100,
            prologText: 'Position 1,000,000 (de)serializations running...\n',
            epilogText: 'Test finished.\n',
            blocking: true,
            exec: function () {
                var position, position2;

                position = Game().getStartPosition();
                position2 = Serializer.deserializePosition(2, Serializer.serializePosition(2, position));
                if (JSON.stringify(position) != JSON.stringify(position2)) {
                    log(JSON.stringify(
                            ['Test failed: Position (de)serialization',
                                ['position', position],
                                ['position2', position2]
                            ]) + "\n");
                    return false
                }
                return true
            }}, {
            name: 'Case#1 moves serialization',
            count: 1,
            groupSize: 1,
            prologText: 'Case#1 moves (de)serialization running...\n',
            epilogText: 'Test finished.\n',
            blocking: true,
            exec: function () {
                var moves = [[8,2],[9,4],[4,11],[6,8],[10,4],[7,1],[3,10],[1,5],[6,10],[9,11],[5,3],[1,9],[6,9],[3,4],
                    [5,5],[10,0],[10,10],[2,6],[7,6],[5,6],[10,0],[4,8],[3,11],[5,7],[10,4],[5,4],[2,2],[9,6],[11,0],
                    [5,3],[7,1],[10,2],[11,5],[4,2],[0,7],[1,5],[3,9],[11,2],[5,11],[2,7],[9,10],[5,10],[4,9],[5,9],[9,1]],
                    moves2;

                moves2 = Serializer.deserializeMoves(2, Serializer.serializeMoves(2, moves));
                if (JSON.stringify(moves) != JSON.stringify(moves2)) {
                    log(JSON.stringify(
                            ['Test failed: Moves (de)serialization',
                                ['moves', moves],
                                ['moves2', moves2]
                            ]) + "\n");
                    return false
                }
                return true
            }}, {
                name: 'Moves serialization',
                count: 10000,
                groupSize: 100,
                prologText: 'Moves 1,000,000 (de)serializations running...\n',
                epilogText: 'Test finished.\n',
                blocking: true,
                exec: function () {
                    var moves = [], moves2,

                    random11 = function () {
                        return Math.floor(Math.random() * 12)
                    };

                    for (var i = 0; i<45; i++) {
                        moves.push([random11(), random11()])
                    }

                    moves2 = Serializer.deserializeMoves(2, Serializer.serializeMoves(2, moves));
                    if (JSON.stringify(moves) != JSON.stringify(moves2)) {
                        log(JSON.stringify(
                                ['Test failed: Moves (de)serialization',
                                    ['moves', moves],
                                    ['moves2', moves2]
                                ]) + "\n");
                        return false
                    }
                    return true
                }}
        ],

        stopTest = function () {
            testOver = true;
            testsStopped = true;
            $("#testsStop1").text("Close").unbind("click").click(closeTestDialog);
        },

        showTestDialog = function () {
            $("#modalOverlay").show();
            $("#progressReport").text("");
            $("#testsStop1").text("Stop").unbind("click").click(stopTest);
            $("#testsDialog").show();
        },

        closeTestDialog = function () {
            $("#testsDialog").hide();
            $("#modalOverlay").hide();
        },

        log = function (text) {
            report.text(report.text() + text)
        },

        setProgress = function (p) {
            $("#pc1").text(p);
            $("#ps1").width(p);
        },

        // method implements rather ugly logic due to its async nature
        // it is executed via consecutive self-registered timer callbacks
        // while the execution state is controlled via global variables
        execute = function () {
            var test, testResult, iter1;

            for (; testIndex < tests.length; testIndex++) {
                test = tests[testIndex];

                // Update and refresh GUI with new test info
                if (testIndex != testInitialized) {
                    log("(" + (testIndex + 1) + "/" + (tests.length) + ") " + test.name + "\n");
                    log("      " + test.prologText);
                    setProgress("0%");
                    testInitialized = testIndex;
                    window.setTimeout(execute, 0);
                    return;
                }

                for (; testIter < test.count; testIter++) {
                    testResult = test.exec();

                    // If test failed and is of blocking type, go to another test
                    if (!testResult && test.blocking) {
                        testIter = 0;
                        testIndex++;
                        window.setTimeout(execute, 0);
                        return
                    }

                    // Every groupSize iterations, take a break
                    iter1 = testIter + 1;
                    if (iter1 % test.groupSize == 0) {
                        setProgress(Math.floor(100 * iter1 / test.count) + "%");

                        if (testsStopped) {
                            log("Testing stopped.");
                            return
                        }

                        if (iter1 < test.count) {
                            // Set a timer for the next iteration
                            window.setTimeout(execute, 0);
                            // Manually increment because we exit the loop
                            testIter++;
                            return
                        }
                    }
                }

                if (!testOver && testIter == test.count) {
                    setProgress(Math.floor(100 * iter1 / test.count) + "%");
                    log("      " + test.epilogText);
                }
                testIter = 0;

                if (testIndex + 1 == tests.length) {
                    stopTest();
                    log("All tests finished.\n");
                }
            }
        },

        run = function () {
            showTestDialog();
            execute();
        };

    // Tests API
    return {
        run: run
    }
});
