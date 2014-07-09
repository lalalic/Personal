var Super=require("./entity"),_=require('underscore');
module.exports=Super.extend({
	kind:"apps",
	beforeCreate:function(){
		return this.asPromise()
	},
	afterCreate:function(){
		return this.asPromise()
	},
	beforeUpdate:function(){
		return this.asPromise()
	},
	afterUpdate:function(){
		return this.asPromise() 
	},
	beforeDelete: function(){
		return this.asPromise()
	},
	afterDelete: function(){
		return this.asPromise()
	}
},{
	afterPost: function(doc){
		var r=Super.afterPost.call(this,doc)
		r.apiKey=this.createAppKey(r)
		return r;
	},
	afterGet: function(doc){
		if(_.isArray(doc)){
			_.each(doc, function(d){
				d.apiKey=this.createAppKey(d)
			},this)
		}else
			doc.apiKey=this.createAppkey(doc)
		return doc;
	},
	createAppKey: function(doc){
		return doc._id
	},
	resolveAppKey: function(Accesskey){
		return {_id:Accesskey||"test"}
	},
	routes:{
		"get /my/:app":1,
		"get /my/:app/bootstrap":1,
		"all /functions/:func":1
	}
})