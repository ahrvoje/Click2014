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
            var i, j, tmp, column;
            position = [];

            while (positionString.length % 5 > 0) {
                positionString = "0" + positionString
            }

            for (i = 0; i < positionString.length / 5; i++) {
                tmp = "";

                for (j = 0; j < 5; j++) {
                    tmp += positionString[5 * i + j]
                }

                tmp = base74_to_base6(tmp);

                column = [];
                for (j = 0; j < tmp.length; j++) {
                    column.push(eval(tmp[j]))
                }

                position.push(column)
            }

            return true
        },

        stringToMoves = function (movesString) {
            moves = [];
        },

        stringToTimes = function (timesString) {
            times = [];
        },

        deserialize = function (positionString, movesString, timesString) {
            if (isString(positionString)) {
                if (!stringToPosition(positionString)) {
                    return {p:[], m:[], t:[]}
                }
            }

            if (isString(movesString)) {
                if (!stringToMoves(movesString)) {
                    return {p:position, m:[], t:[]}
                }
            }

            if (isString(timesString)) {
                if (!stringToTimes(timesString)) {
                    return {p:position, m:moves, t:[]}
                }
            }

            return {p:position, m:moves, t:times}
        },

        serialize = function (position, moves, times) {
            var i, j, p0, p1, string = "v=2&p=", tmp;

            p0 = "";
            for (i = 0; i < 12; i++) {
                if (position[i][0] === 0) {
                    break
                }

                for (j = 0; j < 12; j++) {
                    p0 += String(position[i][j]);

                    if (position[i][j] === 0) {
                        break
                    }
                }
            }

            while (p0.length % 12 > 0) {
                p0 = "0" + p0
            }

            p1 = "";
            for (i = 0; i < p0.length / 12; i++) {
                tmp = "";
                for (j = 0; j < 12; j++) {
                    tmp = tmp + p0[12 * i + j];
                }

                tmp = base6_to_base74(tmp);
                p1 += tmp
            }

            string += p1;
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