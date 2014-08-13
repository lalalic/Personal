var Super=require("./entity")
module.exports=Super.extend({
	kind:"logs",
	clear: function(){
		
	}
},{
	url:"/logs",
	routes:{
		"get reset4Test": Super.routes['get reset4Test'],
		"get :id?" : Super.routes["get :id?"],
		"get dump" : function(req, res){
			new this(req,res).dump()
			.then(function(m){
				this.send(res,m)
			}.bind(this), this.error(res))
		},
		"post clear" : function(req, res){
			new this(req, res).clear()
			.then(function(m){
				this.send(res,m)
			}.bind(this), this.error(res))
		}
	}
})