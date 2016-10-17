'use strict';

window.mapboxgl = require('mapbox-gl');
require('mapbox-gl-geocoder');

var tilebelt = require('tilebelt');
var animate = require('animateplus');
var $ = require('jquery');

/* global mapboxgl */
mapboxgl.accessToken = 'pk.eyJ1IjoibWlrZWxtYXJvbiIsImEiOiJjaWZlY25lZGQ2cTJjc2trbmdiZDdjYjllIn0.Wx1n0X7aeCQyDTnK6_mrGw';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v10',
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
      coordinates: []
    }
  }]
};

map.on('load', function() {
  map.addSource('tile-polygon', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      properties: [],
      features: []
    }
  });

  map.addLayer({
    id: 'polygon',
    source: 'tile-polygon',
    type: 'fill',
    paint: {
      'fill-color': 'rgba(29, 161, 242, 0.25)'
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
  var $form = $('#form');

  $('#js-scroll-to-survey').click(function() {
    $('html,body').animate({
      scrollTop: $('#survey').offset().top
    }, 500);
  });

  $form.submit(function(e) {
    e.preventDefault();
    $form.addClass('loading');
    var send = {};
    $form.serializeArray().forEach(function(obj) {
       send[obj['name']] = obj['value'];
    });

    $.ajax({
      url: 'https://osw5bpi3jg.execute-api.us-east-1.amazonaws.com/api/entry',
      type: 'POST',
      data: JSON.stringify(send),
      error: function(xhr, error) {
        window.alert('Error!  Status = ' + xhr.status + ' Message = ' + error);
        $form.removeClass('loading');
      },
      success: function() {
        window.alert('thanks for your submission!');
        $form.removeClass('loading');
        $('#js-submit').addClass('disabled').attr('value', 'Submitted!');
      }
    });
    return false;
  });
});
