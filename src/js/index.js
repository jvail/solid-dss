$(function () {

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
      $('#lat').prop('value', 52.52);
      $('#lon').prop('value', 13.41);        
    }
  );
}  

var zeeWorker = new Worker('lib/zee/zee-worker.js');
$(".scroll-area").scrollspy({ target: "#navbar" });
$("#navbar").on('activate.bs.scrollspy', function () {
  
  var href = $(".nav li.active:not(.dropdown) > a").prop('href').split('#')[1];
  console.log(href);

  if (href === 'weather-chart') {
    var lat = parseFloat($('#lat').prop('value'));
    var lon = parseFloat($('#lon').prop('value'));

    console.log(lat);
    console.log(lon);

    if (lat === 0 || lon === 0 || isNaN(lat) || isNaN(lon))
      return;

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
        $(getWarning('Sorry.', 'No weather data available for your coordinates.')).prependTo($('body')).fadeOut(6000);
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

      var yearly_precip = climate.precip.reduce(function (a, b, i) {
        if (climate.doy[i] === 1) {
          a.push({ year: climate.date[i].split('-')[0], value: b});
        } else {
          a[a.length - 1].value += b;
        }
        return a;
      }, []);
      updatePrecipChart(yearly_precip);
    });
    
  }

  // console.log(this);
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


var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10, "mm");

var svg = d3.select("#chart-1").append("svg")
    .attr("width", '100%')
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data = [];
  
  x.domain(data.map(function(d, i) { return i; }));
  y.domain([0, d3.max(data)]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g") 
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "translate(50, -20)")
      .attr("y", 6)
      .attr("dy", ".9em")
      .style("text-anchor", "end")
      .text("precipitation mm / year");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) { return x(i); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d); })
      .attr("height", function(d) { return height - y(d); });


function type(d) {
  d = +d;
  return d;
}



function updatePrecipChart(data) {

  var bar = svg.selectAll(".bar").data(data, function(d) { return d.year; });
  x.domain(data.map(function(d, i) { return d.year; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);
   
  bar.enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d, i) { return x(d.year); })
    .attr("width", x.rangeBand());

  bar.exit().remove();
  svg.select(".y.axis").remove();
  svg.select(".x.axis").remove();
  
  bar.transition().duration(750)
    .attr("y", function(d) { return y(d.value); })
    .attr("height", function(d) { return height - y(d.value); });

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "translate(100, -20)")
      .attr("y", 6)
      .attr("dy", ".9em")
      .style("text-anchor", "end")
      .text("precipitation mm / year");

}


});
