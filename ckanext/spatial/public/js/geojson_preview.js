// geojson preview module
ckan.module('geojsonpreview', function (jQuery, _) {
  return {
    options: {
      featureProcessing: function(feature, layer) {
        var table = '<table class="table table-striped table-bordered table-condensed"><tbody>{body}</tbody></table>';
        var row = '<tr><th>{key}</th><td>{value}</td></tr>';
        var body = '';
        var reserved = ['stroke', 'marker-color', 'marker-size', 'fill', 'fill-opacity', 'stroke-opacity', 'stroke-width'];
        if (feature.properties) {
          jQuery.each(feature.properties, function(key, value){
            if (reserved.indexOf(key) == -1) {
              if (value != null && typeof value === 'object') {
                value = JSON.stringify(value);
              }
              body += L.Util.template(row, {key: key, value: value});
            }
          });
          var popupContent = L.Util.template(table, {body: body});
          layer.bindPopup(popupContent);
        }
      },
      style: function(feature) {
        var staticstyles = {
            opacity: 0.7,
            fillOpacity: 0.1,
            weight: 5
        };
        // Support the mapbox simplestyle-spec
        if (feature.properties.stroke) {
          staticstyles['color'] = feature.properties.stroke;
        }
        if (feature.properties['marker-color']) {
          staticstyles['color'] = feature.properties['marker-color'];
        }
        if (feature.properties['marker-size']) {
          staticstyles['radius'] = feature.properties['marker-size'];
        }
        if (feature.properties['fill']) {
          staticstyles['fillColor'] = feature.properties['fill'];
        }
        if (feature.properties['fill-opacity']) {
          staticstyles['fillOpacity'] = feature.properties['fill-opacity'];
        }
        if (feature.properties['stroke-opacity']) {
          staticstyles['opacity'] = feature.properties['stroke-opacity'];
        }
        if (feature.properties['stroke-width']) {
          staticstyles['weight'] = feature.properties['stroke-width'];
        }
        return staticstyles;
      },
      i18n: {
        'error': _('An error occurred: %(text)s %(error)s')
      }
    },
    initialize: function () {
      var self = this;
      
      self.el.empty();
      self.el.append($("<div></div>").attr("id","map"));
      self.map = ckan.commonLeafletMap('map', this.options.map_config);
      self.realtime = L.realtime({
        url: preload_resource['original_url'],
        crossOrigin: false,
        type: 'json'
      },
      {
        interval: 1000,
        style: self.options.style,
        pointToLayer: function(feature, latlng) {
          return new L.CircleMarker(latlng, self.options.style);
        },
        onEachFeature: self.options.featureProcessing
      }).addTo(self.map);
      self.started = false; 
      self.realtime.on('update', function(e) {
        var popupContent = function(fId) {
          var feature = e.features[fId], c = feature.geometry.coordinates;
          return 'Wander drone at ';     
        },
        setFeaturePopup = function(fId) {
          self.options.featureProcessing(e.features[fId], self.realtime.getLayer(fId));
        };
        if (!self.started) {
          self.map.fitBounds(self.realtime.getBounds(), {});
          self.started = true;
        }
        updateFeatureIcon = function (fId) {
          var feature = e.features[fId], mycolor = feature.properties['marker-color'];
          self.realtime.getLayer(fId).setStyle(self.options.style(feature));
        };
        Object.keys(e.update).forEach(updateFeatureIcon);
        Object.keys(e.enter).forEach(setFeaturePopup);
        Object.keys(e.update).forEach(setFeaturePopup);
      });
    },

    showError: function (jqXHR, textStatus, errorThrown) {
      if (textStatus == 'error' && jqXHR.responseText.length) {
        console.log(jqXHR.responseText);
      } else {
        console.log(this.i18n('error', {text: textStatus, error: errorThrown}));
      }
    }
  };
});
