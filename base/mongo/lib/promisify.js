var Promise=require("node-promise").Promise,
	_=require("underscore");
var promisify=module.exports=function (_raw){
	return function(){
		var args=_.without(_.toArray(arguments),undefined),
			p=new Promise(),
			callback=args.length && _.isFunction(args[args.length-1]) ? args.pop() : null;

		args.push(function(error, result){
			if(error!=null)
				p.reject(error)
			else if(result!=null)
				p.resolve(result)
			callback && callback(error, result)
		})
		_raw.apply(this,args)
		return p
	}
}

_.mixin({
	aop:function(f,wrap){return wrap(f)},
});

var mongo=require("mongodb");
_.each("open,authenticate,close,collection".split(','),function(f){
	this[f]=_.aop(this[f], promisify)
},mongo.Db.prototype);

_.each("insert,remove,save,update, findOne, findAndModify,findAndRemove".split(","),function(f){
	this[f]=_.aop(this[f], promisify)
},mongo.Collection.prototype);

_.each("toArray,nextObject,count".split(","),function(f){
	this[f]=_.aop(this[f], promisify)
},mongo.Cursor.prototype);
