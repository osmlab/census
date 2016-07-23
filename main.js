

mapboxgl.accessToken = 'pk.eyJ1IjoibWlrZWxtYXJvbiIsImEiOiJjaWZlY25lZGQ2cTJjc2trbmdiZDdjYjllIn0.Wx1n0X7aeCQyDTnK6_mrGw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-122.3359, 47.6037],
    zoom: 12
});

var geocoder = new mapboxgl.Geocoder({
    zoom: 12,
    container: 'geocoder-container'// Optional. Specify a unique container for the control to be added to.
});

map.addControl(geocoder);

map.addControl(new mapboxgl.Navigation());

// After the map style has loaded on the page, add a source layer and default
// styling for a single point.
map.on('load', function() {
    map.addSource('single-point', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });
    map.addSource('tile-polygon', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });

    map.addLayer({
        "id": "point",
        "source": "single-point",
        "type": "circle",
        "paint": {
            "circle-radius": 10,
            "circle-color": "#007cbf"
        }
    });
    map.addLayer({
        "id": "polygon",
        "source": "tile-polygon",
        "type": "fill",
        "paint": {
          "fill-color": "#999999",
          "fill-opacity": .5
        }
    });


    function drawTile(coords) {
      var tilebelt = require('tilebelt');
      var bbox = tilebelt.tileToBBOX(tilebelt.pointToTile(coords[0], coords[1], 12));
      var w = bbox[0]; var s = bbox[1]; var e = bbox[2]; var n = bbox[3];
      polygon_geojson.features[0].geometry.coordinates = [[[w,s], [w,n], [e,n], [e,s], [w,s] ]];
      map.getSource('tile-polygon').setData(polygon_geojson);
      return bbox;
    }

    // Listen for the `geocoder.input` event that is triggered when a user
    // makes a selection and add a symbol that matches the result.
    geocoder.on('result', function(ev) {
        map.getSource('single-point').setData(ev.result.geometry);
        var bbox = drawTile(ev.result.geometry.coordinates);
        parent.setLocationInForm(bbox);
    });


    var isDragging;

    // Is the cursor over a point? if this
    // flag is active, we listen for a mousedown event.
    var isCursorOverPoint;

    var canvas = map.getCanvasContainer();

    function mouseDown() {
        if (!isCursorOverPoint) return;

        isDragging = true;

        // Set a cursor indicator
        canvas.style.cursor = 'grab';

        // Mouse events
        map.on('mousemove', onMove);
        map.on('mouseup', onUp);
    }

    var point_geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [0, 0]
            }
        }]
    };

    var polygon_geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[0,0]]]
            }
        }]
    };

    function onMove(e) {
        if (!isDragging) return;
        var coords = e.lngLat;

        // Set a UI indicator for dragging.
        canvas.style.cursor = 'grabbing';

        // Update the Point feature in `geojson` coordinates
        // and call setData to the source layer `point` on it.
        point_geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
        map.getSource('single-point').setData(point_geojson);
    }

    function onUp(e) {
        if (!isDragging) return;
        var coords = e.lngLat;

        // Print the coordinates of where the point had
        // finished being dragged to on the map.
        //coordinates.style.display = 'block';
        //coordinates.innerHTML = 'Longitude: ' + coords.lng + '<br />Latitude: ' + coords.lat;
        //console.log(coords.lng + " " + coords.lat);

        var bbox = drawTile([coords.lng, coords.lat]);
        parent.setLocationInForm(bbox);
        canvas.style.cursor = '';
        isDragging = false;
    }

    // If a feature is found on map movement,
    // set a flag to permit a mousedown events.
    map.on('mousemove', function(e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ['point'] });

      // Change point and cursor style as a UI indicator
      // and set a flag to enable other mouse events.
      if (features.length) {
        map.setPaintProperty('point', 'circle-color', '#3bb2d0');
        canvas.style.cursor = 'move';
        isCursorOverPoint = true;
        map.dragPan.disable();
      } else {
        map.setPaintProperty('point', 'circle-color', '#3887be');
        canvas.style.cursor = '';
        isCursorOverPoint = false;
        map.dragPan.enable();
      }
    });

    // Set `true` to dispatch the event before other functions call it. This
    // is necessary for disabling the default map dragging behaviour.
    map.on('mousedown', mouseDown, true);

});
