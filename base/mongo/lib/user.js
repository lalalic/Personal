module.exports=require("./entity").extend({
	kind:"users",
	login: function(){
		
	}
},{
	routes:{
		"get /login": function(req, res){
			res.send("login")
		}
	},
	resolvSessionToken: function(token){
		return {name:"lalalic"}
	}
})