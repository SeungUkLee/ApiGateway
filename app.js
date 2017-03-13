var httpProxy = require('http-proxy');

//var port = process.env.PORT || 8200;
var port = 3000;

// all not found routes are forwarded to the devices service
var routing = {
  '/devices' : { host : 'localhost', port : 8006 },
};

var server = httpProxy.createServer(
  require('./lib/uri-middleware')(routing)
).listen(port);
