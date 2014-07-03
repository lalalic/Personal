var Super=require("./entity");
module.exports=Super.extend({
	kind:"apps",
	afterCreate: function(doc){
		return Super.prototype.afterCreate()
			.then((function(){
				var Schema=require("./schema");
				return new Schema(doc, this.user)
					.create([require("./user").schema,
						require("./role").schema,
						require("./plugin").schema])
			}).bind(this))
	}
},{
	beforePost: function(doc){
		doc._id=doc.name;
		delete doc.name;
		return doc
	},
	afterPost: function(doc){
		var r=Super.afterPost.call(this,doc)
		r.apiKey=r._id;
		return r;
	},
	resolveAppKey: function(Accesskey){
		return {_id:Accesskey||"test"}
	}
})