var express = require('express');

var http = require('http');

var socket = require('socket.io');

var path = require('path');

var bodyParser = require('body-parser');

var bounscale = require('bounscale');

var app = express();

var server = http.createServer(app);

app.get('/', function(request, response) {
  var ua;
  console.log('request sent');
  ua = request.headers['user-agent'];
  if (/mobile/i.test(ua)) {
    console.log('mobile');
    app.use(express["static"](path.join(__dirname, '')));
    return response.sendfile(__dirname + "/mobile.html");
  } else {
    app.use(express["static"](path.join(__dirname, '')));
    response.sendfile(__dirname + "/index.html");
    return console.log('desktop');
  }
});

var port = Number(process.env.PORT || 8080);

server.listen(port, function() {
  return console.log('listening on ' + port);
});
