$(function () {

  var colors = {
    blue : ['rgb(189, 215, 231)', 'rgb(107, 174, 214)', 'rgb(49, 130, 189)', 'rgb(8, 81, 156)'],
    green : ['rgb(186, 228, 179)', 'rgb(116, 196, 118)', 'rgb(49, 163, 84)', 'rgb(0, 109, 44)'],
    red : ['rgb(252, 174, 145)', 'rgb(251, 106, 74)', 'rgb(222, 45, 38)', 'rgb(165, 15, 21)'],
    orange: ['rgb(254, 217, 142)', 'rgb(254, 153, 41)', 'rgb(217, 95, 14)', 'rgb(153, 52, 4)'],
    violett: ['rgb(203, 201, 226)', 'rgb(158, 154, 200)', 'rgb(117, 107, 177)', 'rgb(84, 39, 143)'],
    pink: ['rgb(215, 181, 216)', 'rgb(223, 101, 176)', 'rgb(221, 28, 119)', 'rgb(152, 0, 67)']
  }

var weatherChart1 = c3.generate({
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
        },
        colors: {
            precipitation: colors.blue[2],
            temperature: colors.red[2]
        }
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
});

// var weatherChart2 = c3.generate({
//     bindto: '#weather-chart-2',
//     data: {
//         x: 'x',
//        xFormat: '%Y-%m-%d', // 'xFormat' can be used as custom format of 'x'
//         columns: [
//             ['x'],
//             ['daylength'],
//             ['radiation']
//         ],
//         names: {
//             daylength: 'daylength',
//             radiation: 'radiation'
//         },
//         // type: 'bar',
//         axes: {
//             daylength: 'y2',
//             radiation: 'y'
//         },
//         colors: {
//             daylength: colors.violett[2],
//             radiation: colors.green[2]
//         }
//     },
//     // bar: {
//     //     width: {
//     //         ratio: 0.9 // this makes bar width 50% of length between ticks
//     //     }
//     // },
//     axis: {
//         x: {
//             type: 'timeseries',
//             tick: {
//                 format: '%Y/%m',
//                 values: ['1995-06-01', '1996-06-01', '1997-06-01', '1998-06-01', '1999-06-01', '2000-06-01', 
//                 '2001-06-01', '2002-06-01', '2003-06-01', '2004-06-01', '2005-06-01', '2006-06-01', '2007-06-01', 
//                 '2008-06-01', '2009-06-01', '2010-06-01', '2011-06-01', '2012-06-01', '2013-06-01', ]
//             }
//         },
//         y: {
//             show: true,
//             label: 'avg. monthly radiation'
//         },
//         y2: {
//             show: true,
//             label: 'avg. monthly daylength',
//             min: 0,
//             padding: 0
//         }
//     },
//     grid: {
//         y: {
//             lines: [
//                 {value: 0}
//             ]
//         }
//     },
//     // zoom: {
//     //   enabled: true,
//     //   rescale: true
//     // }
//     subchart: {
//         show: true
//     },
//     tooltip: {
//       format: {
//         value: function (value, ratio, id, index) { return value.toFixed(1); }
//       }
//     }
// });

var model = {
  site: {
    latitude: 0,
    longitude: 0
  }
};

function getWarning(strong, text) {

  return '<div class="alert alert-warning alert-dismissible container" role="alert">\
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
            <strong>' + strong + '</strong> ' + text + '\
          </div>';
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      $('#lat').prop('value', pos.coords.latitude.toFixed(3));
      $('#lon').prop('value', pos.coords.longitude.toFixed(3));
    },
    function (err) {
      $('#lat').prop('value', 52.520);
      $('#lon').prop('value', 13.410);        
    }
  );
}  

