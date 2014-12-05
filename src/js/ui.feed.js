var dss = dss || {};

$(function () {

  'use strict'

  feed.meta = {
    DM: 'dry matter [g kg-1 feed]',
    ash: 'ash [g kg-1 DM]',
    OM: 'organic matter [g kg-1 DM]',
    OMD: 'organic matter digestibility [kg kg-1]',
    CP: 'crude protein [g kg-1 DM]',
    CPD: 'crude protein digestibility [kg kg-1]',
    EE: 'ether extracts [g kg-1 DM]',
    EED: 'ether extracts digestibility [kg kg-1]',
    CF: 'crude fibre [g kg-1 DM]',
    CFD: 'crude fibre digestibility [kg kg-1]',
    NFE: 'nitrogen-free extract [g kg-1 DM]',
    NFED: 'nitrogen-free extract digestibility [kg kg-1]',
    NDF: 'neutral detergend fibre [g kg-1 DM]'
  };

  feed.feeds.sort(function (a, b) { 
    return (a.name > b.name) ? 1 : ((a.name < b.name) ? -1 : 0); 
  });
  for (var i = 0, is = feed.feeds.length; i < is; i++) {

    var f = feed.feeds[i];
    if (f.type != 'straw' && f.type != 'concentrate' && f.type != 'hay')
      continue;

    var html = "";
    html += "<div class='feed'>";
    html +=   "<input id='feed-"+f.id+"' type='checkbox' data-id='"+f.id+"'></input>";
    html +=   "<span class='feed-icon ui-icon ui-icon-triangle-1-e'></span>";
    html +=   "<span class='feed-name'>"+f.name+"</span>";
    html +=   "<div class='feed-content'>";
    html +=     "<p class='feed-parameter'><label title='bought fresh matter [t year-1]'>FM</label><input value='0' data-name='FM'></input></p>";
    html +=     "<p class='feed-parameter'><label>DM</label><input value='"+f.DM+"' data-name='DM'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>ash</label><input value='"+f.ash+"' data-name='ash'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>OM</label><input value='"+f.OM+"' data-name='OM'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>OMD</label><input value='"+f.OMD+"' data-name='OMD'></input></p>";
    html +=     "<p class='feed-parameter'><label>CP</label><input value='"+f.CP+"' data-name='CP'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>CPD</label><input value='"+f.CPD+"' data-name='CPD'></input></p>";
    html +=     "<p class='feed-parameter'><label>EE</label><input value='"+f.EE+"' data-name='EE'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>EED</label><input value='"+f.EED+"' data-name='EED'></input></p>";
    html +=     "<p class='feed-parameter'><label>CF</label><input value='"+f.CF+"' data-name='CF'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>CFD</label><input value='"+f.CFD+"' data-name='CFD'></input></p>";
    html +=     "<p class='feed-parameter'><label>NFE</label><input value='"+f.NFE+"' data-name='NFE'></input></p>";
    html +=     "<p class='feed-parameter advanced'><label>NFED</label><input value='"+f.NFED+"' data-name='NFED'></input></p>";
    html +=     "<p class='feed-parameter'><label>NDF</label><input value='"+f.NDF+"' data-name='NDF'></input></p>";
    html +=   "</div>";
    html += "</div>";

    if (f.type === 'straw')
      $('#straw').append(html);
    else if (f.type === 'concentrate')
      $('#concentrate').append(html);
    else if (f.type === 'hay')
      $('#hay').append(html);

  }

    // add tooltip
    $('.feed-parameter').each(function () {

      $(this).children('label').prop('title', feed.meta[$(this).children('input').data('name')]);

    });

  $('.feed-parameter > label').tooltip();

  $('.feed-parameter > input').spinner({
    min: 0,
    create: function () {
      $(this).css('width', '130px');
    }
  });

  $('.feed-name').on('click', function () {

    var icon = $('.feed-icon', $(this).parents('.feed'))
    $('.feed-content:visible', $(this).parents('.feed-column')).slideUp(200)
    $('.feed-icon', $(this).parents('.feed-column')).removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e');

    if (!icon.siblings('.feed-content').is(':visible')) {
      icon.removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
      icon.siblings('.feed-content').slideDown(200);
    }

  });

});
