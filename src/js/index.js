$(function () {

  var zeeWorker = new Worker('lib/zee/zee-worker.js')
    , lmfitWorker = new Worker('lib/lmfit-worker.js')
    ;

  var zeeCallbacks = [];

  zeeWorker.onmessage = function (msg) {

    if (typeof zeeCallbacks[msg.data.callbackID] === 'function') {
      zeeCallbacks[msg.data.callbackID](msg.data.data);
      zeeCallbacks[msg.data.callbackID] = null;
    } else {
      console.log(zeeCallbacks);
      throw new Error(zeeCallbacks[msg.data.callbackID]);
    }
    // console.log("zee'd " + msg.data.filename + ' in ' + msg.data.time + ' ms, ' + msg.data.data.length + ' bytes');

  };

  // var dss = dss || {};

  dss.parameter = {
    wood: null
  };

  dss.model = {
    location: {},
    soil: {},
    herd: {},
    feed: {},
    crop: {},
    rotation: [],
    grassland: {},
    fertilizer: {},
    simulation: {}    
  };
  
  dss.schema = {
      location: {},
      soil: {},
      herd: {},
      feed: {},
      crop: {},
      grassland: {},
      fertilizer: {},
      simulation: {}
  };

  dss.weather = {
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

  // var model = dss.ui.model();
  // dss.model = model.model;
  // dss.schema = model.schema;

  dss.fn = {
    updateModel: function (submodel) {
        dss.model[submodel] = dss.ui.model().model[submodel];
    },
    modelChanged: function (submodel) {
      var a = dss.ui.model().model[submodel];
      var b = dss.model[submodel];
      var keys = Object.keys(a);
      for (var i = 0, is = keys.length; i < is; i++) {
        if (!b.hasOwnProperty(keys[i]) || a[keys[i]] !== b[keys[i]])
          return true;
      }
      return false;
    },    
    solar: weather.solar,
    rh: weather.rh,
    weather: function (lat, lon, cb) {

      var dec = [0.125,0.375,0.625,0.875];
      var lat_ecad = 0;
      var lon_ecad = 0;
      var lat_dec = Number('0.' + lat.toFixed(3).split('.')[1]);
      var lon_dec = Number('0.' + lon.toFixed(3).split('.')[1]);
      var lat_nat = lat | 0;
      var lon_nat = lon | 0;

      for (var i = 0; i < dec.length; i++) {
        if (Math.abs(dec[i] - lat_dec) <= 0.125)
          lat_ecad = lat_nat + dec[i];
        if (Math.abs(dec[i] - lon_dec) <= 0.125)
          lon_ecad = lon_nat + dec[i];
      }

      function requestZee(filename, data, callback) {
        zeeWorker.postMessage({
          filename: filename,
          data: data, // do not send over the underlying ArrayBuffer
          callbackID: zeeCallbacks.length
        });
        zeeCallbacks.push(callback);
      }

      var i = 0;
      var ecad = {
        rr: null,
        tn: null,
        tg: null,
        tx: null
      };
      var files = [
        "rr_" + lat_ecad + "_" + lon_ecad + ".json.gz",
        "tn_" + lat_ecad + "_" + lon_ecad + ".json.gz",
        "tg_" + lat_ecad + "_" + lon_ecad + ".json.gz",
        "tx_" + lat_ecad + "_" + lon_ecad + ".json.gz"
      ];
      var urls = [
        "http://zalf-lse.github.io/rr/rr_" + lat_ecad + "_" + lon_ecad + ".json.gz",
        "http://zalf-lse.github.io/tn/tn_" + lat_ecad + "_" + lon_ecad + ".json.gz",
        "http://zalf-lse.github.io/tg/tg_" + lat_ecad + "_" + lon_ecad + ".json.gz",
        "http://zalf-lse.github.io/tx/tx_" + lat_ecad + "_" + lon_ecad + ".json.gz"
      ];
      var req = new XMLHttpRequest();
      req.open("GET", urls[i], true);
      req.responseType = "arraybuffer";
      req.onload = function () {

        console.log('req.status', req.status);
        
        if (req.status === 200) {       
          
          (function (name, j, cb) {

            requestZee(files[j], new Uint8Array(req.response), function (data) {
              
              var json = '';
              for (var i = 0, is = data.byteLength; i < is; i++)
                json += String.fromCharCode(data[i])
              ecad[name] = JSON.parse(json);
              

              if (j === urls.length - 1) {

                // console.log(data);
                // clear weather
                var weather = dss.weather;
                Object.keys(weather).forEach(function (a) { weather[a] = []; });

                for (var d = 0; d < ecad.tx.values.length; d++) {
                  weather.tmax.push(ecad.tx.values[d] * ecad.tx.scale);
                  weather.tmin.push(ecad.tn.values[d] * ecad.tn.scale);
                  weather.tavg.push(ecad.tg.values[d] * ecad.tg.scale);
                  weather.precip.push(ecad.rr.values[d] * ecad.rr.scale);

                  // seems to happen in ecad data
                  if (weather.tmax[d] < weather.tmin[d])
                    weather.tmax[d] = 2 * weather.tavg[d] - weather.tmin[d];
                  if (weather.precip[d] < 0)
                    weather.precip[d] = 0;
                }

                var solar = dss.fn.solar(lat, weather.tmin, weather.tmax, '1995-01-01');
                for (var d = 0, ds = solar.PPF.length; d < ds; d++) {
                  weather.globrad[d] = solar.R_s[d];
                  weather.f_directrad[d] = solar.f_s[d];
                  weather.daylength[d] = solar.N[d];
                  weather.sunhours[d] = solar.N[d];
                  weather.relhumid[d] = dss.fn.rh(weather.tmin[d], weather.tmax[d]);
                  weather.date[d] = solar.date[d];
                  weather.doy[d] = solar.doy[d];
                  weather.exrad[d] = solar.R_a[d];
                }

                dss.model.location.latitude = lat;
                dss.model.location.longitude = lon;
                console.log(dss.model.location);

                cb(weather);
              }

            });
            
          }(files[i].split('_')[0], i, cb));

          i++;
          if (i < urls.length) {
            req.open("GET", urls[i], true);
            req.send(null);
          }

        } else {
          console.log('error: ' + req.status);
          cb(null, { text: 'No weather data available for coordinates: latitude: ' + lat + ' / longitude: ' + lon });
        }

      };

      // try catch on !200?
      req.send(null);        
    },
    dairy: function (milkYieldData, cb) {

      console.log(milkYieldData);

      lmfitWorker.onmessage = function (evt) {
        cb(evt.data)
      };

      lmfitWorker.postMessage({    
          f: {}
        , n: 3 
        , par: [17.0, 0.149, -0.034] /* lmfit needs an initial guess */
        , m: milkYieldData.t.length
        , t: milkYieldData.t
        , y: milkYieldData.y
      });      
    },
    /* Wood lactation function */
    wood: function (t, p) {
      return p[0] * Math.pow(t, p[1]) * Math.exp(p[2] * t);
    }

  };


  console.log(dss.ui.model());

});
