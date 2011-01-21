$(document).ready(function(){

  if(!("WebSocket" in window)) {
    alert("I'm afraid your browser does not support WebSockets.\nTry the latest build of Chrome.");
    return;
  }
 
  // This is my user level GET advanced api key
  var api_key = "Sgu3QtSJAYrmLCRyjh9VUO1enKCnLyTnbDaEb5rrzW0";
  var feed_id = "9796";
  var content = $('#content');
  // var feed_id = "15321";

  function initialLoad(feed_id, api_key) {
    $.ajax({
      url: "http://api.pachube.com/v2/feeds/" + feed_id + ".json?api_key=" + api_key,
      success: function(data) {
        console.log(data.title);
        content.append("<h1>" + data.title + "</h1>");
        content.append("<h2>" + data.website + "</h2>");
      },
      dataType: 'jsonp'
      });
  }
 
  function subscribe(ws, feed_id, api_key) {
    ws.send('{"command":"subscribe", "resource": "/feeds/' + feed_id + '/#", "api_key": "' + api_key + '"}');
  }

  initialLoad(feed_id, api_key);

  // Use the Pachube beta websocket server
  ws = new WebSocket("ws://beta.pachube.com:8080/");    

  ws.onerror = function(evt) {
    alert("Could not open WebSocket connection");
  }
  ws.onopen = function(evt) {

    $('#connect').click(function () {
      console.log('connect');
      subscribe(ws, feed_id, api_key);
    });
  }

  ws.onmessage = function(evt) {
    data = evt.data;
    content.append("<br />" + data);
  }
    
});

