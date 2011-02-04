$(document).ready(function(){

  if(!("WebSocket" in window)) {
    alert("I'm afraid your browser does not support WebSockets.\nTry the latest build of Chrome.");
    return;
  }
 
  // This is my user level GET advanced api key
  var api_key = "Sgu3QtSJAYrmLCRyjh9VUO1enKCnLyTnbDaEb5rrzW0";
  var feed_id = document.location.hash.substring(1);
  var content = $('#content');
  var up = "↑";
  var down = "↓";
  var noChange = "→";
  var currentValues = [];
  // var feed_id = "9845";
  // var feed_id = "9854";
  // var feed_id = "9796";

  function setupDatastream(datastream) {
    currentValues[datastream.id] = datastream.current_value;
    $("#ds_" + datastream.id).html("<h5>" + datastream.tags + ":</h5>")
    $("#ds_" + datastream.id).append("<p>" + '<span class="value">' + datastream.current_value + '</span>' + " " + datastream.unit.symbol + "</p>")
    $("#retrieved_at").html(datastream.at);
  }

  function updateDatastreamViaWebSocket(data) {
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
      currentValues[datastream.id] = datastream.current_value;
      $("#ds_" + datastream.id + " .value").html(change + datastream.current_value);
      $("#retrieved_at").html(datastream.at);

    }
  }

  function initialLoad(feed_id, api_key) {
    $.ajax({
      url: "http://api.pachube.com/v2/feeds/" + feed_id + ".json?api_key=" + api_key,
      success: function(data) {
        content.html("<h3>" + data.title + "</h3>");
        if (data.description != undefined) {
          content.append("<h4>" + data.description + "</h4>");
        }
        datastreams = data.datastreams;
        for (var i=0; i < datastreams.length; i++) {
          setupDatastream(datastreams[i], i);
        };

      },
      dataType: 'jsonp'
    });
  }
 
  function subscribe(ws, feed_id, api_key) {
    console.log('{"headers":{"X-PachubeApiKey":"' + api_key + '"}, "method":"subscribe", "resource":"/feeds/' + feed_id + '"}');
    ws.send('{"headers":{"X-PachubeApiKey":"' + api_key + '"}, "method":"subscribe", "resource":"/feeds/' + feed_id + '"}');
  }
 
  function unsubscribe(ws, feed_id, api_key) {
    ws.send('{"command":"unsubscribe", "resource": "/feeds/' + feed_id + '/#", "api_key": "' + api_key + '"}');
  }
  // Use the Pachube beta websocket server
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
  }

  ws.onmessage = function(evt) {
    data = evt.data;
    response = JSON.parse(data);
    if (response.body) {
      updateDatastreamViaWebSocket(response);
    }
  }
    
});

