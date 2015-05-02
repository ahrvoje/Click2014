/**
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Mon Sep 08, 2014
 */
/* jshint strict:false */

logGoldenRatio = 0.481211825059603447;

isString = function (s) {return typeof s == 'string' || s instanceof String};
prependZeros = function (s, m) {while(m-- > 0){s = "0" + s} return s};
prependZerosMod = function (s, m) {while(s.length % m > 0){s = "0" + s} return s};
appendZeros = function (s, m) {while(m-- > 0){s += "0"} return s};
appendZerosMod = function (s, m) {while(s.length % m > 0){s += "0"} return s};
topZeros = function(s) {var c=0; while(c < s.length && s[c++] === "0"){} return s.substring(c-1)};
tailZeros = function(s) {var c=s.length; while(--c >= 0 && s[c] === "0"){} return s.slice(0, c+1)};
swap_key_value = function (d) {var t={}; for(var key in d){t[d[key]]=key} return t};
sign = function (x) {return x ? x<0 ? -1 : 1 : 0};
sum = function (l) {var s=0; for(var i=0; i<l.length; i++){s+=l[i]} return s};
fmap = function (l, f) {var t=[]; for(var i=0; i<l.length; i++){t.push(f(l[i]))} return t};

getQueryParams = function (qs) {
    var result = {};
    var params = (qs.split('?')[1] || '').split('&');
    var param, paramParts;

    for(param in params) {
        if (params.hasOwnProperty(param)) {
            paramParts = params[param].split('=');
            result[paramParts[0]] = decodeURIComponent(paramParts[1] || "")
        }
    }

    return result
};

extractWheelDelta = function (e) {
    if (e.wheelDelta) {
        return e.wheelDelta
    }

    if (e.originalEvent.detail) {
        return e.originalEvent.detail * -40
    }

    if (e.originalEvent && e.originalEvent.wheelDelta) {
        return e.originalEvent.wheelDelta
    }
};

chars_encode = {  "0":"0",  "1":"1",  "2":"2",  "3":"3",  "4":"4",  "5":"5",  "6":"6",  "7":"7",  "8":"8",  "9":"9",
                 "10":"a", "11":"b", "12":"c", "13":"d", "14":"e", "15":"f", "16":"g", "17":"h", "18":"i", "19":"j",
                 "20":"k", "21":"l", "22":"m", "23":"n", "24":"o", "25":"p", "26":"q", "27":"r", "28":"s", "29":"t",
                 "30":"u", "31":"v", "32":"w", "33":"x", "34":"y", "35":"z", "36":"A", "37":"B", "38":"C", "39":"D",
                 "40":"E", "41":"F", "42":"G", "43":"H", "44":"I", "45":"J", "46":"K", "47":"L", "48":"M", "49":"N",
                 "50":"O", "51":"P", "52":"Q", "53":"R", "54":"S", "55":"T", "56":"U", "57":"V", "58":"W", "59":"X",
                 "60":"Y", "61":"Z", "62":"#", "63":"$", "64":"(", "65":")", "66":"*", "67":"+", "68":"-", "69":"/",
                 "70":"@", "71":"[", "72":"]", "73":"_"};

chars_decode = swap_key_value(chars_encode);

baseX_to_baseY = function (baseX, X, Y) {
    var i, base10 = 0, baseY = "", mod;

    for (i=0; i<baseX.length; i++) {
        base10 = X * base10 + Number(chars_decode[baseX[i]]);
    }

    if (base10 === 0) {
        baseY = "0"
    }

    while (base10 > 0) {
        mod = base10 % Y;
        baseY = chars_encode[String(mod)] + baseY;
        base10 = (base10 - mod) / Y
    }

    return baseY
};

longX_to_longY = function (baseX, X, m, Y, n) {
    var i, baseY = "";

    baseX = prependZerosMod(baseX, m);
    for (i = 0; i < baseX.length / m; i++) {
        baseY += prependZerosMod(baseX_to_baseY(baseX.substring(m*i, m*i + m), X, Y), n)
    }

    return baseY
};

huffman_encode = function (array, encode_table) {
    var i, t="";

    for (i = 0; i < array.length; i++) {
        t += encode_table[array[i]]
    }

    return t
};

huffman_decode = function (huffmanString, decode_table) {
    var i, code="", x, array=[];

    for (i = 0; i < huffmanString.length; i++) {
        code += huffmanString[i];

        x = decode_table[code];
        if (x !== undefined) {
            array.push(Number(x));
            code = ""
        }
    }

    return array
};
