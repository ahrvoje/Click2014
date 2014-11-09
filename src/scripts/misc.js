/*
 * Click2014
 *
 * Copyright 2014, Hrvoje Abraham ahrvoje@gmail.com
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Mon Sep 08, 2014
 */
/* jshint strict:false */

function getQueryParams(qs) {
    var result = {};
    var params = (qs.split('?')[1] || '').split('&');
    var param, paramParts;

    for(param in params) {
        if (params.hasOwnProperty(param)) {
            paramParts = params[param].split('=');
            result[paramParts[0]] = decodeURIComponent(paramParts[1] || "");
        }
    }
    return result;
}

function extractWheelDelta(e) {
    if (e.wheelDelta) {
        return e.wheelDelta;
    }

    if (e.originalEvent.detail) {
        return e.originalEvent.detail * -40;
    }

    if (e.originalEvent && e.originalEvent.wheelDelta) {
        return e.originalEvent.wheelDelta;
    }
}