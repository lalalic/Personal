var fs = require("fs");
var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

var config = {
	"db" : {
		'port' : 27017,
		'host' : "localhost"
	},
	'server' : {
		'port' : 80,
		'https' : 443,
		'timeout' : 120,
		'address' : "0.0.0.0"
	},
	'flavor' : "regular",
	'debug' : true
};

try {
	config = JSON.parse(fs.readFileSync(process.cwd() + "/config.json"));
} catch (e) {
	// ignore
}
module.exports.config = config;

if (false && cluster.isMaster) {
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

	cluster.on('death', function (worker) {
		console.log('worker ' + worker.pid + ' died');
	});
} else {
	// Worker processes have a http server.
	var express = require('express');
	var app = module.exports.app = express();
	
	var bodyParser = require("body-parser");
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended : true}));
	app.use(require("morgan")("dev"));
	//app.use(require('cookie-session')({secret:"iamLalalic", name:"session"}));
	
	app.all("*",function(req,res,next){
		res.header({
			"Access-Control-Allow-Headers":"X-Application-Id,Request,X-Requested-With,Content-Type,Accept,X-Session-Token",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE"
		});
		next();
	});
	
	app.use("/test",express.static(__dirname+'/test'));
	
	require("./lib/user").init(app,config)
	require("./lib/role").init(app,config)
	require("./lib/app").init(app,config)
	require("./lib/plugin").init(app,config)
	require("./lib/entity").init(app,config)
	
	// Bind to a port
	app.listen(config.server.port, config.server.address);
	app.on('connection', function (socket) {
		socket.setTimeout(config.server.timeout * 1000);
		console.log("server is ready");
	});
}
