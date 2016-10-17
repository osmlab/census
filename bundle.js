(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* global mapboxgl, $ */
mapboxgl.accessToken = 'pk.eyJ1IjoibWlrZWxtYXJvbiIsImEiOiJjaWZlY25lZGQ2cTJjc2trbmdiZDdjYjllIn0.Wx1n0X7aeCQyDTnK6_mrGw';

var tilebelt = require('tilebelt');

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [-18.3, 37.7],
  zoom: 1
});

map.scrollZoom.disable();

var marker = new mapboxgl.Marker(document.createElement('div'), {
  offset: [-10, -10]
});

var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

var geocoder = new mapboxgl.Geocoder({
  zoom: 12,
  container: 'geocoder-container'
});

var geolocate = new mapboxgl.Geolocate();

map.addControl(new mapboxgl.Navigation());
map.addControl(geolocate);
map.addControl(geocoder);

var polygon_geojson = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0]]]
    }
  }]
};

map.on('load', function() {
  map.addSource('tile-polygon', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  map.addLayer({
    id: 'polygon',
    source: 'tile-polygon',
    type: 'fill',
    paint: {
      'fill-color': 'rgba(0,0,0,0.25)',
      'fill-opacity': .5
    }
  });

  geocoder.on('result', onGeocoder);
  geolocate.on('geolocate', onGeoLocate);
  map.on('click', onClick);
});

function setPopup(coords) {
  popup.setLngLat(coords)
    .setText('Local tile set!')
    .addTo(map);
}

function drawTile(coords) {
  var bbox = tilebelt.tileToBBOX(tilebelt.pointToTile(coords[0], coords[1], 12));

  var w = bbox[0];
  var s = bbox[1];
  var e = bbox[2];
  var n = bbox[3];

  polygon_geojson.features[0].geometry.coordinates = [
    [
     [w, s],
     [w, n],
     [e, n],
     [e, s],
     [w, s]
    ]
  ];

  map.getSource('tile-polygon').setData(polygon_geojson);

  // Send result to form
  document.getElementById('bbox').setAttribute('value', bbox.join());
}

function onClick(e) {
  if (marker) marker.remove();
  var coords = [e.lngLat.lng, e.lngLat.lat];
  marker.setLngLat(coords).addTo(map);
  drawTile(coords);
  setPopup(coords);
}

function onGeocoder(e) {
  if (marker) marker.remove();
  var coords = e.result.geometry.coordinates;
  marker.setLngLat(coords).addTo(map);
  drawTile(coords);
  setPopup(coords);
}

function onGeoLocate(e) {
  if (marker) marker.remove();
  var coords = [e.coords.longitude, e.coords.latitude];
  marker.setLngLat(coords).addTo(map);
  drawTile(coords);
  setPopup(coords);
}

$.ajaxSetup({
  contentType: 'application/json; charset=utf-8',
  dataType: 'json'
});

$(function() {
  $('#js-scroll-to-survey').click(function() {
    $('html,body').animate({
      scrollTop: $('#survey').offset().top
    }, 500);
  });

  $('#form').submit(function(e) {
    e.preventDefault();
    $('#form').addClass('loading');
    var send = {};
    $('#form').serializeArray().forEach(function(obj) {
       send[obj['name']] = obj['value'];
    });
    $.ajax({
      url: 'https://osw5bpi3jg.execute-api.us-east-1.amazonaws.com/api/entry',
      type: 'POST',
      data: JSON.stringify(send),
      error: function(xhr, error) {
        window.alert('Error!  Status = ' + xhr.status + ' Message = ' + error);
        $('#form').removeClass('loading');
      },
      success: function() {
        window.alert('thanks for your submission!');
        $('#form').removeClass('loading');
        $('#js-submit').addClass('disabled');
      }
    });
    return false;
  });
});

},{"tilebelt":2}],2:[function(require,module,exports){
// a tile is an array [x,y,z]
var d2r = Math.PI / 180,
    r2d = 180 / Math.PI;

function tileToBBOX (tile) {
    var e = tile2lon(tile[0]+1,tile[2]);
    var w = tile2lon(tile[0],tile[2]);
    var s = tile2lat(tile[1]+1,tile[2]);
    var n = tile2lat(tile[1],tile[2]);
    return [w,s,e,n];
}

function tileToGeoJSON (tile) {
    var bbox = tileToBBOX(tile);
    var poly = {
        type: 'Polygon',
        coordinates:
            [
                [
                    [bbox[0],bbox[1]],
                    [bbox[0], bbox[3]],
                    [bbox[2], bbox[3]],
                    [bbox[2], bbox[1]],
                    [bbox[0], bbox[1]]
                ]
            ]
    };
    return poly;
}

function tile2lon(x, z) {
    return (x/Math.pow(2,z)*360-180);
}

function tile2lat(y, z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (r2d*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function pointToTile(lon, lat, z) {
    var tile = pointToTileFraction(lon, lat, z);
    tile[0] = Math.floor(tile[0]);
    tile[1] = Math.floor(tile[1]);
    return tile;
}

function getChildren (tile) {
    return [
        [tile[0]*2, tile[1]*2, tile[2]+1],
        [tile[0]*2+1, tile[1]*2, tile[2 ]+1],
        [tile[0]*2+1, tile[1]*2+1, tile[2]+1],
        [tile[0]*2, tile[1]*2+1, tile[2]+1],
    ];
}

function getParent (tile) {
    // top left
    if(tile[0]%2===0 && tile[1]%2===0) {
        return [tile[0]/2, tile[1]/2, tile[2]-1];
    }
    // bottom left
    else if((tile[0]%2===0) && (!tile[1]%2===0)) {
        return [tile[0]/2, (tile[1]-1)/2, tile[2]-1];
    }
    // top right
    else if((!tile[0]%2===0) && (tile[1]%2===0)) {
        return [(tile[0]-1)/2, (tile[1])/2, tile[2]-1];
    }
    // bottom right
    else {
        return [(tile[0]-1)/2, (tile[1]-1)/2, tile[2]-1];
    }
}

function getSiblings (tile) {
    return getChildren(getParent(tile));
}

function hasSiblings(tile, tiles) {
    var siblings = getSiblings(tile);
    for (var i = 0; i < siblings.length; i++) {
        if (!hasTile(tiles, siblings[i])) return false;
    }
    return true;
}

function hasTile(tiles, tile) {
    for (var i = 0; i < tiles.length; i++) {
        if (tilesEqual(tiles[i], tile)) return true;
    }
    return false;
}

function tilesEqual(tile1, tile2) {
    return (
        tile1[0] === tile2[0] &&
        tile1[1] === tile2[1] &&
        tile1[2] === tile2[2]
    );
}

function tileToQuadkey(tile) {
  var index = '';
  for (var z = tile[2]; z > 0; z--) {
      var b = 0;
      var mask = 1 << (z - 1);
      if ((tile[0] & mask) !== 0) b++;
      if ((tile[1] & mask) !== 0) b += 2;
      index += b.toString();
  }
  return index;
}

function quadkeyToTile(quadkey) {
    var x = 0;
    var y = 0;
    var z = quadkey.length;

    for (var i = z; i > 0; i--) {
        var mask = 1 << (i - 1);
        switch (quadkey[z - i]) {
            case '0':
                break;

            case '1':
                x |= mask;
                break;

            case '2':
                y |= mask;
                break;

            case '3':
                x |= mask;
                y |= mask;
                break;
        }
    }
    return [x,y,z];
}

function bboxToTile(bboxCoords) {
    var min = pointToTile(bboxCoords[0], bboxCoords[1], 32);
    var max = pointToTile(bboxCoords[2], bboxCoords[3], 32);
    var bbox = [min[0], min[1], max[0], max[1]];

    var z = getBboxZoom(bbox);
    if (z === 0) return [0,0,0];
    var x = bbox[0] >>> (32 - z);
    var y = bbox[1] >>> (32 - z);
    return [x,y,z];
}

function getBboxZoom(bbox) {
    var MAX_ZOOM = 28;
    for (var z = 0; z < MAX_ZOOM; z++) {
        var mask = 1 << (32 - (z + 1));
        if (((bbox[0] & mask) != (bbox[2] & mask)) ||
            ((bbox[1] & mask) != (bbox[3] & mask))) {
            return z;
        }
    }

    return MAX_ZOOM;
}

function pointToTileFraction(lon, lat, z) {
    var sin = Math.sin(lat * d2r),
        z2 = Math.pow(2, z),
        x = z2 * (lon / 360 + 0.5),
        y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    return [x, y, z];
}

module.exports = {
    tileToGeoJSON: tileToGeoJSON,
    tileToBBOX: tileToBBOX,
    getChildren: getChildren,
    getParent: getParent,
    getSiblings: getSiblings,
    hasTile: hasTile,
    hasSiblings: hasSiblings,
    tilesEqual: tilesEqual,
    tileToQuadkey: tileToQuadkey,
    quadkeyToTile: quadkeyToTile,
    pointToTile: pointToTile,
    bboxToTile: bboxToTile,
    pointToTileFraction: pointToTileFraction
};

},{}]},{},[1]);
