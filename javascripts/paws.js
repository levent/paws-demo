
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
  var noChange = "~";
  var currentValues = [];
  // var feed_id = "9845";
  // var feed_id = "9854";
  // var feed_id = "9796";

  function setupDatastream(datastream) {
    currentValues[datastream.id] = datastream.current_value;
    $("#ds_" + datastream.id).html("<h3>" + datastream.tags + ":</h3>")
    $("#ds_" + datastream.id).append("<p>" + '<span class="value">' + datastream.current_value + '</span>' + " " + datastream.unit.symbol + "</p>")
    $("#retrieved_at").html(datastream.at);
  }

  function updateDatastreamViaWebSocket(data) {
    datastream = JSON.parse(data);
    if (currentValues[datastream.id] > datastream.value) {
      var change = down;
    } else if (currentValues[datastream.id] < datastream.value) {
      var change = up;
    } else {
      var change = noChange;
    }
    currentValues[datastream.id] = datastream.value;
    $("#ds_" + datastream.ds_id + " .value").html(change + datastream.value);
    $("#retrieved_at").html(datastream.retrieved_at);
  }

  function initialLoad(feed_id, api_key) {
    $.ajax({
      url: "http://api.pachube.com/v2/feeds/" + feed_id + ".json?api_key=" + api_key,
      success: function(data) {
        content.html("<h1>" + data.title + "</h1>");
        content.append("<h2>" + data.description + "</h2>");
        datastreams = data.datastreams;
        for (var i=0; i < datastreams.length; i++) {
          setupDatastream(datastreams[i], i);
        };

      },
      dataType: 'jsonp'
    });
  }
 
  function subscribe(ws, feed_id, api_key) {
    // console.log('{"command":"subscribe", "resource": "/feeds/' + feed_id + '/#", "api_key": "' + api_key + '"}');
    ws.send('{"command":"subscribe", "resource": "/feeds/' + feed_id + '/#", "api_key": "' + api_key + '"}');
  }
 
  function unsubscribe(ws, feed_id, api_key) {
    // console.log('{"command":"unsubscribe", "resource": "/feeds/' + feed_id + '/#", "api_key": "' + api_key + '"}');
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
    updateDatastreamViaWebSocket(data);
  }
    
});

