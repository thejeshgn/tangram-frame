/*jslint browser: true*/
/*global Tangram, gui */

function parseQuery (qstr) {
    var query = {};
    var a = qstr.split('&');
    for (var i in a) {
        var b = a[i].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1]);
    }
    return query;
}

var map, scene, hash, query, scene_url;

load = (function load() {
    /*** URL parsing ***/
    // determine the version of Tangram, scene url, and content to load during start-up
    scene_url = 'scene.yaml';
    var scene_lib = '0.8';
    var build = "min";
    var gist = {};
    query = parseQuery(window.location.search.slice(1));
    if (query.url) {
        scene_url = query.url;
    }
    if (query.lib) {
        scene_lib = query.lib;
    }
    if (query.debug) {
        build = "debug";
    }
    if (query.gist) {
        console.log('gist!')
        gist = query.gist;
        console.log('gist:', gist)
        console.log('gist != {}', gist != {})
    }

    if (scene_lib.indexOf("/") > -1) {
        // assume it's a full path
        // check that it's a tangram library
        if (scene_lib.substr(scene_lib.length - 17) == '/tangram.debug.js' ||
            scene_lib.substr(scene_lib.length - 15) == '/tangram.min.js') {
            var lib_url = scene_lib;
        } else {
            // noooo you don't
            console.log('lib param error:', scene_lib, "is not a valid tangram library, defaulting to 0.7");
            scene_lib = '0.8';
        }
    }
    else if (scene_lib.indexOf("/") == -1) {
        // assume it's a version # only
        lib_url = "//mapzen.com/tangram/"+scene_lib+"/tangram."+build+".js";
    }
    if (gist != {}) {
        console.log('gist!')
        // read and interpret gist, also pass lib_url to load later
        parseGist(gist, lib_url);
    } else {
        // loadLib right away
        loadLib(lib_url);
    }

}());

function parseGist(gist, lib_url) {
    var lib = lib_url;
    readTextFile(gist, function(text){
        // parse API response data
        try {
            data = JSON.parse(text);
        } catch(e) {
            console.warn('Error parsing json:', e);
            return false;
        }
        // extract scene yaml from gist data
        try {
            scene_url = data.files['scene.yaml'].raw_url;
            loadLib(lib);
        } catch (e) {
            console.error(e);
            return false;
        }
    });
}

function loadLib(url) {    
    var lib_script = document.getElementById("tangramjs");
    lib_script.src = url;
}
// split a URL string into pieces
function splitURL(url) {
    if (typeof url == 'undefined') return 'undefined';
    var dir = url.substring(0, url.lastIndexOf('/')) + "/";
    var file = url.substring(url.lastIndexOf('/')+1, url.length);
    var ext = url.substring(url.lastIndexOf('.')+1, url.length);
    return {"dir" : dir, "file": file, "ext": ext};
}

// load a file from a URL
function readTextFile(file, callback) {
    var filename = splitURL(file).file;
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    try {
        rawFile.open("GET", file, true);
    } catch (e) {
        console.error("Error opening file:", e);
    }
    rawFile.onreadystatechange = function() {
        // readyState 4 = done
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
        else if (rawFile.readyState === 4 && rawFile.status == "404") {
            console.error("404 – can't load file", file);
            diffSay("404 - can't load file <a href='"+file+"'>"+filename+"</a>");
        } else if (rawFile.readyState === 4) {
            diffSay("Had trouble loading the file: <a href='"+file+"'>"+filename+"</a>");
            if (parseURL.host == "github.com") {
                diffSay("I notice you're trying to load a file from github, make sure you're using the \"raw\" file!");
            }
        }

    }
    rawFile.send(null);
}


// https://maymay.net/blog/2008/06/15/ridiculously-simple-javascript-version-string-to-object-parser/
function parseVersionString (str) {
    if (typeof(str) != 'string') { return false; }
    var x = str.split('.');
    // parse from string or default to 0 if can't parse
    var maj = parseInt(x[0]) || 0;
    var min = parseInt(x[1]) || 0;
    var pat = parseInt(x[2]) || 0;
    return {
        major: maj,
        minor: min,
        patch: pat
    }
}

function initLeaflet() {
    var leafletcss, leafletjs;
    // get tangram version
    var v = window.Tangram.version;
    // http://stackoverflow.com/a/9409894/738675
    v = v.replace(/[^\d.-]/g, '');
    // console.log('Tangram version:', v)
    v = parseVersionString(v);
    if (v.major < 1 && v.minor < 8) {
        leafletcss="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0-beta.2/leaflet.css";
        leafletjs="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0-beta.2/leaflet.js";
    } else {
        leafletcss="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0-rc.1/leaflet.css";
        leafletjs="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0-rc.1/leaflet.js";
    }
    document.getElementById("leafletjs").src = leafletjs;
    document.getElementById("leafletcss").href = leafletcss;
}

var uiisloaded = false;
var hashisloaded = false;

function tangramLoaded() {
    initLeaflet();
}
function leafletLoaded() {
    initHash();
}
function initHash() {
    document.getElementById("leaflethash").src = "lib/leaflet-hash.js";
    document.getElementById("mapzenui").src = "//mapzen.com/common/ui/mapzen-ui.min.js";
}
function leaflethashLoaded() {
    hashisloaded = true;
    if (hashisloaded && uiisloaded) {
        initMap();
    }
}
function mapzenuiLoaded() {
    uiisloaded = true;
    if (hashisloaded && uiisloaded) {
        initMap();
    }
}

function initMap() {
    bugOptions = {}
    window.map = (function () {
        // console.log('Leaflet version:', window.L.version)

        'use strict';

        var map_start_location = [40.70531887544228, -74.00976419448853, 15]; // NYC

        /*** Map ***/

        // leaflet-style URL hash pattern:
        // #[zoom],[lat],[lng]
        var url_hash = window.location.hash.slice(1, window.location.hash.length).split('/');

        if (url_hash.length == 3) {
            map_start_location = [url_hash[1],url_hash[2], url_hash[0]];
            // convert from strings
            map_start_location = map_start_location.map(Number);
        }

        var map = L.map('map',
            {"keyboardZoomOffset" : .05}
        );

        var layer = Tangram.leafletLayer({
            scene: scene_url,
            attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
        });

        if (query.quiet) {
            layer.options.attribution = "";
            map.attributionControl.setPrefix('');
            bugOptions = {
                locate: false,
                search: false
            }
            window.addEventListener("load", function() {
                document.getElementById("mz-bug").style.display = "none";
            });
        }

        if (query.noscroll) {
            map.scrollWheelZoom.disable();
        }

        window.layer = layer;
        scene = layer.scene;
        window.scene = scene;

        // setView expects format ([lat, long], zoom)
        map.setView(map_start_location.slice(0, 3), map_start_location[2]);

        hash = new L.Hash(map);

        layer.addTo(map);


        return map;

    }());
    MPZN.bug(bugOptions);
}

