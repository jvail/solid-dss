var dss = dss || {};

$(function () {

  'use strict'

  console.log(dss);

  dss.ui = {};

  var stack = {
      locationAndWeather: $('div#location-and-weather', '#right')
    , dairyHerd: $('div#dairy-herd', '#right')
    , boughtInFeedstuff: $('div#bought-in-feedstuff', '#right')
    , arableCrops1: $('div#arable-crops-1', '#right')
    , arableCrops2: $('div#arable-crops-2', '#right')
    , permanentGrassland1: $('div#permanent-grassland-1', '#right')
    , permanentGrassland2: $('div#permanent-grassland-2', '#right')
    , simulation: $('div#simulation', '#right')
  };

  stack.locationAndWeather.lat = $('input#lat', stack.locationAndWeather);
  stack.locationAndWeather.lon = $('input#lon', stack.locationAndWeather);

  stack.locationAndWeather.lat.spinner({
    min: 25.375,
    max: 75.375,
    step: 0.25,
    change: function (event, ui) {
      if ($(this).spinner('value') === null)
        $(this).spinner('value', dss.model.locationAndWeather.lat);
      else
        dss.model.locationAndWeather.lat = $(this).spinner('value'); 
    }
  });

  stack.locationAndWeather.lon.spinner({
    min: -40.375,
    max: 75.375,
    step: 0.25,
    change: function (event, ui) {
      if ($(this).spinner('value') === null)
        $(this).spinner('value', dss.model.locationAndWeather.lon);
      else
        dss.model.locationAndWeather.lon = $(this).spinner('value'); 
    }
  });

  // set lat/lon to default or current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        stack.locationAndWeather.lat.spinner('value', pos.coords.latitude);
        stack.locationAndWeather.lon.spinner('value', pos.coords.longitude);
      },
      function (err) {
        stack.locationAndWeather.lat.spinner('value', 52.52);
        stack.locationAndWeather.lon.spinner('value', 13.41);        
      }
    );
  }

  // tree & stack
  $('li#location-and-weather').on('click', function () {

    $('.stack').hide();
    stack.locationAndWeather.show();

  });

  $('li#dairy-herd').on('click', function () {

    $('.stack').hide();
    stack.dairyHerd.show();

  });

  $('li#bought-in-feedstuff').on('click', function () {

    $('.stack').hide();
    stack.boughtInFeedstuff.show();

  });

  $('li#arable-crops-1').on('click', function () {

    $('.stack').hide();
    stack.arableCrops1.show();

  });

  $('li#arable-crops-2').on('click', function () {

    $('.stack').hide();
    stack.arableCrops2.show();

  });

  $('li#permanent-grassland-1').on('click', function () {

    $('.stack').hide();
    stack.permanentGrassland1.show();

  });

  $('li#permanent-grassland-2').on('click', function () {

    $('.stack').hide();
    stack.permanentGrassland2.show();

  });

  $('li#simulation').on('click', function () {

    $('.stack').hide();
    stack.simulation.show();

  });


});
