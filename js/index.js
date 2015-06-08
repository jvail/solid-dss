$(function () {

  var zeeWorker = new Worker('lib/zee/zee-worker.js')
    , lmfitWorker = new Worker('lib/lmfit-worker.js')
    , pastureWorker = new Worker('lib/pasture-worker.js')
    , grasslandWorker = new Worker('lib/grassland-worker.js')
    , arableWorker = new Worker('lib/arable-worker.js')
    ;

  var DAYS_IN_MONTH = 30.5;
  var NO_DAYS_IN_SIMULATION = 365 * 5;

  var zeeCallbacks = [];

  zeeWorker.onmessage = function (msg) {

    if (typeof zeeCallbacks[msg.data.callbackID] === 'function') {
      zeeCallbacks[msg.data.callbackID](msg.data.data);
      zeeCallbacks[msg.data.callbackID] = null;
    } else {
    //  console.log(zeeCallbacks);
      throw new Error(zeeCallbacks[msg.data.callbackID]);
    }
    // console.log("zee'd " + msg.data.filename + ' in ' + msg.data.time + ' ms, ' + msg.data.data.length + ' bytes');

  };

  // var dss = dss || {};

  dss.parameter = {
    wood: null
  };

  dss.herd = {};

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

  dss.feeds = null;

  // var model = dss.ui.model();
  // dss.model = model.model;
  // dss.schema = model.schema;

  dss.fn = {
    updateModel: function (submodel, parameters) {
      var a = dss.ui.model().model[submodel];
      var b = dss.model[submodel];
      if (Array.isArray(parameters)) {
        for (var i = 0, is = parameters.length; i < is; i++)
          b[parameters[i]] = a[parameters[i]];
      } else {
        b = a;
      }
    },
    modelChanged: function (submodel, parameters) {
      var a = dss.ui.model().model[submodel];
      var b = dss.model[submodel];
      var keys = Object.keys(a);
      if (Array.isArray(parameters)) {
        for (var i = 0, is = parameters.length; i < is; i++) {
          if (!b.hasOwnProperty(parameters[i]) || a[parameters[i]] !== b[parameters[i]])
            return true;
        }
      } else {
        for (var i = 0, is = keys.length; i < is; i++) {
          if (!b.hasOwnProperty(keys[i]) || a[keys[i]] !== b[keys[i]])
            return true;
        }
      }
      return false;
    },    
    solar: weather.solar,
    rh: weather.rh,
    weather: function (lat, lon, cb) {

    //  console.log(arguments);

      var dec = [0.125,0.375,0.625,0.875];
      var lat_ecad = 0;
      var lon_ecad = 0;
      var lat_dec = Number('0.' + lat.toFixed(3).split('.')[1]);
      var lon_dec = Number('0.' + lon.toFixed(3).split('.')[1]);
      var lat_nat = lat | 0;
      var lon_nat = lon | 0;

    //  console.log(lat_nat, lon_nat);

      for (var i = 0; i < dec.length; i++) {
        if (Math.abs(dec[i] - lat_dec) <= 0.125)
          lat_ecad = Number(lat_nat.toString() +  '.' + dec[i].toString().split('.')[1]);
        if (Math.abs(dec[i] - lon_dec) <= 0.125)
          lon_ecad = Number(lon_nat.toString() +  '.' + dec[i].toString().split('.')[1]);
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

      //  console.log('req.status', req.status);
        
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
                  weather.wind[d] = 2; // default if missing 
                }

                dss.model.location.latitude = lat;
                dss.model.location.longitude = lon;
              //  console.log(dss.model.location);

                if (cb)
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
        //  console.log('error: ' + req.status);
          cb(null, { text: 'No weather data available for coordinates: latitude: ' + lat + ' / longitude: ' + lon });
        }

      };

      // try catch on !200?
      req.send(null);        
    },
    fitWood: function (milkYieldData, cb) {

      lmfitWorker.onmessage = function (evt) {
        if (Array.isArray(evt.data))
          dss.parameter.wood = evt.data;
        if (cb)
          cb(evt.data);
      //  console.log(evt.data);
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
    },
    herdStructure: function (cb) {

      var model = dss.ui.model().model;
      var herdParams = model.herd;
      var calvingSeason =  herdParams['calving-season'];

      dss.herd = dairy.herd.get({
          ageFirstCalving: herdParams['age-first-calving']
        , femaleCalfRate: herdParams['female-calves-rate'] / 100
        , stillBirthRate: herdParams['still-birth-rate'] / 100
        , youngStockCullRate: herdParams['young-stock-cull-rate'] / 100
        , replacementRate: herdParams['replacement-rate'] / 100
        , calvingInterval: (calvingSeason > 0 ? 12 : herdParams['calving-interval']) /* fixed to 12 if seasonal calving selected */
        , herdSize: herdParams['herd-size']
        , dryPeriode: herdParams['dry-periode'] / (30.5 / 7 /* weeks in month */)
      });

      if (cb) {
        cb([
          ['parity1', dss.herd.cowsPerLac[0]],
          ['parity2', dss.herd.cowsPerLac[1]],
          ['parity3', dss.herd.cowsPerLac[2]],
          ['heifers_in', dss.herd.heifersBought],
          ['heifers_out', dss.herd.heifersSold]
        ]);        
      }

    },
    herdDevelopment: function () {



    },
    cowProperties: function () {

      var herdParams = dss.ui.model().model.herd;
      var feedParams = dss.ui.model().model.feed;
      var wood = dss.parameter.wood;

      var isDualPurpose = herdParams['is-dual-purpose']
        , MBW = herdParams['mature-bodyweight']
        , AC = herdParams['age-first-calving']
        , WC = herdParams['weight-first-calving']
        , fat = herdParams['milk-fat']
        , protein = herdParams['milk-protein']
        , CI = herdParams['calving-interval']
        , DP = herdParams['dry-periode']
        , WB = dairy.body.weightAtBirth(MBW)
        , forageShare = (feedParams['concentrate-share'] === 0 ? 1 : 0.5)
        ;

      for (var c = 0, cs = dss.herd.cows.length; c < cs; c++) {

        
        var cow = dss.herd.cows[c];
        cow.req = {
            de: {}
          , fi: {}
          , gb: {}
          , fr: {}
        };


        cow.d_mx = dairy.milk.d_mx(wood[1], wood[2], cow.P);
        cow.BW = dairy.body.BW(cow.DPP, cow.d_mx, cow.AGE_days, CI, MBW, AC, WB, WC, isDualPurpose);
        cow.BWC = dairy.body.BWC(cow.DPP, cow.d_mx, cow.AGE_days, CI, MBW, AC, WB, WC, isDualPurpose);
        cow.BCS = dairy.body.BCS(cow.DPP, CI, DP * 7, cow.P, cow.d_mx);
        cow.BW_c = dairy.body.BW_c(cow.DPP, cow.AGE_days, MBW, AC, WB, WC);

        /* independ of eval. system */
        cow.PLPOT = dairy.milk.milk(wood[0], wood[1], wood[2], cow.DPP / 7, cow.P, cow.BW_c, MBW);
        cow.milk = cow.isDry ? 0 : cow.PLPOT;
        var fat_a = dairy.milk.fat_a(fat, cow.P, cow.d_mx / 7);     
        var protein_a = dairy.milk.protein_a(protein, cow.P, cow.d_mx / 7);      
        cow.fat = cow.isDry ? 0 : dairy.milk.fat(fat_a, cow.DIM / 7, cow.P, cow.d_mx / 7); 
        cow.protein = cow.isDry ? 0 : dairy.milk.protein(protein_a, cow.DIM / 7, cow.P, cow.d_mx / 7);
        cow.milk305 = dairy.milk.milk_305(wood[0], wood[1], wood[2], cow.P, cow.BW_c, MBW);   

        cow.IC = dairy.intake.IC(cow.BW, cow.milk, cow.BCS, cow.DIM / 7, cow.DG / 7, cow.AGE_days / DAYS_IN_MONTH, cow.P);

        cow.req.fi = {
            main: dairy.requirements.fi.main(cow.BW, cow.IC, forageShare, cow.P)
          , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.fi.prod(cow.milk, cow.fat, cow.protein, cow.P))
          , gest: dairy.requirements.fi.gest(cow.DG / 7, cow.P)
          , weit: dairy.requirements.fi.weit(cow.BWC, cow.P)
          , total: { E: 0, P: 0 }
        }

        cow.req.fi.total.E = cow.req.fi.main.E + cow.req.fi.prod.E + cow.req.fi.gest.E + cow.req.fi.weit.E;
        cow.req.fi.total.P = cow.req.fi.main.P + cow.req.fi.prod.P + cow.req.fi.gest.P + cow.req.fi.weit.P;

        /* just an initial guess TODO: remove feed level adjustment */
        var ME_total = 195;

        cow.req.gb = {
            main: dairy.requirements.gb.main(cow.BW, cow.IC, ME_total, forageShare, null, null, cow.BWC, cow.P)
          , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.gb.prod(cow.milk, cow.fat, cow.protein, cow.P))
          , gest: dairy.requirements.gb.gest(cow.DG / 7, MBW, cow.P)
          , weit: dairy.requirements.gb.weit(cow.BWC, cow.P)
          , total: { E: 0, P: 0 }
        }

        cow.req.gb.total.E = cow.req.gb.main.E + cow.req.gb.prod.E + cow.req.gb.gest.E + cow.req.gb.weit.E;
        cow.req.gb.total.P = cow.req.gb.main.P + cow.req.gb.prod.P + cow.req.gb.gest.P + cow.req.gb.weit.P;

        /* recalculate with cow.req.total.E as ME_total */
        cow.req.gb.main = dairy.requirements.gb.main(cow.BW, cow.IC, cow.req.gb.total.E, forageShare, null, null, cow.BWC, cow.P);
        cow.req.gb.total.E = cow.req.gb.main.E + cow.req.gb.prod.E + cow.req.gb.gest.E + cow.req.gb.weit.E;
        cow.req.gb.total.P = cow.req.gb.main.P + cow.req.gb.prod.P + cow.req.gb.gest.P + cow.req.gb.weit.P;

        cow.req.fr = {
            main: dairy.requirements.fr.main(cow.BW, cow.IC, forageShare, cow.P)
          , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.fr.prod(cow.milk, cow.fat, cow.protein, cow.P))
          , gest: dairy.requirements.fr.gest(cow.DG / 7, WB, cow.P)
          , weit: dairy.requirements.fr.weit(cow.BW, cow.BWC, cow.DPP / 7, cow.P)
          , total: { E: 0, P: 0 }
        }

        cow.req.fr.total.E = cow.req.fr.main.E + cow.req.fr.prod.E + cow.req.fr.gest.E + cow.req.fr.weit.E;
        cow.req.fr.total.P = cow.req.fr.main.P + cow.req.fr.prod.P + cow.req.fr.gest.P + cow.req.fr.weit.P;

        cow.req.de = {
            main: dairy.requirements.de.main(cow.BW, cow.IC, forageShare, cow.P)
          , prod: cow.isDry ? ({ E: 0, P: 0 }) : (dairy.requirements.de.prod(cow.milk, cow.fat, cow.protein, cow.P))
          , gest: dairy.requirements.de.gest(cow.DG / 7, cow.DIM, cow.P)
          , weit: dairy.requirements.de.weit(cow.BWC, cow.BW, cow.P)
          , total: { E: 0, P: 0 }
        }

        cow.req.de.total.E = cow.req.de.main.E + cow.req.de.prod.E + cow.req.de.gest.E + cow.req.de.weit.E;
        cow.req.de.total.P = cow.req.de.main.P + cow.req.de.prod.P + cow.req.de.gest.P + cow.req.de.weit.P;

        cow.FV_c = dairy.intake.FV_cs_diet(cow.req.fr.total.E, cow.IC, settings.CC, cow.PLPOT, cow.P, cow.BWC);

      }

    },
    cropGrowth: function (cb) {

      var model = dss.ui.model().model;
      var noPaddocks = model.grassland['no-paddocks']; 
      var grasslandArea = model.grassland['grassland-area']; 
      var pastureShare = model.grassland['pasture-share']; 
      var grazingSystem = model.grassland['grazing-system']; 
      var supplementationStrategy = model.grassland['supplementation-strategy']; 
      var cutThreshhold = model.grassland['cut-threshhold']; 
      var herdSize = model.herd['herd-size'];
      var startYear = parseInt(model.simulation['start-year'], 10);

      /* make grassland crop.js config */
      var simulation = {
        time: {
          startDate: startYear + '-01-01',
          endDate: dss.weather.date[(startYear - 1995) * 365 + 5 * 365]
        },
        switches: {
          useSecondaryYieldOn: false,
          nitrogenResponseOn: true,
          waterDeficitResponseOn: true
        },
        init: {
          percentageFC: 0.5
        }
      };

      var grasslandSite = {
        latitude: model.location.latitude,
        slope: model.grassland['grassland-slope'],
        heightNN: 1,
        horizons: [
          {
            thickness: model.soil['topsoil-depth'] / 100,
            organicMatter: model.soil['topsoil-org'] / 100,
            sand: model.soil['topsoil-sand'] / 100,
            clay: model.soil['topsoil-clay'] / 100,
            sceleton: model.soil['stone-content'] / 100
          },
          {
            thickness: 2 - model.soil['topsoil-depth'] / 100,
            organicMatter: model.soil['subsoil-org'] / 100,
            sand: model.soil['subsoil-sand'] / 100,
            clay: model.soil['subsoil-clay'] / 100,
            sceleton: model.soil['stone-content'] / 100
          }
        ]
      };

      var grassland = {
        crops: [
          {
            model: 'grassland',
            species: [
              {
                name: 'ryegrass',
                dryMatterFraction: 1 - model.grassland['legume-share'] / 100
              },
              {
                name: 'white clover',
                dryMatterFraction: model.grassland['legume-share'] / 100
              }
            ],
            sowingDate: null,
            plantDryWeight: 2000,
            finalHarvestDate: null,
            tillageOperations: [],
            irrigations: [],
            organicFertilisers: [],
            mineralFertilisers: []
          }
        ]
      };

      var cropConfig = { simulation: simulation, siteAndProd: [] };
      var sites = []; // store additional informations about sites (models)
      for (var i = 0; i < noPaddocks; i++) {
        cropConfig.siteAndProd.push({
          site: grasslandSite,
          production: grassland
        });
        sites.push({
          type: 'pasture',
          ha: grasslandArea * pastureShare / 100 / noPaddocks
        })
      }
      if (pastureShare < 100) {
        cropConfig.siteAndProd.push({
          site: grasslandSite,
          production: grassland
        });
        sites.push({
          type: 'grassland',
          ha: grasslandArea * (1  - pastureShare / 100)
        })
      }

      pastureWorker.onmessage = function (evt) {
        cb(evt.data);
      };

      // calc. avg IC per parity and avg req_m, req_t of herd

      pastureWorker.postMessage({
        weather: dss.weather,
        debug: true,
        verbose: true,
        grassland: {
          sites: sites,
          monthStart: model.grassland['grazing-start'],
          monthEnd:  model.grassland['grazing-end'],
          grazingSystem: grazingSystem,
          timeAtPasture: 24,
          supplementationStrategy: supplementationStrategy,
          herd: {
            avgIntakeCapacity: 20,
            herdSize: herdSize
          }
        },
        cropConfig: cropConfig
      }); 

    },
    feedEvaluation: function (feeds) {

      for (var i = 0, is = feeds.length; i < is; i++) {

        var f = feeds[i];

        /* DE */
        var de = {};
        de.GE = dairy.feed.evaluation.de.GE(f.CP, f.EE, f.CF, f.OM);
        de.ME = dairy.feed.evaluation.de.ME(f.CP, f.EE, f.EED, f.CF, f.CFD, f.OM, f.OMD);
        de.E = dairy.feed.evaluation.de.E_f(de.ME, de.GE);    
        de.P = dairy.feed.evaluation.de.uCP(de.ME, f.CP);
        de.RNB = dairy.feed.evaluation.de.RNB(f.CP, de.P);

        /* FI */
        var fi = {};
        if (f.type === 'concentrate')
          fi.E = dairy.feed.evaluation.fi.E_c(f.CP, f.CPD, f.CF, f.CFD, f.EE, f.EED, f.NFE, f.NFED);
        else
          fi.E = dairy.feed.evaluation.fi.E_f(f.OMD, f.OM, f.type);

        /* GB */
        var gb = {};
        if (f.type === 'concentrate')
          gb.E = dairy.feed.evaluation.gb.E_c(f.OM, f.OMD, false);
        else
          gb.E = dairy.feed.evaluation.gb.E_f(f.OM, f.OMD, f.type === 'fresh' || f.type === 'hay');

        /* FR */
        var fr = {};
        if (f.type === 'concentrate') {
          fr.E = dairy.feed.evaluation.fr.E_c(f.OMD, f.OM, f.CP, f.EE, f.CF, f.NDF, f.ash, f.delta_C1, 1, 1);
          fr.QIL = undefined;
          fr.FV = undefined; /* concentrate fill value is property of cow */
        } else { 
          /* TODO: add feed level adjustment -> recalculate when feed level parameters (req_m, req_t) are available */ 
          fr.E = dairy.feed.evaluation.fr.E_f(f.OMD, f.OM, f.CP, f.CF, f.type, f.DM / 10, f.delta_FR1_QIL, null, true, 1, 1); 
          fr.QIL = dairy.feed.evaluation.fr.QIL(f.OMD, f.CP, f.DM, f.type, f.delta_FR1_QIL, f.delta_S1_QIL, f.delta_H1_QIL, f.delta_S2_QIL, f.delta_H2_QIL);
          fr.FV = dairy.intake.FV_f(fr.QIL);
        }

        f.de = de;
        f.fi = fi;
        f.gb = gb;
        f.fr = fr;

      }

      return feeds;

    },
    diet: function () {

      var model = dss.ui.model().model;
      var modelFeed = model.feed;
      var feeds = [];
      function getFeed (id) {
        var feed = dairy.feed.feeds.reduce(function (a, b) {
          if (b.id === id)
            a.push(b);
          return a;
        }, [])[0];
        if (typeof feed === 'object' && feed !== null) {
          // make copy of feed
          feed = JSON.parse(JSON.stringify(feed));
        }
        return feed;
      }

      function addFeed (id_) {
        var feed = null;
        if (id_ >= 999) { // custom feed
          feed = getFeed(60); // default to wheat
          feed.id = id_;
          feed.name_de = 'Eigenes Futtermittel';
        } else {
          feed = getFeed(id_);
        }
        feed.amount = 0;
        var feedPops = Object.keys(modelFeed);
        for (var i = 0, is = feedPops.length; i < is; i++) {
          var prop = feedPops[i];
          if (prop.indexOf('feed-') === 0) {
            var id = parseInt(prop.split('-')[1], 10);
            var attr = prop.split('-')[2];
            var value = modelFeed[prop];
            if (id === id_) {
              switch (attr) {
                case 'name':
                  feed.name = value
                  break;
                case 'dm':
                  feed.DM = value
                  break;
                case 'om':
                  feed.OM = value
                  feed.ash = 1000 - feed.OM
                  break;
                case 'omd':
                  feed.OMD = value / 100
                  break;
                case 'cp':
                  feed.CP = value
                  break;
                case 'cpd':
                  feed.CPD = value / 100
                  break;
                case 'ee':
                  feed.EE = value
                  break;
                case 'eed':
                  feed.EED = value / 100
                  break;
                case 'cf':
                  feed.CF = value
                  break;
                case 'cfd':
                  feed.CFD = value / 100
                  break;
                case 'nfe':
                  feed.NFE = value
                  break;
                case 'nfed':
                  feed.NFED = value / 100
                  break;
                case 'amount':
                  feed.amount = value
                  break;
              }
            }
          }
        }
        return feed;
      }

      var feedPops = Object.keys(modelFeed);
      for (var i = 0, is = feedPops.length; i < is; i++) {
        var prop = feedPops[i];
        if (prop.indexOf('feed-') === 0) {
          var id = -1;
          if (prop.indexOf('amount') > 0 && modelFeed[prop] > 0) {
            id = parseInt(prop.split('-')[1], 10);
            feeds.push(addFeed(id));
          }
        }
      }

      feeds.push(addFeed(1));

      dss.feeds = dss.fn.feedEvaluation(feeds);
      // var LP = dss.fn.makeLP();

    },
    groupCowsForGrazingIntake: function () {

      /* apply only if no-groups = 1: assign each cow to a group to calculate average intake from grazing */

      var model = dss.ui.model().model;
      var calvingSeason = model.herd['calving-season'];
      var evalSys = model.feed['eval-system'];

      if (calvingSeason > 0) { /* make new distribution */

      }

      /* make 3 x 3 avg cows: each parity (1-3) x 3 feeding levels */
      var parity = dss.herd.cows.reduce(function (a, b) {
        if (!b.isDry) // only productive cows
          a[b.P - 1].push(b);
        else
          a[3].push(b);
        return a;
      }, [[],[],[],[/*dry cows here*/]]);

      if (calvingSeason === 0) { /* otherwise just make avg from parity */

        var feedingLevelBreaks = parity.reduce(function (a, b, i) {
          if (i < 3) { // only productive cows
            a[i] = b.reduce(function (c, d) {
              c.push(d.req[evalSys].total.E / d.req[evalSys].main.E); /* feeding level */
              return c;
            }, []);
          }
          return a;
        }, []).reduce(function (a, b) {
          /* cluster with Jenks */
          a.push(ss.jenks(b, 3));
          return a;
        },[]);

        console.log(feedingLevelBreaks);

      }

    },
    groupCowsForTMRfeeding: function () {

      /* PMR is not possible with a simple (no SLP) linear (LP) approach */
      var model = dss.ui.model().model;
      var noGroupsNonDry = model.herd['no-groups'];
      var noGroupsDry = 2; /* fixed to two groups */
      var evalSys = model.feed['eval-system'];
      var nonDryCows = [];
      var dryCows = [];

      for (var c = 0, cs = dss.herd.cows.length; c < cs; c++) {
        var cow = dss.herd.cows[c];
        /* calculate k-means clustering criteria */
        cow.E_density = cow.req[evalSys].total.E / cow.IC;  
        cow.P_density = cow.req.de.total.P / cow.IC; /* German system for protein */
        if (cow.isDry)
          dryCows.push(cow);
        else
          nonDryCows.push(cow);
      }

      if (noGroupsNonDry > 1) {
        dairy.group.get(nonDryCows, {
            k: noGroupsNonDry
          , runs: 15
          , normalize: true
          , xAttribute: 'E_density'
          , yAttribute: 'P_density'
        });              
      } else {
        for (var i = 0; i < nonDryCows.length; i++)
          nonDryCows[i].k = 0;      
      }

      if (dryCows.length > 2) {
        dairy.group.get(dryCows, {
            k: 2
          , runs: 15
          , normalize: true
          , xAttribute: 'E_density'
          , yAttribute: 'P_density'
        });      
      } else {
        for (var i = 0; i < dryCows.length; i++)
          dryCows[i].k = 0;
      }

      console.log(nonDryCows);
      console.log(dryCows);

    },
    getAverageTMRcows: function () {

      var model = dss.ui.model().model;
      var noGroupsNonDry = model.herd['no-groups'];
      var cows = dss.herd.cows;
      var avgNonDryCows = [];
      var avgDryCows = [];

      /* calc diet for average non-dry cow per group */
      for (var k = 0; k < noGroupsNonDry; k++) {

        avgNonDryCows.push(cows.filter(function (a) { 
          return a.k === k && !a.isDry; 
        }).reduce(function (a, b, i, arr) {
          var noCows = arr.length;
          a.IC += b.IC / noCows;
          a.FV_c += b.FV_c / noCows;
          a.req.fi.total.E += b.req.fi.total.E / noCows;
          a.req.de.total.E += b.req.de.total.E / noCows;
          a.req.de.total.P += b.req.de.total.P / noCows;
          a.req.gb.total.E += b.req.gb.total.E / noCows;
          a.req.fr.total.E += b.req.fr.total.E / noCows;
          return a;
        }, 
        { 
          IC: 0, 
          FV_c: 0,
          req: {
            de: { total: { E: 0, P: 0 } }, 
            fi: { total: { E: 0 } },
            gb: { total: { E: 0 } }, 
            fr: { total: { E: 0 } }
          }
        }));

      }

      /* calc diet for average dry cow per group */
      for (var k = 0; k < 2; k++) {

        avgDryCows.push(cows.filter(function (a) { 
          return a.k === k && a.isDry; 
        }).reduce(function (a, b, i, arr) {
          var noCows = arr.length;
          a.IC += b.IC / noCows;
          a.FV_c += b.FV_c / noCows;
          a.req.fi.total.E += b.req.fi.total.E / noCows;
          a.req.de.total.E += b.req.de.total.E / noCows;
          a.req.de.total.P += b.req.de.total.P / noCows;
          a.req.gb.total.E += b.req.gb.total.E / noCows;
          a.req.fr.total.E += b.req.fr.total.E / noCows;
          return a;
        }, 
        { 
          IC: 0, 
          FV_c: 0,
          req: {
            de: { total: { E: 0, P: 0 } }, 
            fi: { total: { E: 0 } },
            gb: { total: { E: 0 } }, 
            fr: { total: { E: 0 } }
          }
        }));

      }

      dss.herd.average = {
        nonDry: avgNonDryCows,
        dry: avgDryCows
      };

      return {
        nonDry: avgNonDryCows,
        dry: avgDryCows
      };

    },
    makeLP: function () {

      // dss.fn.groupCowsForGrazingIntake();
      dss.fn.groupCowsForTMRfeeding();
      var avgCows = dss.fn.getAverageTMRcows();
      console.log(avgCows);

      var model = dss.ui.model().model;

      /* GLPK 4.53 constants */
      var GLP_MIN = 1  /* minimization */
        , GLP_MAX = 2  /* maximization */

          /* kind of structural variable: */
        , GLP_CV  = 1  /* continuous variable */
        , GLP_IV  = 2  /* integer variable */
        , GLP_BV  = 3  /* binary variable */

          /* type of auxiliary/structural variable: */
        , GLP_FR  = 1  /* free (unbounded) variable */
        , GLP_LO  = 2  /* variable with lower bound */
        , GLP_UP  = 3  /* variable with upper bound */
        , GLP_DB  = 4  /* double-bounded variable */
        , GLP_FX  = 5  /* fixed variable */

        , GLP_MSG_OFF = 0  /* no output */
        , GLP_MSG_ERR = 1  /* warning and error messages only */
        , GLP_MSG_ON  = 2  /* normal output */
        , GLP_MSG_ALL = 3  /* full output */
        , GLP_MSG_DBG = 4  /* debug output */

          /* solution status: */
        , GLP_UNDEF  = 1  /* solution is undefined */
        , GLP_FEAS   = 2  /* solution is feasible */
        , GLP_INFEAS = 3  /* solution is infeasible */
        , GLP_NOFEAS = 4  /* no feasible solution exists */
        , GLP_OPT    = 5  /* solution is optimal */
        , GLP_UNBND  = 6  /* solution is unbounded */
        ;

      var RNB_ub = (model.feed['rnb-ub'] === 'Infinity' ? Infinity : parseFloat(model.feed['rnb-ub']))
        , RNB_lb = (model.feed['rnb-lb'] === '-Infinity' ? -Infinity : parseFloat(model.feed['rnb-lb']))
        , conc_mx = model.feed['concentrate-share'] / 100
        , eval_sys = model.feed['eval-system']
        , daysPerTimeStep = (model.simulation['time-step'] === 'week' ? 7 : 14)
        , noPeriods = (NO_DAYS_IN_SIMULATION / daysPerTimeStep) | 0
        , noDryGroups = avgCows.dry.length
        , noNonDryGroups = avgCows.nonDry.length
        , LP = {
            name: 'diet',
            objective: {
              direction: GLP_MAX,
              name: 'obj',
              vars: []
            },
            subjectTo: [],
            bounds: []
          }
        , objective = LP.objective
        , subjectTo = LP.subjectTo
        , bounds = LP.bounds
        ;

      /* over all periods and groups */
      for (var p = 0; p < noPeriods; p++) {

        for (var g = 0; g < noNonDryGroups; g++) {

          objective.vars.push({
            name: 'dE_' + p + '_' + g,
            coef: -10 
          });

          objective.vars.push({
            name: 'sE_' + p + '_' + g,
            coef: -10 
          });

          objective.vars.push({
            name: 'dP_' + p + '_' + g,
            coef: -1 
          });

          objective.vars.push({
            name: 'sP_' + p + '_' + g,
            coef: -1 
          });
         
          var E_const = {
            name: 'E_' + p + '_' + g,
            vars: [ 
              { name: 'dE_' + p + '_' + g, coef:  1 },
              { name: 'sE_' + p + '_' + g, coef: -1 },
            ],
            bnds: { type: GLP_FX, ub: 1.0, lb: 1.0 } 
          }; 

          var P_const = {
            name: 'P_' + p + '_' + g,
            vars: [ 
              { name: 'dP_' + p + '_' + g, coef:  1 },
              { name: 'sP_' + p + '_' + g, coef: -1 },
            ],
            bnds: { type: GLP_FX, ub: 1.0, lb: 1.0 } 
          };

          /* for each feed available in period p for group g */  
          for (var f = 0, fs = dss.feeds.length; f < fs; f++) {

            var feed = dss.feeds[f];

             /* if feed f is available */ 
            if (feed.periods.indexOf(p) >= 0 && feed.groups.indexOf(g) >= 0) {

              E_const.vars.push({
                name: 'F_' + feed.id + '_' + p + '_' + g,
                coef: feed[eval_sys].E / avgCows.nonDry[g].req[eval_sys].total.E /* should be avgCows.nonDry[p][g] with seasonal calving pattern */
              });

              P_const.vars.push({
                name: 'F_' + feed.id + '_' + p + '_' + g,
                coef: feed.de.P / avgCows.nonDry[g].req.de.total.P  /* should be avgCows.nonDry[p][g] with seasonal calving pattern */
              });              

            }

          } /* for each feed */      

        } /* for each non dry group */


        for (g = 0; g < noDryGroups; g++) {
         
        }
      }


      // var RNB_bnd_type = GLP_FR;
      // if (RNB_lb === RNB_ub)
      //   RNB_bnd_type = GLP_FX;
      // else if (RNB_lb === -Infinity && RNB_ub === Infinity)
      //   RNB_bnd_type = GLP_FR;
      // else if (RNB_lb === -Infinity && RNB_ub < Infinity)
      //   RNB_bnd_type = GLP_UP;
      // else if (RNB_lb > -Infinity && RNB_ub === Infinity)
      //   RNB_bnd_type = GLP_LO;
      // else if (RNB_lb != -Infinity && RNB_ub != Infinity)
      //   RNB_bnd_type = GLP_DB;

      // var RNB_const = {
      //   name: 'RNB',
      //   vars: [],
      //   bnds: { 
      //     type: RNB_bnd_type,
      //     ub: RNB_ub,
      //     lb: RNB_lb 
      //   } 
      // };

      var IC_const = {
        name: 'IC',
        vars: [],
        bnds: { type: GLP_FX, ub: avgCow.IC, lb: avgCow.IC } 
      };

      // var CC_const = {
      //   name: 'CC',
      //   vars: [],
      //   bnds: { type: GLP_UP, ub: 0, lb: 0 } 
      // };

      /* add selected feeds */
      for (var f = 0, fs = dss.feeds.length; f < fs; f++) {

        var feed = dss.feeds[f];

        if (conc_mx === 0 && feed.type === 'concentrate')
          continue;

        E_const.vars.push({
          name: 'F_' + feed.id,
          coef: feed[eval_sys].E / avgCow.req[eval_sys].total.E
        });

        P_const.vars.push({
          name: 'F_' + feed.id,
          coef: feed.de.P / avgCow.req.de.total.P
        });

        // RNB_const.vars.push({
        //   name: 'F_' + feed.id,
        //   coef: feed.de.RNB
        // });

        if (feed.type === 'concentrate') {

          IC_const.vars.push({
            name: 'F_' + feed.id,
            coef: avgCow.FV_c
          });

          // CC_const.vars.push({
          //   name: 'F_' + feed.id,
          //   coef: (1 - conc_mx) / conc_mx
          // });

        } else {

          IC_const.vars.push({
            name: 'F_' + feed.id,
            coef: feed.fr.FV
          });

          // CC_const.vars.push({
          //   name: 'F_' + feed.id,
          //   coef: -1
          // });

        }

      }    

      subjectTo.push(E_const);
      subjectTo.push(P_const);
      subjectTo.push(RNB_const);
        subjectTo.push(IC_const);
      if (conc_mx > 0)
        subjectTo.push(CC_const);

      LP.subjectTo = subjectTo;

      dairy.diet.glpk.onmessage = function (evt) {

        console.log(evt.data);

      };
      dairy.diet.glpk.postMessage({ lp: LP, msg_lev: GLP_MSG_DBG });
      
      console.log(JSON.stringify(LP, null, 2));

    },
    runModel: function (uiCb) {

      /*
        mode steps:
          - fit wood (cb)
          - get weather if not available (cb)
          - get herd parity distribution
          
          if  
            - sasonal calving:
              - calculate herd changes over time
              - calculate properties for each cow and time step. we have a cow per parity

            - continuous calving:
              - calculate properties for each cow
              - group cows and calculate average per group (cb)

          - run grassland model to calculate harvest dates, hay and silage availability per year
          - sync potential harvest dates with crop (grass-clover) and pasture model
          - run pasture model with average cows (pasture intake per avg cow (group))
          - run arable crop model to calculate forage availability from forage crops
          - feed evaluation
          - setup and solve LP
          - when LP callback returns draw results

      */       

      var model = dss.ui.model().model;

      var runCropModels = function () {

        dss.fn.cropGrowth(function (data) {

          if (data.done) {
            //console.log(data);

            var startYear = parseInt(model.simulation['start-year'], 10);

            var HI_g = data.HI_g;
            var HGR = data.HGR;
            var HM = data.HM;
            var columns_HI = [], columns_HM = [], names = {};
            // for (var i = 0, is = HI_g.length; i < is; i++) {
            //   columns_HI.push(['paddock' + (i + 1)].concat(HI_g[i]));
            //   columns_HM.push(['paddock' + (i + 1)].concat(HM[i]));
            // }
            columns_HI.push(['intake'].concat(HI_g));
            columns_HI.push(['omd'].concat(data.OMD_g));
            columns_HI.push(['cp'].concat(data.CP_g));
            columns_HI.push(['cf'].concat(data.CF_g));
            // names['intake'] = 'Herbage intake from grazing';
            columns_HI.push(['x'].concat(dss.weather.date.slice(dss.weather.date.indexOf(startYear + '-01-01'), 1 + ((startYear - 1995) * 365 + 5 * 365))));
            // columns_HM.push(['x'].concat(dss.weather.date));

            //console.log(columns_HI);
            //console.log(names);

            dss.ui.charts.pastureIntake.load({
              // names: names,
              columns: columns_HI
            });

            // dss.ui.charts.pastureDrymatter.load({
            //   columns: columns_HM,
            //   names: names
            // });

            //console.log(columns_HI);
            //console.log(names);

            dss.fn.diet();
            uiCb();

          } else {
            //console.log(data)
          }

        });

      };

      dss.fn.fitWood(dss.ui.milkYieldData(), function (data) {

        if (Array.isArray(data)) { // returned wood params
 
          dss.fn.herdStructure();
          dss.fn.cowProperties();
          if (dss.fn.modelChanged('location') || dss.weather.date.length === 0) {

            var lat = parseFloat(Number($('#latitude').prop('value')).toFixed(3));
            var lon = parseFloat(Number($('#longitude').prop('value')).toFixed(3));
            dss.fn.weather(lat, lon, function (weather, error) {

              if (weather === null && error)  // on fail TODO: keep failing coords
                $(getAlert('Error.', error.text, 'danger')).prependTo($('body')).delay(6000).fadeOut(500, function () { $(this).remove(); });
              else
                runCropModels();
              
            });
          
          } else {
            runCropModels();
          }

        }

        
      });

    }

  };


});
