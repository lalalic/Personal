var promise=require("node-promise"),
	_=require("underscore");
	
var mongo=require("mongodb");
_.each("open,close,collection".split(','),function(f){
	this[f]=convertNodeAsyncFunction(this[f])
},mongo.Db.prototype);

_.each("insert,remove,save,update, ensureIndex".split(","),function(f){
	this[f]=convertNodeAsyncFunction(this[f])
},mongo.Collection.prototype);

_.each("toArray,nextObject,count".split(","),function(f){
	this[f]=convertNodeAsyncFunction(this[f])
},mongo.Cursor.prototype);
