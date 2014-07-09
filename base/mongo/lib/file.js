var qiniu=require("qiniu"),
	config=require("../server").config,
	formidable = require('formidable'),
	Super=require("./service");
module.exports=Super.extend({
	uptoken: function(){
		return (new qiniu.rs.PutPolicy(config.qiniu.bucket)).token()
	}
},{
	url:"/files",
	init: function(){
		Super.init.apply(this,arguments)
		qiniu.conf.ACCESS_KEY=config.qiniu.ACCESS_KEY
		qiniu.conf.SECRET_KEY=config.qiniu.SECRET_KEY
	},
	routes:{
		"get want2upload":function(req, res){
			res.send(new this(req, res).uptoken())
		},
		"post": function(req, res){
			var form=new formidable.IncomingForm({uploadDir:__dirname + '/../upload/'+config.qiniu.bucket});
			form.parse(req, (function(error, fields, files){
				if(error)
					return this.error(res)(error);
				require("fs").rename(files.file.path, form.uploadDir+"/"+fields.key, (function(error){
					if(error)
						return this.error(res)(error);
					this.send(res,{key:fields.key})	
				}).bind(this))
			}).bind(this))
		}
	}
})