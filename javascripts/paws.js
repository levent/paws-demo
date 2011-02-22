$(document).ready(function(){

  if(!("WebSocket" in window)) {
    alert("I'm afraid your browser does not support WebSockets.\nTry the latest build of Chrome.");
    return;
  }
 
  // This is a read-only api key
  var api_key = "Sgu3QtSJAYrmLCRyjh9VUO1enKCnLyTnbDaEb5rrzW0";
  var feed_id = document.location.hash.substring(1);
  var content = $('#content');
  var up = "↑";
  var down = "↓";
  var noChange = "→";
  var currentValues = [];
  var currentGraphs = [];
  
  function formatTimestamp(ts) {
    return(ts.replace(/(\..{6}Z)$/, "").replace("T", " "));
  }

  // Called the first time a datastream is setup
  function setupDatastream(datastream) {
    currentValues[datastream.id] = datastream.current_value;
    if ($("#ds_" + datastream.id).length == 0) {
      $('<div id="ds_' + datastream.id + '" class="datastream"></div>').appendTo('section#main');
    }
    $("#ds_" + datastream.id).html("<h5>" + datastream.tags + ":</h5>");
    if (datastream.unit) {
      var symbol = datastream.unit.symbol;
    } else {
      var symbol = "";
    }
    $("#ds_" + datastream.id).append("<p>" + '<span class="value">' + datastream.current_value + '</span>' + " " + symbol + "</p>");
  }

  // This method every time PAWS receives new information about a feed
  //   Updates the datastreams
  function updateDatastreamsViaWebSocket(data) {
    datastreams = data.body.datastreams;
    for (var i=0; i < datastreams.length; i++) {
      datastream = datastreams[i];
      if (currentValues[datastream.id] > datastream.current_value) {
        var change = down;
      } else if (currentValues[datastream.id] < datastream.current_value) {
        var change = up;
      } else {
        var change = noChange;
      }
      var oldValue = currentValues[datastream.id];
      currentValues[datastream.id] = datastream.current_value;
      currentGraphs[datastream.id] = (Math.abs(Math.round((datastream.current_value / (datastream.max_value - datastream.min_value)) * 100)));
      $("#ds_" + datastream.id + " .value").html(change + ' <span class="old_value">' + oldValue + '</span> ' + datastream.current_value);
      $("#ds_" + datastream.id).append('<div style="float:left;background-color:black;width:10px;height:' + currentGraphs[datastream.id] + 'px">&nbsp;</div>');
    }
    $("#retrieved_at").html(formatTimestamp(data.body.updated)).effect("highlight", {}, 3000);
  }

  // Use the standard Pachube API to load the initial feed information
  function initialLoad(feed_id, api_key) {
    $.ajax({
      url: "http://api.pachube.com/v2/feeds/" + feed_id + ".json?api_key=" + api_key,
      success: function(data) {
        $("#feed_description").html('<h3 class="title">' + data.title + ' <a href="http://www.pachube.com/feeds/' + feed_id + '">☞</a></h3>');
        if (data.description != undefined) {
          $("#feed_description").append("<h4>" + data.description + "</h4>");
        }
        datastreams = data.datastreams;
        for (var i=0; i < datastreams.length; i++) {
          setupDatastream(datastreams[i], i);
        };
        $("#last_update").show();
        $("#retrieved_at").html(formatTimestamp(data.updated));
      },
     dataType: 'jsonp'
    });
    if ($("header#content h3.title").length == 0) {
      $("#feed_description").html($('<p class="error">We couldn\'t load Pachube feed: "' + feed_id + '"</div>'));
    }
  }
 
  // Request to subscribe for any updates to a particular feed
  // The socket server accepts various methods (get, put, post, subscribe, unsubscribe)
  function subscribe(ws, feed_id, api_key) {
    ws.send('{"headers":{"X-PachubeApiKey":"' + api_key + '"}, "method":"subscribe", "resource":"/feeds/' + feed_id + '"}');
  }
 
  function unsubscribe(ws, feed_id, api_key) {
    ws.send('{"headers":{"X-PachubeApiKey":"' + api_key + '"}, "method":"unsubscribe", "resource":"/feeds/' + feed_id + '"}');
  }

  // Connect to PAWS
  ws = new WebSocket("ws://beta.pachube.com:8080/");

  ws.onerror = function(evt) {
    alert("Could not open WebSocket connection");
  }
  
  ws.onopen = function(evt) {
    $('.weather_station').click(function (link) {
      old_url = document.location.hash.substring(1);
      unsubscribe(ws, old_url, api_key);
      feed_id = link.currentTarget.hash.substring(1);
      subscribe(ws, feed_id, api_key);
      initialLoad(feed_id, api_key);
    });
    $('#load_feed_form').submit(function(form) {
      old_url = document.location.hash.substring(1);
      feed_id = $("input#feed_id").val();
      document.location.hash = feed_id;
      unsubscribe(ws, old_url, api_key);
      $(".datastream").remove();
      subscribe(ws, feed_id, api_key);
      initialLoad(feed_id, api_key);
      return false;
    });
    if (feed_id) {
      subscribe(ws, feed_id, api_key);
      initialLoad(feed_id, api_key);
    }
    if ($('input#feed_id')) {
      $('input#feed_id').focus();
    }
  }

  // This event handler will receive the message from PAWS and update the page
  ws.onmessage = function(evt) {
    data = evt.data;
    response = JSON.parse(data);
    if (response.body) {
      updateDatastreamsViaWebSocket(response);
    }
  }
  
});

