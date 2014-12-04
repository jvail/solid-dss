var dss = dss || {};

$(function () {


  $('#arable-crops-1 > .parameter > input').spinner({
    create: function () {
      $(this).css('width',  '40px');
    }
  });

  $('#rotation-crops-div > .parameter > input').spinner({
    create: function () {
      $(this).css('width',  '40px');
    }
  });



  /*
    allow

    n -> 1
    1 -> n

    not allowed

    n -> n,m

  */

  var MAX_DRAGS_PER_PRECROP = 3;
  var MAX_DROPS_PER_PRECROP = 3;
  var previewPath = document.getElementById('preview-path');
  var noYears = $('.container', '#rotation-div').length - 1;


  var connections = (function () {

    var store = [];
    var svg = document.getElementsByTagName('svg')[0];

    var add = function (connection) {

      store.push(connection);
      // console.log(connection);

      var path = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
      // path.setAttributeNS(null, 'id', id);
      path.setAttributeNS(null, 'class', 'connector');
      path.style.stroke = "#aaa"; //Set stroke colour
      path.style.strokeWidth = "1px"; //Set stroke width
      path.style.fill = "transparent"; //Set stroke width
      path.setAttributeNS(null, "d",'M0 0 C 0 0 0 0 0 0'); //Set path's data
      svg.appendChild(path);

      connection.path = path;

      redraw(connection);

      return path;

    };

    var redraw = function (connection) {

      var path = connection.path;
      var offsetFrom = connection.from.ui.offset();
      var offsetTo = connection.to.ui.offset();
      var ptFrom  = svg.createSVGPoint();
      var ptTo  = svg.createSVGPoint();

      ptFrom.x = offsetFrom.left + connection.from.ui.width();
      ptFrom.y = offsetFrom.top + connection.from.ui.height() * 0.5;
      ptFrom = ptFrom.matrixTransform(svg.getScreenCTM().inverse());

      ptTo.x = offsetTo.left;
      ptTo.y = offsetTo.top + connection.to.ui.height() * 0.5;
      ptTo = ptTo.matrixTransform(svg.getScreenCTM().inverse());

      path.pathSegList[0].x = ptFrom.x;
      path.pathSegList[0].y = ptFrom.y;
      path.pathSegList[1].x = ptTo.x;
      path.pathSegList[1].y = ptTo.y;
      path.pathSegList[1].x1 = path.pathSegList[1].x2 = ptFrom.x + (ptTo.x - ptFrom.x) * 0.5;      
      path.pathSegList[1].y1 = ptFrom.y;
      path.pathSegList[1].y2 = ptTo.y;
    
    };

    var update = function (item) {

      for (var i = 0, is = store.length; i < is; i++) {
        var connection = store[i];
        if (connection.from.ui.parents('.item').is(item) || connection.to.ui.parents('.item').is(item))
          redraw(connection);
      }

    };

    var remove = function (path) {

      for (var i = 0, is = store.length; i < is; i++) {

        if (store[i].path === path) {

          var connection = store.splice(i, 1)[0];
          $(connection.path).remove();
          if (store.length === is - 1)
            return connection;
          break;
        }

      }

      return null;

    }


    return {

      add: add,
      update: update,
      remove: remove

    };


  }());

  var updateRotationLength = function () {

    $('line', svg).each(function () { this.style.stroke = 'rgb(153, 153, 153)'; });

    // find last container that is empty, contains no items
    var container = $('.container');
    noYears = container.length - 1;
    for (var i = container.length - 2; i >= 0; i--) {
      if ($(container[i]).find('.item').length === 0)
        noYears = i;
      else
        break;
      $('line', svg)[i].style.stroke = 'rgb(40, 40, 40)';
    }

    console.log('updateRotationLength to: ' + noYears);

  }

  var itemDropAllowed = function (container) {

    var containerIndex = $('.container').index(container);

    // only one item in first year allowed
    if (containerIndex === 0 && container.children('.item').length === 1)
      return false;

    // max 3 items per container
    if (containerIndex > 0 && container.children('.item').length === 3)
      return false

    // if last crop (clone) has drops rotation length is locked
    var lastItem = $('.container:last()').find('.item');
    if (containerIndex > 0 && lastItem.length > 0 && lastItem.data('data').drops.length > 0 && containerIndex + 1 > noYears)
      return false;

    return true;

  }; 

  var connectionAllowed = function (drag, drop) {

    var dragData = drag.parents('.item').data('data');
    var dropData = drop.parents('.item').data('data');

    // check if max. no. of precrops has been reached
    if (dropData.drops.length === MAX_DROPS_PER_PRECROP) {
      console.log('max. no. of precrops has been reached');
      return false;
    }

    // avoid n:m connections
    if (dropData.drops.length > 0 && dropData.drags.length > 1) {
      console.log('avoid n:m connections');
      return false;        
    }

    // allow only connections from previous period (container)
    if (dropData.containerIndex - 1 !== dragData.containerIndex) {

      // .. but allow if it is the last crop in a rotation
      if (dropData.containerIndex === $('.container').length - 1)  { // is clone of first
        var index = dragData.containerIndex;
        var isLastCrop = true;
        while (index < $('.container').length - 2) {

          index++;
          if ($($('.container')[index]).children('.item').length !== 0) {
            isLastCrop = false;
            break;
          }

        };

        if (isLastCrop)
          return true;
      }

      console.log('only connections from previous period (container) allowed');
      return false;
    }

    var hasAlreadyConnectionToItem = false;
    var dragItem = drag.parents('.item');
    for (var i = 0, is = dropData.drops.length; i < is; i++) {
      if (dropData.drops[i].from.item.is(dragItem)) {
        hasAlreadyConnectionToItem = true;
        break;
      }
    }

    // check if drop is allowed
    if (hasAlreadyConnectionToItem) {
      console.log('items already connected')
      return false;
    }

    return true;

  };

  var updateArea = function (dragItem) {

    var area = 0;

    if (dragItem.data('data').containerIndex === noYears) {
      // compare start & end area
      area = dragItem.data('data').drops.reduce(function (p, c) {
        return { area: p.area + c.area };
      }, { area: 0 }).area;
      
      if (area !== dragItem.data('data').clone.data('data').area)
        dragItem.find('.item-drop-area').css('color', 'red');
      else
        dragItem.find('.item-drop-area').css('color', 'black');

      return;
    }

    if (dragItem.data('data').containerIndex === 0) {

      area = dragItem.data('data').area;

    } else {

      area = dragItem.data('data').drops.reduce(function (p, c) {
        return { area: p.area + c.area };
      }, { area: 0 }).area;

      if (dragItem.data('data').drops.length === 0 || area === 0) {
        dragItem.find('.item-drop-area').html(0);
        dragItem.find('.item-drop-area').css('color', 'red');
      } else {
        dragItem.find('.item-drop-area').css('color', 'black');
      }

    }

    dragItem.find('.item-drop-area').html(area.toFixed(2));

    
    var draggedArea = area / dragItem.data('data').drags.length;

    for (var i = 0, is = dragItem.data('data').drags.length; i < is; i++) {

      var dropItem = dragItem.data('data').drags[i].to.item;

      if (dropItem.data('data').drops.length === 0 || area === 0) {
        dropItem.find('.item-drop-area').html(0);
        dropItem.find('.item-drop-area').css('color', 'red');
      } else {
        dropItem.find('.item-drop-area').css('color', 'black');
      }

      for (var j = 0, js = dropItem.data('data').drops.length; j < js; j++) {
      
        if (dropItem.data('data').drops[j].from.item.is(dragItem)) {
          dropItem.data('data').drops[j].area = draggedArea;
          dropItem.find('.item-drop-area').html(
            dropItem.data('data').drops.reduce(function (p, c) {
              return { area: p.area + c.area };
            }, { area: 0 }).area.toFixed(2)
          );
        }
      
      }

      updateArea(dropItem);

    }

  };

  var makeConnection = function (drag, drop) {

    var path = connections.add({
      from: { ui: drag },
      to: { ui: drop }
    });

    drag.parents('.item').data('data').drags.push({
      path: path,
      area: 0,
      to: { item: drop.parents('.item'), drop: drop }
    });

    drop.parents('.item').data('data').drops.push({
      path: path,
      area: 0,
      from: { item: drag.parents('.item'), drag: drag }
    });

    updateArea(drag.parents('.item'));

    return path;

  };

  var makeDragableItem = function (item, containerIndex, position) {

    item.draggable({
      handle: '.item-header',
      containment: 'parent',
      create: function (event, ui) {

        item.data('data').containerIndex = containerIndex; // store containerIndex (index) of parent container

        // leave item at position were it was dropped
        $(this).offset({ top: position.top, left: position.left});

        if (containerIndex === 0) { 


          // add a clone to last container to mirror (clone) item
          var clone = $(this).clone();
          /* both need to know about each other */
          $(this).data('data').clone = clone;
          // add clone to last container
          $('.container.no-drop').append(clone);
          clone.data('data', {
            crop: { name: item.data('crop') },
            containerIndex: $('.container').length - 1,
            drags: [],
            drops: [],
            clone: $(this),
            area: 0
          });
          makeDragableItem(clone, $('.container').length - 1, $(this).position);
          addPrecrop($(this));

          // initial area
          var noCropsInFirstYear = $('.container').first().find('.item').length;
          var area = 1 / (noYears * noCropsInFirstYear);

          $('.container', '#rotation-div').first().find('.item').each(function () { $(this).data('data').area = area; });
          $('.container', '#rotation-div').first().find('.item-drop-area').html(area.toFixed(2));
          $('.container', '#rotation-div').first().find('.item').each(function () { updateArea($(this)); });

        } else {
          addPrecrop($(this));
        }
        

      },
      drag: function (event, ui) {

        // update svg paths
        connections.update($(this));
        // update clone position if item has clone
        var clone = $(this).data('data').clone;
        if (clone) {
          clone.css({ 'top': ui.position.top, 'left': ui.position.left });
          connections.update(clone);

        }

      }
    });

      
    // close button TODO: hide close button in clone
    item.find('.item-header > .ui-icon-close').on('click', function () {

      var item = $(this).parents('.item');
      var containerIndex = item.data('data').containerIndex;

      console.log('remove item');
      if (containerIndex === noYears)
        return;
      var clone = item.data('data').clone;
      var connectedItems = [], connectedItem = null;

      // remove connections to the left (drops)
      if (containerIndex > 0) {
        for (var i = 0, is = item.data('data').drops.length; i < is; i++) {

          connectedItem = item.data('data').drops[i].from.item;

          for (var j = 0, js = connectedItem.data('data').drags.length; j < js; j++) {
            
            if (connectedItem.data('data').drags[j].to.item.is(item)) {

              var connection = connections.remove(item.data('data').drops[i].path);
              if (connection) {
                connectedItem.data('data').drags.splice(j, 1);
                // recalculate splitted areas
                // if more than one connection ...
                if (connectedItem.data('data').drags.length > 0) {

                  connectedItem.find('.item-body-right')[j].remove();
                  var height = connectedItem.find('.item-body').height();
                  var siblings = connectedItem.find('.item-body-right');
                  siblings.css('height', height / siblings.length);
                
                } /*else {
                  connectedItem.find('.item-body-right').removeClass('ui-icon ui-icon-close');
                }*/
                
              }
              
              connectedItems.push(connectedItem);
              break;

            }

          }


        }
      }

      // remove connections to the right (drags)
      for (var i = 0, is = item.data('data').drags.length; i < is; i++) {

        connectedItem = item.data('data').drags[i].to.item;

        for (var j = 0, js = connectedItem.data('data').drops.length; j < js; j++) {
          
          if (connectedItem.data('data').drops[j].from.item.is(item)) {

            var connection = connections.remove(item.data('data').drags[i].path);
            if (connection) {
              connectedItem.data('data').drops.splice(j, 1);
            }

            connectedItems.push(connectedItem);
            break;
          }

        }


      }

      if (clone) {

        // remove connections to the left (drops)
        for (var i = 0, is = clone.data('data').drops.length; i < is; i++) {

          connectedItem = clone.data('data').drops[i].from.item;

          for (var j = 0, js = connectedItem.data('data').drags.length; j < js; j++) {
            
            if (connectedItem.data('data').drags[j].to.item.is(clone)) {

              var connection = connections.remove(clone.data('data').drops[i].path);
              if (connection) {
                connectedItem.data('data').drags.splice(j, 1);

                // recalculate splitted areas
                // if more than one connection ...
                if (connectedItem.data('data').drags.length > 0) {

                  connectedItem.find('.item-body-right')[j].remove();
                  var height = connectedItem.find('.item-body').height();
                  var siblings = connectedItem.find('.item-body-right');
                  siblings.css('height', height / siblings.length);
                
                } /*else {
                  connectedItem.find('.item-body-right').removeClass('ui-icon ui-icon-close');
                }*/

              }

              connectedItems.push(connectedItem);
              break;
            
            }

          }


        }

        item.data('data').clone.remove();
      }

      item.remove();

      for (var i = 0, is = connectedItems.length; i < is; i++)
        updateArea(connectedItems[i]);

      updateRotationLength();

    });

    item.children('.item-body').on('click', function () {

      // load item data
      $('#rotation-crops-div > #crop-name').html($(this).parent('.item').data('data').crop.name);

    });


  }; // make item

  var makeDragableConnector = function (drag, drop) {

    drag.draggable({
      helper: 'clone',
      zIndex: 1000,
      appendTo: 'body',
      create: function () {

        
        $(this).on('click', function () {

          // remove a connection
          var dragItem = $(this).parents('.item');
          var dragData = dragItem.data('data');

          if (dragData.drags.length > 0) {

            var index = dragItem.find('.item-drag').index($(this));
            var connection = connections.remove(dragData.drags[index].path);
            if (connection) {
              var old = dragData.drags.splice(index, 1);
              var dropData = old[0].to.item.data('data');
              for (var i = 0, is = dropData.drops.length; i < is; i++) {
                if (dropData.drops[i].from.item.is(dragItem)) {
                  dropData.drops.splice(i, 1);
                  break;
                }
              } 

              updateArea(old[0].to.item);             

              // if more than one connection ...
              if (dragData.drags.length > 0) {

                var height = $(this).parents('.item-body').height();
                var siblings = $(this).parent().siblings('.item-body-right');
                siblings.css('height', height / siblings.length);
                $(this).parents('.item-body-right').remove();
                connections.update($(siblings[0]).parents('.item'));
              
              } /*else {
                $(this).children('span').removeClass('ui-icon ui-icon-close');
              }*/

              updateArea(dragItem);

            }
          }

        }); // on click

        if (drop) {

          var path = makeConnection(drag, drop);
          // $(this).children('span').addClass('ui-icon ui-icon-close');   
          connections.update($(this).parents('.item'));      

        }
      
      }, // create
      start: function (event, ui) {

        var item = $(this).parents('.item');

        // check if max. no. of precrops has been reached
        if (item.data('data').drags.length === MAX_DRAGS_PER_PRECROP) {
          console.log('max. no. of drags has been reached');
          return false;
        }

        // avoid n:m connections
        if (item.data('data').drops.length > 1 && item.data('data').drags.length > 0) {
          console.log('avoid n:m connections');
          return false;        
        }

      }, // start
      drag: function (event, ui) {

        previewPath.style.opacity = 1;

        var offsetFrom = $(this).offset();
        var offsetTo = ui.offset;
        var ptFrom  = svg.createSVGPoint();
        var ptTo  = svg.createSVGPoint();

        ptFrom.x = offsetFrom.left + $(this).width() * 0.5;
        ptFrom.y = offsetFrom.top + $(this).height() * 0.5;
        ptFrom = ptFrom.matrixTransform(svg.getScreenCTM().inverse());

        ptTo.x = offsetTo.left + ui.helper.width() * 0.5;
        ptTo.y = offsetTo.top + ui.helper.height() * 0.5;
        ptTo = ptTo.matrixTransform(svg.getScreenCTM().inverse());

        previewPath.pathSegList[0].x = ptFrom.x;
        previewPath.pathSegList[0].y = ptFrom.y;
        previewPath.pathSegList[1].x = ptTo.x;
        previewPath.pathSegList[1].y = ptTo.y;
        previewPath.pathSegList[1].x1 = previewPath.pathSegList[1].x2 = ptFrom.x + (ptTo.x - ptFrom.x) * 0.5;      
        previewPath.pathSegList[1].y1 = ptFrom.y;
        previewPath.pathSegList[1].y2 = ptTo.y;

      }, // drag
      stop: function (event, ui) {

        previewPath.style.stroke = '#aaa';
        previewPath.style.opacity = 0;

      } // stop
    }); // draggable

  }; // makeDragableConnector


  var addPrecrop = function (item) {

    item.append(
      "<div class='item-body'>\
        <div class='item-body-left'>\
          <div class='item-drop'><span class='item-drop-area'>0</span></div>\
        </div>\
        <div class='item-body-right'>\
          <span class='item-drag-area'>1</span>\
          <div class='item-drag'><span></span></div>\
        </div>\
      </div>");

    makeDragableConnector($(item.find('.item-drag').last()));
    
    // create droppable in new crop area
    $('.item-drop', item).droppable({
      accept: '.item-drag', 
      tolerance: 'touch',
      create: function () {

      }, // create
      over: function (event, ui) {

        if (connectionAllowed(ui.draggable, $(this))) {

          $(this).css('background-color', 'green');
          ui.draggable.css('background-color', 'green');
          previewPath.style.stroke = 'green';

        } else {
          
          $(this).css('background-color', 'red');
          ui.draggable.css('background-color', 'red');
          previewPath.style.stroke = 'red';

        }

      }, // over
      out: function (event, ui) {

        $(this).css('background-color', 'white');
        ui.draggable.css('background-color', 'white');
        previewPath.style.stroke = '#aaa';

      }, // out
      drop: function (event, ui) {

        var drag = ui.draggable;
        var drop = $(this);

        drag.css('background-color', 'white');
        drop.css('background-color', 'white');
        previewPath.style.stroke = '#aaa';
        previewPath.style.opacity = 0;
        
        if (!connectionAllowed(drag, drop))
          return false;

        // drag.children('span').addClass('ui-icon ui-icon-close');

        if (drag.parents('.item').data('data').drags.length > 0) {

          var pre = drag.parents('.item-body');
          var noDrags = drag.parents('.item').data('data').drags.length;

          if (pre.find('.item-body-right').length < MAX_DRAGS_PER_PRECROP) {
            
            pre.append(
              "<div class='item-body-right'>\
                <span class='item-drag-area'>0</span>\
                <div class='item-drag'><span></span></div>\
              </div>"
            );

            pre.find('.item-drag-area').html((1 / (noDrags + 1)).toFixed(2));

            // TODO: layout
            drag.parents('.item-body').find('.item-body-right').css('height', pre.height() / (noDrags + 1));
            drag.parent().css('height', (pre.height() - $('.item-body-right').css('border-top-width') * 2 * (noDrags + 1)) / (noDrags + 1));
            makeDragableConnector($(pre.find('.item-drag').last()), drop);

            // update clone if there is any
            var clone = drop.parents('.item').data('data').clone;
            if (clone) {
              if (clone.data('data').containerIndex === 0) {

                clone.data('data').drops = drop.parents('.item').data('data').drops;              

              }
            }

          }

        } else {


          var path = makeConnection(drag, drop);


          // update clone if there is any
          var clone = drop.parents('.item').data('clone');
          if (clone) {
            if (clone.data('data').containerIndex === 0) {

              clone.data('data').drops = drop.parents('.item').data('data').drops;

            }
          }

        }

      } // drop
    }); // droppable
  }; // addPrecrop

  // item well
  $('.item-well').draggable({
    helper: 'clone'
  });

  // container 
  $('.container:not(.no-drop)').droppable({
    tolerance: 'fit',
    accept: '.item-well',
    create: function (event, ui) {
      // $(this).data('crops', []);
    },
    over: function (event, ui) {

    },
    out: function (event, ui) {

    },
    drop: function (event, ui) {

      if (!itemDropAllowed($(this)))
        return false;

      var containerIndex = $('.container').index($(this));
      

      var item = $(ui.draggable).clone();
      item.switchClass('item-well', 'item');
      var data = {
        crop: { name: item.data('crop') },
        containerIndex: containerIndex,
        drags: [],
        drops: [],
        clone: null,
        area: 0
      };

      item.data('data', data);
      item.appendTo(this);
      makeDragableItem(item, containerIndex, ui.offset);

      // update length of rotation
      updateRotationLength();
    }
  });

});
