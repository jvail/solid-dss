var dss = dss || {};

$(function () {

  var colors = {
    blue : ['rgb(189, 215, 231)', 'rgb(107, 174, 214)', 'rgb(49, 130, 189)', 'rgb(8, 81, 156)'],
    green : ['rgb(186, 228, 179)', 'rgb(116, 196, 118)', 'rgb(49, 163, 84)', 'rgb(0, 109, 44)'],
    red : ['rgb(252, 174, 145)', 'rgb(251, 106, 74)', 'rgb(222, 45, 38)', 'rgb(165, 15, 21)'],
    orange: ['rgb(254, 217, 142)', 'rgb(254, 153, 41)', 'rgb(217, 95, 14)', 'rgb(153, 52, 4)'],
    violett: ['rgb(203, 201, 226)', 'rgb(158, 154, 200)', 'rgb(117, 107, 177)', 'rgb(84, 39, 143)'],
    pink: ['rgb(215, 181, 216)', 'rgb(223, 101, 176)', 'rgb(221, 28, 119)', 'rgb(152, 0, 67)']
  }


  function getWarning(strong, text) {

    return '<div class="alert alert-warning alert-dismissible container" role="alert">\
              <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
              <strong>' + strong + '</strong> ' + text + '\
            </div>';
  }

  dss.ui = {
    model: function () {

      var model = {
          location: {},
          soil: {},
          herd: {},
          feed: {},
          crop: {},
          rotation: {},
          grassland: {}
        }
      , schema = {
          location: {},
          soil: {},
          herd: {},
          feed: {},
          crop: {},
          grassland: {}
        }
      ;
    
      $('.parameter-location, parameter-soil, .parameter-herd, .parameter-feed, .parameter-crop, .parameter-grassland').each(function () {

        var id = $(this).prop('id')
          , min = $(this).prop('min')
          , max = $(this).prop('max')
          , type = $(this).prop('type')
          , value = ((type === 'number' || !isNaN(parseFloat($(this).prop('value'))) && $(this).prop('tagName') !== 'TEXTAREA') ? parseFloat($(this).prop('value')) : $(this).prop('value'))
          , value = (isNaN(value) && (value === 'No' || value === 'Yes') ? (value === 'No' ? false : true) : value)
          , submodel = ''

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
    setModel: function (model) {},
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
        subchart: {
            show: true
        },
        tooltip: {
          format: {
            value: function (value, ratio, id, index) { return value.toFixed(1); }
          }
        }
      }),
      arable: c3.generate({
        bindto: '#arable-chart-1',
        data: {
          columns: [],
          type : 'pie'
        }
      }),
      area: c3.generate({
        bindto: '#area-chart-1',
        data: {
          columns: [],
          type : 'pie'
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
        name: 'grass',
        isPerennial: true,
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
              <input id="'+prop+'" type="number" data-toggle="popover" data-placement="top" class="form-control" value="'+param.value+'" min="75" max="90" data-content="'+param.help+'">\
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
          "name": "grass"
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
          "name": "grass"
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
          1427186662489
        ]
      }
    ],
    [
      {
        "crop": {
          "name": "grass"
        },
        "id": 1427186662489,
        "to": [
          1427186614808
        ]
      }
    ]
  ]);


  $(".scroll-area").scrollspy({ target: "#navbar" });

// $("#navbar").on('activate.bs.scrollspy', function () {
  $('#weather-charts').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {

      if (isInView) {

        var lat = parseFloat(Number($('#latitude').prop('value')).toFixed(3));
        var lon = parseFloat(Number($('#longitude').prop('value')).toFixed(3));
        if (!dss.fn.modelChanged('location'))
          return;

        var spinner = new Spinner({color: '#333', lines: 10, length: 30, radius: 20, width: 8, speed: 0.5}).spin($('#weather-charts')[0]);
      
        dss.fn.weather(lat, lon, function (weather, error) { 

           $('#weather-charts .spinner').remove();

          if (weather === null && error) {
            // on fail TODO: keep failing coords
            $(getWarning('Error.', error.text)).prependTo($('body')).delay(6000).fadeOut(500, function () { $(this).remove(); });

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

    if (isInView) {
      // console.log('inview: ' + isInView + ', ' + visiblePartY);
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

  $('#dairy-charts').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {

    if (isInView) {

      var model = dss.ui.model().model
        , csv = ''
        ;

      if (!dss.fn.modelChanged('herd'))
        return;

      var spinner = new Spinner({color: '#333', lines: 10, length: 30, radius: 20, width: 8, speed: 0.5}).spin($('#dairy-chart-1')[0]);

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

      dss.fn.dairy(milkYieldData, function (data, error) {

        if (typeof data === 'object') {

          console.log(data);
          var columns = [['x'], ['fit'], ['data']];

          for (var t = 0, ts = milkYieldData.t.length; t < ts; t++) {
            columns[0].push(milkYieldData.t[t]);
            columns[1].push(dss.fn.wood(milkYieldData.t[t], data));
            columns[2].push((milkYieldData.t[t], milkYieldData.y[t]));
          };

          console.log(columns);

          dss.ui.charts.wood.load({
            columns: columns
          });

          $('#dairy-chart-1 .spinner').remove();

          dss.fn.updateModel('herd');

        } else {
          console.log(data); /* lmfit output */
        }

      });

    }

  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        $('#latitude').prop('value', pos.coords.latitude.toFixed(3));
        $('#longitude').prop('value', pos.coords.longitude.toFixed(3));
      },
      function (err) {
        $('#latitude').prop('value', 52.520);
        $('#longitude').prop('value', 13.410);        
      }
    );
  }  


  var feeds = feed.feeds.reduce(function (a, b) {
    if (b.type === 'concentrate')
      a.push(b);
    return a; 
  }, []);
  
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

  for (var i = 0, is = feeds.length; i < is; i++) {

    var f = feeds[i]
      , accordion = (i % 2 > 0) ? $('#feed-accordion-2') : $('#feed-accordion-1')
      , id = f.id
      , name = f.name
      , type = f.type
      , params = [
            { value:   0, unit: 't / year', name: 'Amount', help: 'Maximum total amount fed per year in tonnes' }
          , { value:   f.DM, unit: 'g / kg FM', name: 'DM', help: '' }
          , { value:   f.OM, unit: 'g / kg DM', name: 'OM', help: '' }
          , { value:  Math.round(f.OMD * 100), unit: '%', name: 'OMD', help: '' }
          , { value:   f.CP, unit: 'g / kg DM', name: 'CP', help: '' }
          , { value:  Math.round(f.CPD * 100), unit: '%', name: 'CPD', help: '' }
          , { value:   f.EE, unit: 'g / kg DM', name: 'EE', help: '' }
          , { value:  Math.round(f.EED * 100), unit: '%', name: 'EED', help: '' }
          , { value:   f.CF, unit: 'g / kg DM', name: 'CF', help: '' }
          , { value:  Math.round(f.CFD * 100), unit: '%', name: 'CFD', help: '' }
          , { value:  f.NFE, unit: 'g / kg DM', name: 'NFE', help: '' }
          , { value: Math.round(f.NFED * 100), unit: '%', name: 'NFED', help: '' }
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
            <a data-toggle="collapse" data-parent="#accordion" href="#feed-'+id+'" aria-expanded="false" aria-controls="feed-'+id+'">\
              '+name+'\
            </a>\
          </h4>\
        </div>\
        <div id="feed-'+id+'" class="panel-collapse collapse" role="tabpanel" aria-labelledby="heading-'+id+'" data-dss-feed-type="'+type+'">\
          <div class="panel-body">\
          </div>\
        </div>\
      </div>'
    ).appendTo(accordion).find('.panel-body');

    for (var j = 0, js = params.length; j < js; j++) {
      body.append(
       '<div class="input-group">\
          <span class="input-group-addon">'+params[j].name+'</span>\
            <input id="feed-'+id+'-'+params[j].name.toLowerCase()+'" type="number" data-toggle="popover" data-placement="top" class="form-control parameter-feed" value="'+params[j].value+'" min="0" data-content="'+params[j].help+'">\
          <span class="input-group-addon">'+params[j].unit+'</span>\
        </div>\
        <br>'
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
    scrollArea.css('height', $(window).height() - offset.top - 30);   
    resizeResultModal(); 
  }
  
  function resizeResultModal() {
    $('#result-modal .modal-dialog').css({
      width: parseInt($('.scroll-area').css('width')),
      'margin-top': '60px',
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

    $('#result-modal').modal('show');

  });




  $('#result-modal').on('shown.bs.modal', function (e) {
    console.log('on shown.bs.modal');
  });

  console.log(dss);


});
