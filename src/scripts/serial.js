/**
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Thu Apr 23, 2015
 */

Serializer1 = (function () {
    var position, moves, times;

    var stringToPosition = function (positionString) {
            var i, x, column;

            position = [];

            if (positionString.length !== 144) {
                return false
            }

            for (i = 0; i < positionString.length; i++) {
                if (i % 12 === 0) {
                    column = []
                }

                x = parseInt(positionString[i], 10);

                if (x > 0 && x < 6) {
                    column.push(parseInt(positionString[i], 10))
                } else {
                    column.push(0)
                }

                if (i % 12 === 11) {
                    position.push(column)
                }
            }

            return true;
        },

        stringToMoves = function (movesString) {
            var i, fieldCodes = movesString.split(','), fieldCode, x, y;

            moves = [];

            for (i = 0; i < fieldCodes.length; i++) {
                fieldCode = parseInt(fieldCodes[i], 10);
                x = Math.floor(fieldCode / 12);
                y = fieldCode % 12;

                if (x < 0 || x > 11) {
                    return false
                }
                moves.push([x, y]);
            }

            return true
        },

        stringToTimes = function (timesString) {
            var i, list = timesString.split(',');

            times = [0];

            for (i = 0; i < list.length; i++) {
                times.push(times[i] + Number(list[i]))
            }

            return true
        },

        deserialize = function (positionString, movesString, timesString) {
            if (isString(positionString)) {
                if (!stringToPosition(positionString)) {
                    return {p:[], m:[], t:[]}
                }
            }

            if (isString(movesString)) {
                if (!stringToMoves(movesString)) {
                    moves = []
                }
            }

            if (isString(timesString)) {
                if (!stringToTimes(timesString)) {
                    times = []
                }
            }

            return {p:position, m:moves, t:times}
        },

        serialize = function (position, moves, times) {
            var i, j, field, string = "position=";

            for (i = 0; i < 12; i++) {
                for (j = 0; j < 12; j++) {
                    string += String(position[i][j])
                }
            }

            if (moves.length > 0) {
                string += "&moves=";

                for (i = 0; i < moves.length; i++) {
                    field = moves[i];
                    string += String(12 * field[0] + field[1]);

                    if (i < moves.length - 1) {
                        string += ","
                    }
                }
            }

            if (times.length > 0) {
                string += "&times=";

                // times are string coded by moves time differences
                for (i = 1; i < times.length; i++) {
                    string += String(times[i] - times[i - 1]);

                    if (i < times.length - 1) {
                        string += ","
                    }
                }
            }

            return string
        };

    // Serializer1 API
    return {
        serialize: serialize,
        deserialize: deserialize
    }
} () );

Serializer2 = (function () {
    var position, moves, times;

    var stringToPosition = function (positionString) {
            var i, column, row, x;
            var base6 = topZeros(longX_to_longY(positionString, 74, 5, 6, 12));

            position = [];
            for (i = 0; i < 12; i++) {
                position.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
            }

            column = 0; row = 0;
            for (i = 0; i < base6.length && column < 12; i++) {
                x = Number(base6[i]);

                // column starts with 0 = end of position
                if (row == 0 && x == 0) {
                    break
                }

                position[column][row++] = x;

                if (x == 0 || row == 12) {
                    column++;
                    row = 0
                }
            }

            return true
        },

        positionToString = function (position) {
            var i, j, p0;

            p0 = "";
            for (i = 0; i < 12 && position[i][0] !== 0; i++) {
                for (j = 0; j < 12; j++) {
                    p0 += String(position[i][j]);

                    if (position[i][j] === 0) {
                        break
                    }
                }
            }

            return topZeros(longX_to_longY(tailZeros(p0), 6, 12, 74, 5))
        },

        componentStringToMoves = function (movesStringComponent, huffman_table) {
            var m0 = Number(baseX_to_baseY(movesStringComponent[0], 74, 10));
            var lz = Number(baseX_to_baseY(movesStringComponent[1], 74, 10));
            var huffman = longX_to_longY(movesStringComponent.substring(2), 74, 5, 2, 31).substring(lz);
            var deltas = huffman_decode(huffman, huffman_table);
            var movesComponent = [m0];

            for (var i = 0; i < deltas.length; i++) {
                movesComponent.push(movesComponent[movesComponent.length - 1] + Number(deltas[i]))
            }

            return movesComponent
        },

        stringToMoves = function (movesString) {
            var movesStrings = movesString.split(",");
            var movesX = componentStringToMoves(movesStrings[0], dx_huffman_decode);
            var movesY = componentStringToMoves(movesStrings[1], dy_huffman_decode);

            moves = [];
            for (var i = 0; i < movesX.length; i++) {
                moves.push([movesX[i], movesY[i]])
            }

            return true
        },

        movesComponentToString = function (moves, c, huffman_table) {
            var i, deltas=[], huffman, lz, base74;

            for (i = 1; i < moves.length; i++) {
                deltas.push(moves[i][c] - moves[i-1][c])
            }

            huffman = huffman_encode(deltas, huffman_table);
            lz = (31 - huffman.length % 31) % 31;
            base74 = longX_to_longY(huffman, 2, 31, 74, 5);

            return baseX_to_baseY(String(moves[0][c]), 10, 74) + baseX_to_baseY(String(lz), 10, 74) + topZeros(base74)
        },

        movesToString = function (moves) {
            var stringX = movesComponentToString(moves, 0, dx_huffman_encode);
            var stringY = movesComponentToString(moves, 1, dy_huffman_encode);

            return stringX + "," + stringY
        },

        stringToTimes = function (timesString) {
            times = [];
            return true
        },

        timesToString = function (times) {

        },

        deserialize = function (positionString, movesString, timesString) {
            if (!stringToPosition(positionString)) {
                return {p:[], m:[], t:[]}
            }

            if (!stringToMoves(movesString)) {
                return {p:position, m:[], t:[]}
            }

            if (!stringToTimes(timesString)) {
                return {p:position, m:moves, t:[]}
            }

            return {p:position, m:moves, t:times}
        },

        serialize = function (_position, _moves, _times) {
            var string="v=2";

            string += "&p=" + positionToString(_position);

            if (_moves.length > 0) {
                string += "&m=" + movesToString(_moves)
            }

            if (_times.length > 0) {
                string += "&t=" + timesToString(_times)
            }

            return string
        };

    // Serializer2 API
    return {
        serialize: serialize,
        deserialize: deserialize
    }
} () );

Serializer = (function () {
    var serialize = function (version, position, moves, times) {
            // determine the serialization version and act accordingly
            if (version === 1) {
                return Serializer1.serialize(position, moves, times)
            } else if (version === 2) {
                return Serializer2.serialize(position, moves, times)
            } else {
                window.alert("Unknown serialization version!!!")
            }
        },

        deserialize = function (gameString) {
            var gameParams = getQueryParams(gameString);

            // determine the serialization version and act accordingly
            if (gameParams.v === undefined) {
                return Serializer1.deserialize(gameParams.position, gameParams.moves, gameParams.times)
            } else if (gameParams.v === "2") {
                return Serializer2.deserialize(gameParams.p, gameParams.m, gameParams.t)
            } else {
                window.alert("Unknown serialization version!")
            }
        };

    // Serializer API
    return {
        serialize: serialize,
        deserialize: deserialize
    }
} () );
