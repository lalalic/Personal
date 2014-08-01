var qiniu=require("qiniu"),
	_=require('underscore'),
	config=require("../server").config,
	formidable = require('formidable'),
	Super=require("./entity");
module.exports=Super.extend({
	constructor: function(req, res){
		Super.call(this,req, res)
		this.policy={
			scope:config.qiniu.bucket,
			expires:config.qiniu.expires,
			returnBody:'{"url":"'+config.qiniu.accessURL+'/$(bucket)/$(key)"}'
		}
		/*
		if(req.query.policy)
			_.extend(this.policy,JSON.parse(req.query.policy))
		*/
		if(req.query.save){
			this.policy.callbackUrl=config.domain+"1/files";
			this.policy.callbackBody="X-Application-Id="+this.app.token+"&X-Session-Token="+this.user.token
				+"&bucket=$(bucket)&key=$(key)&name=$(fname)&size=$(fsize)&etag=$(etag)&mimeType=$(mimeType)";
		}
	},
	kind:"files",
	uptoken: function(){
		var policy=_.extend(new qiniu.rs.PutPolicy(),this.policy)
		return policy.token()
	}
},{
	url:"/files",
	init: function(){
		Super.init.apply(this,arguments)
		qiniu.conf.ACCESS_KEY=config.qiniu.ACCESS_KEY
		qiniu.conf.SECRET_KEY=config.qiniu.SECRET_KEY
	},
	beforePost: function(doc){
		var a={}
		_.each(doc.split('&'),function(p){
			var data=p.split('=')
			data.length==2 && (this[data[0]]=data[1])
		},a)
		a.size=parseInt(a.size)
		a.author=this.user
		a.createdAt=new Date()
		a._id=a.key
		return a
	},
	afterPost: function(doc){
		return {url:config.qiniu.accessURL+"/"+doc.bucket+"/"+doc.key}
	},
	isQiniuCallback:function(req){
		var auth=req.heads['Authorization']
		if(!auth) return false;
		auth=auth.split(/[:\s]/)
		if(auth.length!=3 || auth[0]!="QBox") return false;
		var accessKey=auth[1], secretData=auth[2]
		if(accessKey!=config.qiniu.ACCESS_KEY)
			return false;
		return secretData==qiniu.util.urlsafeBase64Encode(qiniu.util.hmacSha1(req.path+"\n"+req.body, config.qiniu.SECRET_KEY))
	},
	routes:{
		"get token":function(req, res){
			res.send(new this(req, res).uptoken())
		},
		"post": function(req, res){
			if(!this.isQiniuCallback(req))
				return this.error(res)("No hack");
				
			new this(req, res)
				.create(this.beforePost(req.body))
				.then(_.bind(function(doc){
					this.send(res, this.afterPost(doc))
				},this),this.error(res))
		}
	}
})