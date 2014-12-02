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

  console.log(feed);
  // feed
  for (var i = 0, is = feed.feeds.length; i < is; i++) {

    var f = feed.feeds[i];
    if (f.type != 'straw' && f.type != 'concentrate' && f.type != 'hay')
      continue;

    var html = "";
    html += "<div class='feed'>";
    html +=   "<span class='feed-edit ui-icon ui-icon-triangle-1-e'></span>";
    html +=   "<input id='feed-"+i+"' type='checkbox'></input>";
    html +=   "<label for='feed-"+i+"'>"+f.name+"</label>";
    html +=   "<div class='feed-content'>";
    html +=     "<p class='feed-parameter'><label>DM</label><input value="+f.DM+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>ash</label><input value="+f.ash+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>OM</label><input value="+f.OM+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>OMD</label><input value="+f.OMD+"></input></p>";
    html +=     "<p class='feed-parameter'><label>CP</label><input value="+f.CP+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>CPD</label><input value="+f.CPD+"></input></p>";
    html +=     "<p class='feed-parameter'><label>EE</label><input value="+f.EE+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>EED</label><input value="+f.EED+"></input></p>";
    html +=     "<p class='feed-parameter'><label>CF</label><input value="+f.CF+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>CFD</label><input value="+f.CFD+"></input></p>";
    html +=     "<p class='feed-parameter'><label>NFE</label><input value="+f.NFE+"></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>NFED</label><input value="+f.NFED+"></input></p>";
    html +=     "<p class='feed-parameter'><label>NDF</label><input value="+f.NDF+"></input></p>";
    html +=   "</div>";
    html += "</div>";

    if (f.type === 'straw')
      $('#straw').append(html);
    else if (f.type === 'concentrate')
      $('#concentrate').append(html);
    else if (f.type === 'hay')
      $('#hay').append(html);

  }

  $('.feed-parameter > input').spinner();

  $('.feed-edit').on('click', function () {


    $('.feed-content:visible', $(this).parents('.feed-column')).slideUp(200)
    $('.feed-edit', $(this).parents('.feed-column')).removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');

    if (!$(this).siblings('.feed-content').is(':visible')) {
      $(this).removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
      $(this).siblings('.feed-content').slideDown(200);
    }

  });


  $('#advanced').on('change', function () {
    $('.advanced').fadeToggle(500);
  })

});
