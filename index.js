'use strict';

window.mapboxgl = require('mapbox-gl');
require('mapbox-gl-geocoder');

var animate = require('animateplus');
var $ = require('jquery');
var tilebelt = require('tilebelt');

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
    .setText('My local tile!')
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

  $('#form').on('keyup keypress', function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
      e.preventDefault();
      return false;
    }
  });

  $('#js-scroll-to-survey').click(function() {
    $('html,body').animate({
      scrollTop: $('#survey').offset().top
    }, 500);
  });

  $form.submit(function(e) {
    e.preventDefault();

    if( $('#js-submit').hasClass("disabled") ){
      return false
    }

    $form.addClass('loading');
    var send = {};
    $form.serializeArray().forEach(function(obj) {
       send[obj['name']] = obj['value'];
    });

    var split = send.bbox.split(",")

    send.w = split[0];
    send.s = split[1];
    send.e = split[2];
    send.n = split[3];

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

// Hearts animations
var heartsContainer = document.getElementById('hearts-animation');
var canvas = [700, 400];

for (var i = 0; i < 20; i++) draw();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function complete(el) {
  heartsContainer.removeChild(el);
  draw();
}

function draw() {
  var heart = document.createElement('img');
  heart.src = 'img/heart.svg';
  heart.style.position = 'absolute';
  heartsContainer.appendChild(heart);

  // Ensure some values are re-set.
  heart.style.opacity = 0;
  heart.style.transform = 'translateY(0)';

  heart.style.right = randomInt(0, canvas[0]);
  heart.style.bottom = randomInt(0, canvas[1] / 2);
  setAnimation(heart);
}

function setAnimation(el) {
  var params = new Map();
  params.set('el', el);
  params.set('duration', randomInt(3000, 5000));
  params.set('delay', randomInt(50, 100));
  params.set('opacity', [0, 1]);
  params.set('height', [randomInt(0, 10), 20]);
  params.set('translateY', -400);
  params.set('easing', 'easeInQuad');
  params.set('complete', complete.bind(this, el));
  animate(params);
}