var zeeWorker = new Worker('lib/zee/zee-worker.js');
$(".scroll-area").scrollspy({ target: "#navbar" });
// $("#navbar").on('activate.bs.scrollspy', function () {
$('#weather-charts').bind('inview', function(event, isInView, visiblePartX, visiblePartY) {


    if (isInView) {

      console.log('inview: ' + isInView + ', ' + visiblePartY);

      var lat = parseFloat(Number($('#lat').prop('value')).toFixed(3));
      var lon = parseFloat(Number($('#lon').prop('value')).toFixed(3));
      if (model.site.latitude === lat && model.site.longitude === lon)
        return;

      model.site.latitude = lat;
      model.site.longitude = lon;

      console.log(lat);
      console.log(lon);

      var dec = [0.125,0.375,0.625,0.875];
      var lat_dec = Number('0.' + lat.toFixed(3).split('.')[1]);
      var lon_dec = Number('0.' + lon.toFixed(3).split('.')[1]);
      var lat_nat = lat | 0;
      var lon_nat = lon | 0;

      for (var i = 0; i < dec.length; i++) {
        if (Math.abs(dec[i] - lat_dec) <= 0.125)
          lat = lat_nat + dec[i];
        if (Math.abs(dec[i] - lon_dec) <= 0.125)
          lon = lon_nat + dec[i];
      }

      getWeather(lat, lon, function (data) { 

        if (data === null) {
          // on fail TODO: keep failing coords
          $(getWarning('Sorry.', 'No weather data available for your coordinates.')).prependTo($('body')).delay(6000).fadeOut(500, function () { $(this).remove(); });
          return;
        }

        // console.log(data);
        var climate = {
          tmin: [],
          tmax: [],
          tavg: [],
          globrad: [],
          wind: [],
          sunhours: [],
          relhumid: [],
          precip: [],
          ppf: [],
          daylength: [],
          f_directrad: [],
          date: [],
          doy: [],
          exrad: []
        };

        for (var d = 0; d < data.tx.values.length; d++) {
          climate.tmax.push(data.tx.values[d] * data.tx.scale);
          climate.tmin.push(data.tn.values[d] * data.tn.scale);
          climate.tavg.push(data.tg.values[d] * data.tg.scale);
          climate.precip.push(data.rr.values[d] * data.rr.scale);

          // seems to happen in ecad data
          if (climate.tmax[d] < climate.tmin[d])
            climate.tmax[d] = 2 * climate.tavg[d] - climate.tmin[d];
          if (climate.precip[d] < 0)
            climate.precip[d] = 0;
        }

        var solar = weather.solar(lat, climate.tmin, climate.tmax, '1995-01-01');
        for (var d = 0, ds = solar.PPF.length; d < ds; d++) {
          climate.globrad[d] = solar.R_s[d];
          climate.f_directrad[d] = solar.f_s[d];
          climate.daylength[d] = solar.N[d];
          climate.sunhours[d] = solar.N[d];
          climate.relhumid[d] = weather.rh(climate.tmin[d], climate.tmax[d]);
          climate.date[d] = solar.date[d];
          climate.doy[d] = solar.doy[d];
          climate.exrad[d] = solar.R_a[d];
        }

        // var yearly_precip = climate.precip.reduce(function (a, b, i) {
        //   if (climate.doy[i] === 1) {
        //     a.push({ year: climate.date[i].split('-')[0], value: b});
        //   } else {
        //     a[a.length - 1].value += b;
        //   }
        //   return a;
        // }, []);

        // var monthly_precip = climate.precip.reduce(function (a, b, i) {
        //   var month = climate.date[i].substring(0, 7);
        //   if (a.length === 0 || month !== a[a.length - 1].month) {
        //     a.push({ month: month, value: b });
        //   } else {
        //     a[a.length - 1].value += b;
        //   }
        //   return a;
        // }, []);

        var monthly_x_axis= climate.date.reduce(function (a, b, i) {
          var month = b.substring(0, 7);
          if (month + '-01' !== a[a.length - 1])
            a.push(month + '-01');
          return a;
        }, ['x']);

        var monthly_precip = climate.precip.reduce(function (a, b, i) {
          var month = climate.date[i].substring(0, 7);
          if (month + '-01' !== monthly_x_axis[a.length - 1]) {
            a.push(b);
          } else {
            a[a.length - 1] += b;
          }
          return a;
        }, ['precipitation']);

        console.log(monthly_precip);

        // var yearly_precip = climate.precip.reduce(function (a, b, i) {
        //   var year = climate.date[i].substring(0, 4);
        //   if (year !== a[0][a[0].length - 1]) {
        //     a[0].push(year);
        //     a[1].push(b);
        //   } else {
        //     a[1][a[1].length - 1] += b;
        //   }
        //   return a;
        // }, [['x'], ['precipitation']]);

        // console.log(yearly_precip);

        var monthly_tavg = climate.tavg.reduce(function (a, b, i) {
          var month = climate.date[i].substring(0, 7);
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
        
        console.log(monthly_tavg);

        var monthly_avg_globrad = climate.globrad.reduce(function (a, b, i) {
          var month = climate.date[i].substring(0, 7);
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
        
        console.log(monthly_avg_globrad);

        // var monthly_avg_globrad = climate.globrad.reduce(function (a, b, i) {
        //   var month = climate.date[i].substring(0, 7);
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

        var monthly_avg_daylength = climate.daylength.reduce(function (a, b, i) {
          var month = climate.date[i].substring(0, 7);
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
        
        console.log(monthly_avg_daylength);

        weatherChart1.load({
          columns: [monthly_x_axis, monthly_precip, monthly_tavg, monthly_avg_daylength, monthly_avg_globrad]
        });

      });


    }
});


var getWeather = function (lat, lon, cb) {

  var zeeCallbacks = [];

  zeeWorker.onmessage = function (msg) {
    zeeCallbacks[msg.data.callbackID](msg.data.data);
    console.log("zee'd " + msg.data.filename + ' in ' + msg.data.time + ' ms, ' + msg.data.data.length + ' bytes');
    zeeCallbacks[msg.data.callbackID] = null;
  };

  function requestZee(filename, data, callback) {
    zeeWorker.postMessage({
      filename: filename,
      data: data, // do not send over the underlying ArrayBuffer
      callbackID: zeeCallbacks.length
    });
    zeeCallbacks.push(callback);
  }

  var i = 0;
  var weather = {
    rr: null,
    tn: null,
    tg: null,
    tx: null
  };
  var files = [
    "rr_" + lat + "_" + lon + ".json.gz",
    "tn_" + lat + "_" + lon + ".json.gz",
    "tg_" + lat + "_" + lon + ".json.gz",
    "tx_" + lat + "_" + lon + ".json.gz"
  ];
  var urls = [
    "http://zalf-lse.github.io/rr/rr_" + lat + "_" + lon + ".json.gz",
    "http://zalf-lse.github.io/tn/tn_" + lat + "_" + lon + ".json.gz",
    "http://zalf-lse.github.io/tg/tg_" + lat + "_" + lon + ".json.gz",
    "http://zalf-lse.github.io/tx/tx_" + lat + "_" + lon + ".json.gz"
  ];
  var req = new XMLHttpRequest();
  req.open("GET", urls[i], true);
  req.responseType = "arraybuffer";
  req.onload = function () {
    
    if (req.status === 200) {       
      
      (function (name, j, cb) {

        var json = '';
        requestZee(files[j], new Uint8Array(req.response), function (data) {
          
          for (var i = 0, is = data.byteLength; i < is; i++)
            json += String.fromCharCode(data[i])
          
          weather[name] = JSON.parse(json);
          if (j === urls.length - 1)
            cb(weather);

        });
        
      }(files[i].split('_')[0], i, cb));

      i++;
      if (i < urls.length) {
        req.open("GET", urls[i], true);
        req.send(null);
      }

    } else {
      console.log('error: ' + req.status);
      cb(null);
    }

  };

  // try catch on !200?
  req.send(null);

};


// var margin = {top: 20, right: 20, bottom: 30, left: 40},
//     width = 960 - margin.left - margin.right,
//     height = 300 - margin.top - margin.bottom;

// var x = d3.scale.ordinal()
//     .rangeRoundBands([0, width], .1);

// var y = d3.scale.linear()
//     .range([height, 0]);

// var xAxis = d3.svg.axis()
//     .scale(x)
//     .orient("bottom")
//     .ticks(10);

// var yAxis = d3.svg.axis()
//     .scale(y)
//     .orient("left")
//     .ticks(10)
//     .tickFormat(d3.time.format("%Y-%m"));

// var svg = d3.select("#chart-1").append("svg")
//     .attr("width", '100%')
//     .attr("height", height + margin.top + margin.bottom)
//     .attr("viewBox", '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
//   .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//   var data = [];
  
//   x.domain(data.map(function(d, i) { return i; }));
//   y.domain([0, d3.max(data)]);

//   svg.append("g")
//       .attr("class", "x axis")
//       .attr("transform", "translate(0," + height + ")")
//       .call(xAxis);

//   svg.append("g") 
//       .attr("class", "y axis")
//       .call(yAxis)
//     .append("text")
//       .attr("transform", "translate(50, -20)")
//       .attr("y", 6)
//       .attr("dy", ".9em")
//       .style("text-anchor", "end")
//       .text("precipitation mm / month");

//   svg.selectAll(".bar")
//       .data(data)
//     .enter().append("rect")
//       .attr("class", "bar")
//       .attr("x", function(d, i) { return x(i); })
//       .attr("width", x.rangeBand())
//       .attr("y", function(d) { return y(d); })
//       .attr("height", function(d) { return height - y(d); });


// function type(d) {
//   d = +d;
//   return d;
// }



// function updatePrecipChart(data) {

//   var bar = svg.selectAll(".bar").data(data, function(d) { return d.month; });
//   x.domain(data.map(function(d, i) { return d.month; }));
//   y.domain([0, d3.max(data, function(d) { return d.value; })]);
   
//   bar.enter().append("rect")
//     .attr("class", "bar")
//     .attr("x", function(d, i) { return x(d.month); })
//     .attr("width", x.rangeBand());

//   bar.exit().remove();
//   svg.select(".y.axis").remove();
//   svg.select(".x.axis").remove();
  
//   bar.transition().duration(750)
//     .attr("y", function(d) { return y(d.value); })
//     .attr("height", function(d) { return height - y(d.value); });

//   svg.append("g")
//       .attr("class", "x axis")
//       .attr("transform", "translate(0," + height + ")")
//       .call(xAxis);

//   svg.append("g")
//       .attr("class", "y axis")
//       .call(yAxis)
//     .append("text")
//       .attr("transform", "translate(100, -20)")
//       .attr("y", 6)
//       .attr("dy", ".9em")
//       .style("text-anchor", "end")
//       .text("precipitation mm / month");

// }


});
