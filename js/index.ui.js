var dss = dss || {};

$(function () {

  // http://stackoverflow.com/questions/11978995/how-to-change-color-of-svg-image-using-css-jquery-svg-image-replacement
  // jQuery('img.svg').each(function(){
  //     var $img = jQuery(this);
  //     var imgID = $img.attr('id');
  //     var imgClass = $img.attr('class');
  //     var imgURL = $img.attr('src');

  //     jQuery.get(imgURL, function(data) {
  //         // Get the SVG tag, ignore the rest
  //         var $svg = jQuery(data).find('svg');

  //         // Add replaced image's ID to the new SVG
  //         if(typeof imgID !== 'undefined') {
  //             $svg = $svg.attr('id', imgID);
  //         }
  //         // Add replaced image's classes to the new SVG
  //         if(typeof imgClass !== 'undefined') {
  //             $svg = $svg.attr('class', imgClass+' replaced-svg');
  //         }

  //         // Remove any invalid XML tags as per http://validator.w3.org
  //         $svg = $svg.removeAttr('xmlns:a');

  //         // Replace image with new SVG
  //         $img.replaceWith($svg);

  //     }, 'xml');

  // });


  var colors = {
    blue : ['rgb(189, 215, 231)', 'rgb(107, 174, 214)', 'rgb(49, 130, 189)', 'rgb(8, 81, 156)'],
    green : ['rgb(186, 228, 179)', 'rgb(116, 196, 118)', 'rgb(49, 163, 84)', 'rgb(0, 109, 44)'],
    red : ['rgb(252, 174, 145)', 'rgb(251, 106, 74)', 'rgb(222, 45, 38)', 'rgb(165, 15, 21)'],
    orange: ['rgb(254, 217, 142)', 'rgb(254, 153, 41)', 'rgb(217, 95, 14)', 'rgb(153, 52, 4)'],
    violett: ['rgb(203, 201, 226)', 'rgb(158, 154, 200)', 'rgb(117, 107, 177)', 'rgb(84, 39, 143)'],
    pink: ['rgb(215, 181, 216)', 'rgb(223, 101, 176)', 'rgb(221, 28, 119)', 'rgb(152, 0, 67)']
  }


  function getAlert(strong, text, type) {

    return '<div class="alert alert-'+type+' alert-dismissible container" role="alert">\
              <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
              <strong>' + strong + '</strong> ' + text + '\
            </div>';
  }

  $('#save').on('click', function () {

    var blob = new Blob([JSON.stringify(dss.ui.model().model, null, 2)], {type: 'application/json'});
    saveAs(blob, 'solid-dss.json');
  
  });

  $('#load').on('change', function (evt) {

    var file = evt.target.files.item(0)
      , reader = new FileReader()
      ;
    
    reader.onload = function (e) {
    
      var model = JSON.parse(e.target.result);
      //console.log(model);
      if (model)
        dss.ui.setModel(model);
      else
        $(getAlert('Error.', 'Could not parse parameter file.', 'danger')).prependTo($('body')).delay(6000).fadeOut(500, function () { $(this).remove(); });

    };

    reader.readAsText(file);

  });

  var map = new L.Map('map', {
    maxBounds: L.latLngBounds(L.latLng(35.375, -20.375), L.latLng(70.375, 40.375))
  });
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 9,
      minZoom: 4
  }).addTo(map);
  map.setView([49.875, 7.875], 7);

  var latitude_mn = 25.25
  , longitude_mn = -40.50
  , latitude_mx = 75.50
  , longitude_mx = 75.50
  , grid = 0.25
  , multiPolyline = []
  ;

  for (var lat = latitude_mn; lat <= latitude_mx; lat+=grid)
    multiPolyline.push([[lat, longitude_mn], [lat, longitude_mx]]);
  for (var lon = longitude_mn; lon <= longitude_mx; lon+=grid)
    multiPolyline.push([[latitude_mn, lon], [latitude_mx, lon]]);

  L.multiPolyline(multiPolyline, {
    color: '#333',
    weight: 1,
    opacity: 0.3
  }).addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = parseFloat(pos.coords.latitude.toFixed(3));
        var lon = parseFloat(pos.coords.longitude.toFixed(3));
        $('#latitude').prop('value', lat);
        $('#longitude').prop('value', lon);
        map.setView([lat, lon], 8);
        map.fireEvent('click', { latlng: L.latLng(lat, lon) })
      },
      function (err) {
        console.log(err);     
      }
    );
  }
  
  var mapMarker = L.marker(null, { draggable: false }).bindPopup('<div id="spinner"></div>', { className: 'map-spinner', closeButton: false });
  var mapSpinner = new Spinner(/*{color: '#333', lines: 10, length: 30, radius: 20, width: 8, speed: 0.5}*/);
  map.on('click', function (event) {
    mapMarker.setLatLng(event.latlng).addTo(map);
    //console.log(event.latlng);
    var lat = event.latlng.lat, lon = event.latlng.lng;
    var dec = [0.125,0.375,0.625,0.875];
    var lat_ecad = 0;
    var lon_ecad = 0;
    var lat_dec = Number('0.' + lat.toFixed(3).split('.')[1]);
    var lon_dec = Number('0.' + lon.toFixed(3).split('.')[1]);
    var lat_nat = lat | 0;
    var lon_nat = lon | 0;

    for (var i = 0; i < dec.length; i++) {
      if (Math.abs(dec[i] - lat_dec) <= 0.125)
        lat_ecad = Number(lat_nat.toString() + '.' + dec[i].toString().split('.')[1]);
      if (Math.abs(dec[i] - lon_dec) <= 0.125)
        lon_ecad = Number(lon_nat.toString() + '.' + dec[i].toString().split('.')[1]);
    }

    var urls = [
      "http://zalf-lse.github.io/rr/rr_" + lat_ecad + "_" + lon_ecad + ".json.gz",
      "http://zalf-lse.github.io/tn/tn_" + lat_ecad + "_" + lon_ecad + ".json.gz",
      "http://zalf-lse.github.io/tg/tg_" + lat_ecad + "_" + lon_ecad + ".json.gz",
      "http://zalf-lse.github.io/tx/tx_" + lat_ecad + "_" + lon_ecad + ".json.gz"
    ];

    var res = [];
    function onResult(x) {
      res.push(x);
    //  console.log(x);
    //  console.log(res.reduce(function (a, b) { return a + b; }));
      if (res.length === 4) {
        if (res.reduce(function (a, b) { return a + b; }) === 4) {
          mapMarker.setPopupContent('<div>Weather data available</div>');
          mapMarker.openPopup();
          $('#latitude').prop('value', lat_ecad);
          $('#longitude').prop('value', lon_ecad);
        } else {
          mapMarker.setPopupContent('<div style="color: rgb(222, 45, 38);">No weather data available.</div>');
          mapMarker.openPopup();
        }

      }
    }

    $.each(urls, function (index, url) {
      $.ajax({
        type: 'HEAD',
        url: url,
        success: function(message, text, response){
          onResult(1);
        },
        error: function(message, text, response){
          onResult(0);
        }
      });
    });

  });

  map.on('popupopen', function () {
    // mapSpinner.spin($('#map #spinner')[0]);
  });

  dss.ui = {
    map: map,
    model: function () {

      var model = {
          location: {},
          soil: {},
          herd: {},
          feed: {},
          crop: {},
          rotation: {},
          grassland: {},
          fertilizer: {},
          simulation: {}
        }
      , schema = {
          location: {},
          soil: {},
          herd: {},
          feed: {},
          crop: {},
          grassland: {},
          fertilizer: {},
          simulation: {}
        }
      ;
    
      $('.parameter-location, .parameter-soil, .parameter-herd, .parameter-feed, .parameter-crop, .parameter-grassland, .parameter-fertilizer, .parameter-simulation').each(function () {

        var id = $(this).prop('id')
          , min = $(this).prop('min')
          , max = $(this).prop('max')
          , type = $(this).prop('type')
          , tagName = $(this).prop('tagName')
          , submodel = ''
          , value = $(this).prop('value')
          ;

        if (tagName !== 'TEXTAREA' && type !== 'text') {
          if (tagName === 'SELECT' && (value === 'No' || value === 'Yes'))
            value = (value === 'No' ? false : true);
          else if (type === 'number')
            value = parseFloat(value);
        }

        if (value === NaN)
          value = 0;

        if ($(this).hasClass('parameter-location'))
          submodel = 'location';
        else if ($(this).hasClass('parameter-soil'))
          submodel = 'soil';
        else if ($(this).hasClass('parameter-herd'))
          submodel = 'herd';
        else if ($(this).hasClass('parameter-feed'))
          submodel = 'feed';
        else if ($(this).hasClass('parameter-crop'))
          submodel = 'crop';
        else if ($(this).hasClass('parameter-grassland'))
          submodel = 'grassland';
        else if ($(this).hasClass('parameter-fertilizer'))
          submodel = 'fertilizer';
        else if ($(this).hasClass('parameter-simulation'))
          submodel = 'simulation';

        model[submodel][$(this).prop('id')] = value;
        schema[submodel][$(this).prop('id')] = {
            initialValue: value
          , type: (typeof value)
          , min: (typeof value === 'number' ? parseFloat(min) : min)
          , max: (typeof value === 'number' ? parseFloat(max) : max)
        };
        
      });

      model.rotation = dss.ui.rotation.rotation();

      return {
          model: model
        , schema: schema
      }
      
    },
    setModel: function (model) {

    //  console.log(Object.keys(model));

      Object.keys(model).forEach(function (submodel) {
        if (submodel === 'rotation') {
          dss.ui.rotation.setRotation(model[submodel]);
        } else {
          Object.keys(model[submodel]).forEach(function (parameter) {
            var value = model[submodel][parameter];
            value = (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value);  
            $('#'+parameter).prop('value', value);
          });
        }
      });

    },
    milkYieldData: function () {

      var model = dss.ui.model().model
        , csv = ''
        ;

      if (model.herd['milk-yield-data'].trim().length === 0) {
        var data = dairy.milk.data[model.herd['milk-yield']];
        for (var i = 0, is = data.length; i < is; i++)
          csv += Math.round(data[i][0] / 7) + ';' + data[i][1] + '\n';
      } else {
        csv = model.herd['milk-yield-data'].trim();
      }

      /* parse lactation data */
      var milkYieldData = { t: [], y: [] }
        , lines = csv.trim().split('\n')
        , sep = (lines[0].indexOf(';') > 0) ? ';' : '\t'
        ;
      for (var l = 0, ls = lines.length; l < ls; l++) {
        var line = lines[l].split(sep);
        milkYieldData.t[l] = parseFloat(line[0]);
        milkYieldData.y[l] = parseFloat(line[1]);
      }

      return milkYieldData;
    },
    charts: {
      weather: c3.generate({
        bindto: '#weather-chart-1',
        data: {
            x: 'x',
            xFormat: '%Y-%m-%d', // 'xFormat' can be used as custom format of 'x'
            columns: [
                ['x'],
                ['precipitation'],
                ['temperature'],
                ['radiation'],
                ['daylength']
            ],
            names: {
                precipitation: 'precipitation monthly sum',
                temperature: 'mean temperature monthly average',
                radiation: 'global radiation monthly average',
                daylength: 'daylength monthly average'
            },
            // type: 'bar',
            axes: {
                precipitation: 'y',
                temperature: 'y2',
                radiation: 'y2',
                daylength: 'y2'
            }
            // ,
            // colors: {
            //     precipitation: colors.blue[2],
            //     temperature: colors.red[2]
            // }
        },
        // bar: {
        //     width: {
        //         ratio: 0.9 // this makes bar width 50% of length between ticks
        //     }
        // },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y/%m',
                    values: ['1995-06-01', '1996-06-01', '1997-06-01', '1998-06-01', '1999-06-01', '2000-06-01', 
                    '2001-06-01', '2002-06-01', '2003-06-01', '2004-06-01', '2005-06-01', '2006-06-01', '2007-06-01', 
                    '2008-06-01', '2009-06-01', '2010-06-01', '2011-06-01', '2012-06-01', '2013-06-01', ]
                }
            },
            y: {
                show: true,
                label: '[mm]'
            },
            y2: {
                show: true,
                label: '[MJ m-2 & h & °C]'
            }
        },
        grid: {
            y: {
                lines: [
                    {value: 0}
                ]
            }
        },
        // zoom: {
        //   enabled: true,
        //   rescale: true
        // }
        // subchart: {
        //     show: true
        // },
        tooltip: {
          format: {
            value: function (value, ratio, id, index) { return value.toFixed(1); }
          }
        },
        point: {
          show: false
        }
      }),
      arable: c3.generate({
        bindto: '#arable-chart-1',
        data: {
          columns: [],
          type : 'pie'
        },
        pie: { 
          expand: false 
        }
      }),
      area: c3.generate({
        bindto: '#area-chart-1',
        data: {
          columns: [],
          type : 'pie'
        },
        pie: { 
          expand: false 
        }
      }),
      wood: c3.generate({
        bindto: '#dairy-chart-1',
        data: {
          x: 'x',
          columns: [['x'], ['fit'], ['data']],
          type: 'line',
          names: {
            fit: 'wood lactation curve (fitted)',
            data: 'milk yield data'
          }
        },
        axis: {
          x: {
            label: '[week]'
          },
          y: {
            label: '[kg milk]'
          }
        },
        tooltip: {
          format: {
            value: function (value, ratio, id, index) { return value.toFixed(1); }
          }
        }
      }),
      herd: c3.generate({
        bindto: '#dairy-chart-2',
        data: {
          columns: [['parity1', 0], ['parity2', 0], ['parity3', 0], ['heifers_in', 0], ['heifers_out', 0]],
          type: 'bar',
          bar: {
            width: {
              ratio: 1
            }
          },
          names: {
            parity1: 'Parity 1',
            parity2: 'Parity 2',
            parity3: 'Parity >2',
            heifers_in: 'Heifers bought, monthly average',
            heifers_out: 'Heifers sold, monthly average',
          }
        },
        axis: {
          y: {
            label: 'no. animals'
          }
        }
      }),
      pastureIntake: c3.generate({
        bindto: '#pasture-intake-chart',
        data: {
          x: 'x',
          columns: [],
          names: {
            intake: 'Herbage intake from grazing',
            omd: 'Grazed herbage OMD',
            cp: 'Grazed herbage CP',
            cf: 'Grazed herbage CF',
          },
          axes: {
            intake: 'y',
            omd: 'y2',
            cp: 'y2',
            cf: 'y2',
          }
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              format: '%Y-%m-%d',
              values: ['1995-06-01', '1996-06-01', '1997-06-01', '1998-06-01', '1999-06-01', '2000-06-01', 
              '2001-06-01', '2002-06-01', '2003-06-01', '2004-06-01', '2005-06-01', '2006-06-01', '2007-06-01', 
              '2008-06-01', '2009-06-01', '2010-06-01', '2011-06-01', '2012-06-01', '2013-06-01', ]
            }
          },
          y: {
              show: true,
              label: '[kg DM / cow]'
          },
          y2: {
              show: true,
              label: '[%]'
          }
        },
        // subchart: {
        //   show: true
        // },
        point: {
          show: false
        }
      }),
      pastureDrymatter: c3.generate({
        bindto: '#pasture-drymatter-chart',
        data: {
            x: 'x',
            columns: [],
            names: {}
            // ,
            // colors: {
            //     precipitation: colors.blue[2],
            //     temperature: colors.red[2]
            // }
        },
        // bar: {
        //     width: {
        //         ratio: 0.9 // this makes bar width 50% of length between ticks
        //     }
        // },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d',
                    values: ['1995-06-01', '1996-06-01', '1997-06-01', '1998-06-01', '1999-06-01', '2000-06-01', 
                    '2001-06-01', '2002-06-01', '2003-06-01', '2004-06-01', '2005-06-01', '2006-06-01', '2007-06-01', 
                    '2008-06-01', '2009-06-01', '2010-06-01', '2011-06-01', '2012-06-01', '2013-06-01', ]
                }
            }
        },
        // zoom: {
        //   enabled: true,
        //   rescale: true
        // }
        // subchart: {
        //     show: true
        // },
        point: {
          show: false
        }/*,
        tooltip: {
          format: {
            value: function (value, ratio, id, index) { return value.toFixed(1); }
          }
        }*/
      })
    },
    rotation: new CropRotationUi('#crop-rotation', {
      crops: [{
        name: 'wheat',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          },
          myparam3: {
            name: 'name3',
            unit: '%',
            help: 'help'
          },
          myparam4: {
            name: 'name4',
            unit: '%',
            help: 'help'
          },
          myparam5: {
            name: 'name5',
            unit: '%',
            help: 'help'
          },
          myparam6: {
            name: 'name6',
            unit: '%',
            help: 'help'
          },
        }
      }, {
        name: 'grass-land',
        isPerennial: true,
        parameter: {
          'ryegrass-share': {
            name: 'Ryegrass',
            unit: '%',
            help: 'Initial ryegrass share of total DM',
            min: 0,
            max: 100,
            value: 80
          },
          'whiteclover-share': {
            name: 'White clover',
            unit: '%',
            help: 'Initial white clover share of total DM',
            min: 0,
            max: 100,
            value: 20
          }
        }
      }, {
        name: 'maize',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      },{
        name: 'barley',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      }, {
        name: 'oats',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      }, {
        name: 'soy',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      },{
        name: 'beet',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      }, {
        name: 'pea',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      }, {
        name: 'rye',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      }, {
        name: 'rape-seed',
        isPerennial: false,
        parameter: {
          myparam1: {
            name: 'name',
            unit: '%',
            help: 'help'
          },
          myparam2: {
            name: 'name2',
            unit: '%',
            help: 'help'
          }
        }
      }],
      maxRotationLength: 5
    }, function (crop) {

      var eqCrops = $('#rotation-eq-crops').prop('value') === 'Yes';
      var ha = parseInt($('#arable-area').val());
      var perennial = (crop.isPerennial ? ', perennial' : '');
      var divisor = (eqCrops ? dss.ui.rotation.rotationLength() : 1);
      var title = crop.name + perennial + ', ' + (crop.area * ha / divisor) + ' ha ' + (eqCrops ? 'each year' : '');

      $('#crop-rotation > #edit').empty();
      $('#crop-rotation > #edit').append('<div class="text col-lg-12"><h4>'+title+'</h4></div>');

      var column1 = $("<div class='col-md-4'>").appendTo($('#crop-rotation > #edit'));
      var column2 = $("<div class='col-md-4'>").appendTo($('#crop-rotation > #edit'));
      var column3 = $("<div class='col-md-4'>").appendTo($('#crop-rotation > #edit'));

      var i = 1;

      for (prop in crop.parameter) {

        if (crop.parameter.hasOwnProperty(prop)) {

          var param = crop.parameter[prop];

          $('<label for="'+prop+'">'+param.name+'</label>\
            <div class="input-group">\
              <input id="'+prop+'" type="number" data-toggle="popover" data-placement="bottom" class="form-control" value="'+param.value+'" min="'+param.min+'" max="'+param.max+'" data-content="'+param.help+'">\
              <span class="input-group-addon">'+param.unit+'</span>\
            </div>\
            <br>'
          ).appendTo((i === 1) ? column1 : ((i === 2) ? column2 : column3));

          if (i === 3)
            i = 1;
          else
            i++;

        }
      }

      $('#crop-rotation > #edit [data-toggle="popover"]').popover({
        trigger: 'hover'
      });

      $('#crop-rotation > #edit input').change(function () {

        crop.parameter[ $(this).attr('id')].value = $(this).val();
        
      });

    })

  };

  dss.ui.rotation.setRotation([
    [
      {
        "crop": {
          "name": "wheat"
        },
        "id": 1427186614808,
        "to": [
          1427186618105,
          1427186685248
        ]
      }
    ],
    [
      {
        "crop": {
          "name": "barley"
        },
        "id": 1427186618105,
        "to": [
          1427186641299,
          1427186688496
        ]
      },
      {
        "crop": {
          "name": "soy"
        },
        "id": 1427186685248,
        "to": [
          1427186688496,
          1427186833246
        ]
      }
    ],
    [
      {
        "crop": {
          "name": "grass-land"
        },
        "id": 1427186641299,
        "to": [
          1427186660271
        ]
      },
      {
        "crop": {
          "name": "maize"
        },
        "id": 1427186688496,
        "to": [
          1427186728919
        ]
      },
      {
        "crop": {
          "name": "wheat"
        },
        "id": 1427186833246,
        "to": [
          1427186728919
        ]
      }
    ],
    [
      {
        "crop": {
          "name": "grass-land"
        },
        "id": 1427186660271,
        "to": [
          1427186662489
        ]
      },
      {
        "crop": {
          "name": "barley"
        },
        "id": 1427186728919,
        "to": [
          1427186662489,
          1427186662500
        ]
      }
    ],
    [
      {
        "crop": {
          "name": "grass-land"
        },
        "id": 1427186662489,
        "to": [
          1427186614808
        ]
      },
      {
        "crop": {
          "name": "rye"
        },
        "id": 1427186662500,
        "to": [
          1427186614808
        ]
      }
    ]
  ]);


  $(".scroll-area").scrollspy({ target: "#navbar" });

  $("#navbar").on('activate.bs.scrollspy', function () {

    var add = ($('#navbar li.active > a').prop('href').split('#')[1] !== 'intro');
    $('#navbar li img').toggleClass('inflate', add, 400);
    // $('#title').toggle(!add);
    $('#title').toggleClass('deflate', add, 400);

      //console.log(add);
  });

  $('#weather-charts').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {

      if (isInView) {

        var lat = parseFloat(Number($('#latitude').prop('value')).toFixed(3));
        var lon = parseFloat(Number($('#longitude').prop('value')).toFixed(3));

        if (!dss.fn.modelChanged('location') && dss.ui.charts.weather.data().length > 0)
          return;

        var spinner = new Spinner(/*{color: '#333', lines: 10, length: 30, radius: 20, width: 8, speed: 0.5}*/).spin($('#weather-charts')[0]);
      
        dss.fn.weather(lat, lon, function (weather, error) { 

           $('#weather-charts .spinner').remove();

          if (weather === null && error) {
            // on fail TODO: keep failing coords
            $(getAlert('Error.', error.text, 'danger')).prependTo($('body')).delay(6000).fadeOut(500, function () { $(this).remove(); });

            return;
          }
          


          // var yearly_precip = weather.precip.reduce(function (a, b, i) {
          //   if (weather.doy[i] === 1) {
          //     a.push({ year: weather.date[i].split('-')[0], value: b});
          //   } else {
          //     a[a.length - 1].value += b;
          //   }
          //   return a;
          // }, []);

          // var monthly_precip = weather.precip.reduce(function (a, b, i) {
          //   var month = weather.date[i].substring(0, 7);
          //   if (a.length === 0 || month !== a[a.length - 1].month) {
          //     a.push({ month: month, value: b });
          //   } else {
          //     a[a.length - 1].value += b;
          //   }
          //   return a;
          // }, []);

          var monthly_x_axis= weather.date.reduce(function (a, b, i) {
            var month = b.substring(0, 7);
            if (month + '-01' !== a[a.length - 1])
              a.push(month + '-01');
            return a;
          }, ['x']);

          var monthly_precip = weather.precip.reduce(function (a, b, i) {
            var month = weather.date[i].substring(0, 7);
            if (month + '-01' !== monthly_x_axis[a.length - 1]) {
              a.push(b);
            } else {
              a[a.length - 1] += b;
            }
            return a;
          }, ['precipitation']);

          // console.log(monthly_precip);

          // var yearly_precip = weather.precip.reduce(function (a, b, i) {
          //   var year = weather.date[i].substring(0, 4);
          //   if (year !== a[0][a[0].length - 1]) {
          //     a[0].push(year);
          //     a[1].push(b);
          //   } else {
          //     a[1][a[1].length - 1] += b;
          //   }
          //   return a;
          // }, [['x'], ['precipitation']]);

          // console.log(yearly_precip);

          var monthly_tavg = weather.tavg.reduce(function (a, b, i) {
            var month = weather.date[i].substring(0, 7);
            if (a.length === 0 ||month !== a[a.length - 1].month) {
              a.push({ month: month, value: b, count: 1 });
            } else {
              a[a.length - 1].value += b;
              a[a.length - 1].count += 1;
            }
            return a;
          }, []).reduce(function (a, b) {
            a.push(b.value / b.count);
            return a;
          }, ['temperature']);
          
          // console.log(monthly_tavg);

          var monthly_avg_globrad = weather.globrad.reduce(function (a, b, i) {
            var month = weather.date[i].substring(0, 7);
            if (a.length === 0 ||month !== a[a.length - 1].month) {
              a.push({ month: month, value: b, count: 1 });
            } else {
              a[a.length - 1].value += b;
              a[a.length - 1].count += 1;
            }
            return a;
          }, []).reduce(function (a, b) {
            a.push(b.value / b.count);
            return a;
          }, ['radiation']);
          
          // console.log(monthly_avg_globrad);

          // var monthly_avg_globrad = weather.globrad.reduce(function (a, b, i) {
          //   var month = weather.date[i].substring(0, 7);
          //   if (month + '-01' !== a[a.length - 1].month) {
          //     a.push({ month: month + '-01', value: b, count: 1 });
          //   } else {
          //     a[a.length - 1].value += b;
          //     a[a.length - 1].count += 1;
          //   }
          //   return a;
          // }, [{ month: '1995-01-01', value: 0, count: 0 }]).reduce(function (a, b) {

          //     a[0].push(b.month);
          //     a[1].push(b.value / b.count);
          //     return a;

          // }, [['x'], ['radiation']]);

          
          // console.log('monthly_avg_globrad', monthly_avg_globrad);

          var monthly_avg_daylength = weather.daylength.reduce(function (a, b, i) {
            var month = weather.date[i].substring(0, 7);
            if (a.length === 0 ||month !== a[a.length - 1].month) {
              a.push({ month: month, value: b, count: 1 });
            } else {
              a[a.length - 1].value += b;
              a[a.length - 1].count += 1;
            }
            return a;
          }, []).reduce(function (a, b) {
            a.push(b.value / b.count);
            return a;
          }, ['daylength']);
          
          // console.log(monthly_avg_daylength);
          // console.log(dss);

          dss.ui.charts.weather.load({
            columns: [monthly_x_axis, monthly_precip, monthly_tavg, monthly_avg_daylength, monthly_avg_globrad]
          });

        });
      }
  });
  
  $('#crop-charts').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {

    if (isInView && (visiblePartY == 'bottom' || visiblePartY == 'both')) {

      if (!dss.ui.rotation.rotationIsValid()) {
        $(getAlert('Error.', 'Crop rotation is not valid.', 'danger')).prependTo($('body')).delay(6000).fadeOut(500, function () { $(this).remove(); });
        return;
      }

      var arable = dss.ui.rotation.rotation().reduce(function (a, b) {

        // console.log(a,b)

        for (var i = 0; i < b.length; i++) {
          var row = a.filter(function (c) {
            return c[0] === b[i].crop.name;
          })[0];
          if (row)
            row[row.length - 1] += b[i].crop.area;
          else
            a.push([b[i].crop.name, b[i].crop.area]);
        }

        return a;    

      }, []);

      dss.ui.charts.arable.load({
        columns: arable
      });

      var model = dss.ui.model().model;

      dss.ui.charts.area.load({
        columns: [
          ['permanent grassland w/o pasture', (model.grassland['grassland-area'] * (1 - model.grassland['pasture-share'] / 100)) / (model.crop['arable-area'] + model.grassland['grassland-area'])],
          ['arable land', model.crop['arable-area'] / (model.crop['arable-area'] + model.grassland['grassland-area'])],
          ['pasture', (model.grassland['grassland-area'] * model.grassland['pasture-share'] / 100) / (model.crop['arable-area'] + model.grassland['grassland-area'])]
        ]
      });

    }

  });


  $('#dairy-chart-1').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {

    if (isInView && (visiblePartY == 'bottom' || visiblePartY == 'both')) {


      if (!dss.fn.modelChanged('herd', ['milk-yield-data']))
        return;

      var spinner = new Spinner(/*{color: '#333', lines: 10, length: 30, radius: 20, width: 8, speed: 0.5}*/).spin($('#dairy-chart-1')[0]);

      var milkYieldData = dss.ui.milkYieldData();

      dss.fn.fitWood(milkYieldData, function (data, error) {

        if (typeof data === 'object') {

          //console.log(data);
          var columns = [['x'], ['fit'], ['data']];

          for (var t = 0, ts = milkYieldData.t.length; t < ts; t++) {
            columns[0].push(milkYieldData.t[t]);
            columns[1].push(dss.fn.wood(milkYieldData.t[t], data));
            columns[2].push((milkYieldData.t[t], milkYieldData.y[t]));
          };

          // console.log(columns);

          dss.ui.charts.wood.load({
            columns: columns
          });

          $('#dairy-chart-1 .spinner').remove();

          // dss.fn.updateModel('herd');
          dss.fn.updateModel('herd', ['milk-yield-data']);

        } else {
          //console.log(data); /* lmfit output */
        }

      });

    }

  });



  $('#dairy-chart-2').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {


    if (isInView && (visiblePartY == 'bottom' || visiblePartY == 'both')) {

      if (!dss.fn.modelChanged('herd', ['age-first-calving', 'female-calves-rate', 'still-birth-rate', 'young-stock-cull-rate', 'replacement-rate', 'calving-interval', 'herd-size', 'dry-periode']))
        return;

      var spinner = new Spinner(/*{color: '#333', lines: 10, length: 30, radius: 20, width: 8, speed: 0.5}*/).spin($('#dairy-chart-2')[0]);
   
      /* calculate herd structure */
      dss.fn.herdStructure(function (data, error) {

        dss.ui.charts.herd.load({
          columns: data
        });

        $('#dairy-chart-2 .spinner').remove();
        dss.fn.updateModel('herd', ['age-first-calving', 'female-calves-rate', 'still-birth-rate', 'young-stock-cull-rate', 'replacement-rate', 'calving-interval', 'herd-size', 'dry-periode']);


      });



    }

  });


  var feeds = feed.feeds.reduce(function (a, b) {
    if (b.type === 'concentrate')
      a.push(b);
    return a; 
  }, []);

  var cunstomFeed = feeds.reduce(function (a, b) {
    if (b.id === 60)
      a.push(b);
    return a; 
  }, [])[0];

  if (typeof cunstomFeed === 'object' && cunstomFeed !== null) {
    // make copy of feed 60
    cunstomFeed = JSON.parse(JSON.stringify(cunstomFeed));
    cunstomFeed.id = 999;
    cunstomFeed.name = 'Custom feed';
  }
  
  feeds.sort(function (a, b) {
    
    var nameA = a.name.toLowerCase() 
      , nameB = b.name.toLowerCase()
      ;
     
    if (nameA < nameB) //sort string ascending
      return -1 
    if (nameA > nameB)
      return 1
    
    return 0 //default return value (no sorting)
  
  });

  feeds.push(cunstomFeed);

  for (var i = 0, is = feeds.length; i < is; i++) {

    var f = feeds[i]
      , accordion = (i % 2 > 0) ? '#feed-accordion-2' : '#feed-accordion-1'
      , id = f.id
      , name = f.name
      , type = f.type
      , params = [
            { value:   f.name, unit: '-', name: 'Name', help: 'Feed name' }
          , { value:   0, unit: 't / year', name: 'Amount', help: 'Maximum total amount fed per year in tonnes' }
          , { value:   f.DM, unit: 'g / kg FM', name: 'DM', help: 'Dry matter content in fresh matter' }
          , { value:   f.OM, unit: 'g / kg DM', name: 'OM', help: 'Organic matter content in dry matter.' }
          , { value:  Math.round(f.OMD * 100), unit: '%', name: 'OMD', help: 'Organic matter digestibility.' }
          , { value:   f.CP, unit: 'g / kg DM', name: 'CP', help: 'Crude protein content in dry matter.' }
          , { value:  Math.round(f.CPD * 100), unit: '%', name: 'CPD', help: 'Crude protein digestibility.' }
          , { value:   f.EE, unit: 'g / kg DM', name: 'EE', help: 'Ether extract content in dry matter.' }
          , { value:  Math.round(f.EED * 100), unit: '%', name: 'EED', help: 'Ether extract digestibility.' }
          , { value:   f.CF, unit: 'g / kg DM', name: 'CF', help: 'Crude fibre content in dry matter.' }
          , { value:  Math.round(f.CFD * 100), unit: '%', name: 'CFD', help: 'Crude fibre digestibility.' }
          , { value:  f.NFE, unit: 'g / kg DM', name: 'NFE', help: 'Nitrogenfree extractives in dry matter.' }
          , { value: Math.round(f.NFED * 100), unit: '%', name: 'NFED', help: 'Nitrogenfree extractives digestibility.' }
        ]
      , onChange = function () {
        var value = parseFloat($(this).prop('value'));
        if (!isNaN(value) && value > 0)
          $(this).parents('.panel').find('a').addClass('feed-selected');
        else
          $(this).parents('.panel').find('a').removeClass('feed-selected');

      }
      ;

    var body = $('<div class="panel panel-default">\
        <div class="panel-heading" role="tab" id="heading-'+id+'">\
          <h4 class="panel-title">\
            <a data-toggle="collapse" data-parent="'+accordion+'" href="#feed-'+id+'" aria-expanded="false" aria-controls="feed-'+id+'">\
              '+name+'\
            </a>\
          </h4>\
        </div>\
        <div id="feed-'+id+'" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading-'+id+'" data-dss-feed-type="'+type+'">\
          <div class="panel-body">\
          </div>\
        </div>\
      </div>'
    ).appendTo($(accordion)).find('.panel-body');

    for (var j = 0, js = params.length; j < js; j++) {
      var disabled = '';
      var display = '';
      var type = 'number';
      if (params[j].name === 'Name') {
        if (id < 999) { // don't disable in custom feeds
          disabled = 'disabled';
          display = 'style="display:none;"';
        }
        type = 'text';
      }
      body.append(
       '<div class="input-group" '+display+'>\
          <span class="input-group-addon">'+params[j].name+'</span>\
            <input id="feed-'+id+'-'+params[j].name.toLowerCase()+'" type="'+type+'" data-toggle="popover" data-placement="bottom" class="form-control parameter-feed" value="'+params[j].value+'" min="0" data-content="'+params[j].help+'" '+disabled+'>\
          <span class="input-group-addon">'+params[j].unit+'</span>\
        </div>'+(display === '' ? '<br>' : '')
      );
      if (params[j].name.toLowerCase() === 'amount') {
        $('#feed-'+id+'-'+params[j].name.toLowerCase()).change(onChange);
      }
    }


  }


  $('[data-toggle="popover"]').popover({
    trigger: 'hover'
  });
  
  $(window).resize(function () {
    resizeScrollArea();
  });
  
  function resizeScrollArea() {
    var scrollArea = $('.scroll-area');
    var offset = scrollArea.offset();
    scrollArea.css('height', $(window).height() - offset.top - 20);   
    resizeResultModal(); 
  }
  
  function resizeResultModal() {
    $('#result-modal .modal-dialog').css({
      width: parseInt($('.scroll-area').css('width')),
      'margin-top': '20px',
      'margin-left':  ($(window).width() - parseInt($('.scroll-area').css('width'))) * 0.5
    });

    $('#result-modal .modal-body').css({
      height: parseInt($('.scroll-area').css('height')) * 0.9,
      'overflow-y': 'scroll',
      'overflow-x': 'hidden'
    });
  }
  
  resizeScrollArea();

  $('#run-btn').click(function () {

    $('.result-chart').each(function () {
      new Spinner().spin($(this)[0]);
    });

    dss.fn.runModel(function () {

      /* done */
      $('#run .spinner').remove();

    });


  });


});
