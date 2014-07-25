var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

var config = module.exports.config={
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
	qiniu:{
		ACCESS_KEY:"1o_JaGUUb8nVxRpDGoAYB9tjLT10WD7PBFVtMmVT",
		SECRET_KEY:"r2nd182ZXzuCiCN7ZLoJPFVPZHqCxaUaE73RjKaW",
		bucket:"mobiengine",
	},
	debug:true,
	autoCreateIndex:true,
	sharedModules:"underscore,backbone,node-promise,ajax".split(","),
	Internal_API:["_users,_apps,_roles,_plugins".split(",")]
};

require("./lib/cloud").support()

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
	if(config.debug){
		app.all("*",function(req,res,next){
			res.header({
				"Access-Control-Allow-Headers":"X-Application-Id,Request,X-Requested-With,Content-Type,Accept,X-Session-Token",
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods":"GET,POST,PUT,PATCH,DELETE"
			});
			next();
		})

		app.use(require("morgan")("dev"));
		
		app.use("/test",express.static(__dirname+'/test'));
		app.use("/"+config.qiniu.bucket,express.static(__dirname+'/upload/'+config.qiniu.bucket));
	}

	require("./lib/file").init()
	require("./lib/user").init()
	require("./lib/role").init()
	require("./lib/app").init()
	require("./lib/plugin").init()
	require("./lib/entity").init()
	
	app.use(express.static(__dirname+'/view'));
	
	// Bind to a port
	app.listen(config.server.port, config.server.address);
	app.on('connection', function (socket) {
		socket.setTimeout(config.server.timeout * 1000);
		console.log("server is ready");
	});
}
