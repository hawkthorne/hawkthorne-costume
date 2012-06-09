$(document).ready(function() {
  var baseUrl = 'https://github.com/kyleconroy/hawkthorne-journey/raw/master/src/images/';

  function updateUrl() {
    if (window.history && history.pushState) {
      var character = $("#character").val();
      var costume = $("#url").val();

      var data = ({
        character: character,
        costume: costume
      })

      var url = "/" + character;

      if (costume) {
        url = url + "/" + encodeURIComponent(costume);
      }

      history.pushState(data, "Page Tile", url);
    }
  }

  function updateCostume(url) {
    if (url) {
      $("#newhotness").show();
      $("#newhotness").attr('src', url);
    } else {
      $("#newhotness").attr('src', '');
      $("#newhotness").hide();
    }
  }

  function updateOriginal(character) {
    var imgUrl = baseUrl + character + ".png";
    $("#oldbusted").attr('src', imgUrl);
  }


  $('#character').change(function(e) { 
    updateOriginal($(this).val());
    updateUrl();
  });

  $('#toolbar .costume').click(function(e) { 
    e.preventDefault();
    $("#newhotness").toggle();
  });

  var bg = "#34c429";

  $('#toolbar .bg').click(function(e) { 
    e.preventDefault();
    var temp = bg;
    bg = $("#artboard").css('background');
    $("#artboard").css('background', temp);
  });


  $('#costume').submit(function(e) { 
    e.preventDefault();
  })

  $('#url').change(function(e) {
    updateCostume($(this).val());
    updateUrl();
  });

  window.onpopstate = function(event) {  
    if (event.state) {
      $("#url").val(event.state.costume);
      $("#character").val(event.state.character);

      updateCostume(event.state.costume);
      updateOriginal(event.state.character);
    }

  }; 
});

