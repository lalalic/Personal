var qiniu=require("qiniu"),
	Super=require("./service");
module.exports=Super.extend({
	uptoken: function(){
		var putPolicy=new qiniu.rs.PutPolicy("mobiengine")
		return putPolicy.token()
	}
},{
	url:"/files",
	init: function(app,config){
		Super.init.apply(this,arguments)
		qiniu.conf.ACCESS_KEY=config.qiniu.ACCESS_KEY
		qiniu.conf.SECRET_KEY=config.qiniu.SECRET_KEY
	}
	routes:{
		"get want2upload":function(req, res){
			res.send(new this(req, res).uptoken())
		}
	}
})