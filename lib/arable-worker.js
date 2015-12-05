importScripts('crop.js');

var getArableCb = function (options) {

  var sites = options.sites;
  var noModels = sites.length;

  /* return the callback */
  return function (dayOfSimulation, dateString, models, done) {

    var model, isCropPlanted, mcg, mst, msm, mso, msc, msq;

    for (var m = 0; m < noModels; m++) {

      model = models[m];
      isCropPlanted = model.isCropPlanted();
      // mst = model.soilTemperature();
      // msm = model.soilMoisture();
      // mso = model.soilOrganic();
      // msc = model.soilColumn()
      // msa = model.soilColumnNC();
      // msq = model.soilTransport();


      if (isCropPlanted) {

        mcg = model.cropGrowth();

      } else {

      }

    }

    if (done)
      postMessage({ done: true });

  }

};

onmessage = function (evt) {

  var data = evt.data;
  console.log(data);
  
  var cfg = new crop.Configuration(data.weather, data.debug, data.verbose, getGrasslandCb(data.crops));
  cfg.run(data.cropConfig.simulation, data.cropConfig.siteAndProd);

};
