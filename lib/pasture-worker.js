importScripts('crop.js');
importScripts('dairy.js');

var getGrazingCb = function (options) {

  var sites = options.sites;
  var noModels = sites.length;
  
  var herd = options.herd;
  var herdSize = herd.herdSize;
  var timeAtPasture = options.timeAtPasture;
  var avgIntakeCapacity = herd.avgIntakeCapacity;
  var residenceTime = 1;
  var delta_F1 = 80;
  var monthStart = options.monthStart;
  var monthEnd = options.monthEnd;

  var HI_rg = [];
  var OMD_g = [];
  var CP_g = [];
  var CF_g = [];
  var HGR = [];
  var HM_2 = [];
  var HM_0 = [];
  for (var i = 0; i < sites.length; i++) {
    HGR.push([]);
    HM_2.push([]);
    HM_0.push([]);
  };

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
        var OMD = mcg.shootOrganicMatterDigestibility();
        var OM = mcg.shootOrganicMatterContent();
        var CP = mcg.shootCrudeProteinContent();
        var CF = mcg.shootCrudeFibreContent();
        var height = mcg.height();
        var HM_2_ = mcg.shootBiomassByHeight(0.02);
        var HM_0_ = mcg.shootBiomass();
        var HGR_ = mcg.growthIncrement(1) + mcg.growthIncrement(2); // leaf & stem
        var HGR_ = HGR_ < 0 ? 0 : HGR_;
        var HI_rg_ = 0;
        var RT = 1;
        var NCow = 3;
        var TAP = 6;
        var DM = 180;
        var delta_F1 = 80;
        var req_m = 1;
        var req_t = 2;
        var parity = 2;

        // calculate fill value of pasture
        var QIL = dairy.feed.evaluation.fr.QIL(OMD, CP, DM, 'fresh', 0);
        var UFL = dairy.feed.evaluation.fr.E_f(OMD, OM, CP, CF, 'none', DM / 1000, delta_F1, 0, false, req_m, req_t)
        var FV = dairy.intake.FV_f(QIL, parity);

        // paddock 1
        if (m === 0 && new Date(dateString).getMonth() + 1 >= monthStart && new Date(dateString).getMonth() + 1 <= monthEnd)
          HI_rg_ = dairy.intake.HI_rg(avgIntakeCapacity, FV, sites[m].ha * 1e4, height * 100, HM_2_, HGR_, residenceTime, herdSize, timeAtPasture);

        // if (HM_2_ < 100)
        //   HI_rg_ = 0;
        if (HI_rg_ > 0)
          HI_rg_ = mcg.harvestShootBiomass(HI_rg_ * herdSize / sites[m].ha) / herdSize * sites[m].ha;

        HGR[m].push((HGR_ * 10 | 0) / 10);
        if (m === 0) HI_rg.push((HI_rg_ * 10 | 0) / 10);
        if (m === 0) {
          OMD_g.push((OMD * 1000 | 0) / 10);
          CP_g.push((CP | 0) / 10);
          CF_g.push((CF | 0) / 10);
        }
        HM_2[m].push((HM_2_ * 10 | 0) / 10);
        HM_0[m].push((HM_0_ * 10 | 0) / 10);

      } else {
        // if (m === 0) HI_rg.push(0);
        // if (m === 0) OMD_g.push(0);
        // HGR[m].push(0);
        // HM_2[m].push(0);
        // HM_0[m].push(0);
      }

    }

    if (done)
      postMessage({ done: true, HI_g: HI_rg, HGR: HGR, HM_2: HM_2 , HM: HM_0, OMD_g: OMD_g, CP_g: CP_g, CF_g: CF_g });

  }

};

onmessage = function (evt) {

  var data = evt.data;
  console.log(data);
  
  var cfg = new crop.Configuration(data.weather, data.debug, data.verbose, getGrazingCb(data.grassland));
  cfg.run(data.cropConfig.simulation, data.cropConfig.siteAndProd);

};
