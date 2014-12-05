var dss = dss || {};

$(function () {


  $('.dairy-parameter > .spinner').spinner({
    create: function () {
      $(this).css('width',  '130px');
    }
  });

  $('.dairy-parameter > .selectmenu').selectmenu();

});
