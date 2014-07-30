var VERSION=require('./service').version,
	_=require("underscore"),
	services={users:'user',roles:'role',plugins:'plugin',classes:'entity'}
/*
	ajax({
		url:"",
		type:"",
		data:"",
		context:false,
		beforeSend: function(xhr, settings){},
		success: function(data,status,xhr){},
		complete: function(xhr, status){},
		error: function(xhr, status, error){}
	})
*/
module.exports= function(app){
	function ajax(options){
		var xhr={
				settings:options,
				response:null,
				status:null
			},
			method=(options.type||'get').toLowerCase(),
			url=require('url').parse(options.url),
			path=url.pathname,
			info=path.split("/"),
			i=info.indexOf(VERSION),
			kind=info[++i],
			Service=require('./'+services[kind]),
			service=new Service(app),
			data=options.data && (_.isString(options.data) ? JSON.parse(options.data) : options.data);
		kind=='classes' && (service.kind=info[++i])
		var p=null;
		switch(method){
		case 'get':
			var query={}, id=info.length-1>i ? info[++i] : null;
			url.query && _.each(decodeURI(url.query).split("&"),function(t){
				var d=t.split('=')
				this[d[0]]=d[1]
			},query)
			p=Service.prototype.get.apply(service, Service.parseQuery(id, query))
			p=p.then(function(data){return Service.afterGet(data)})
		break
		case 'post':
			p=service.create(Service.beforePost(data))
			p=p.then(function(data){return Service.afterPost(data)})
			break
		case 'put':
			p=service.update(info[++i],data)
			break
		case 'delete':
			p=service.remove(info[++i])
			break
		case 'patch':
			p=service.patch(info[++i],data)
			break
		default:
			var Promise=require('node-promise').Promise
			p=new Promise()
			p.reject(new Error("Not support "+method))
		}
		var re=service.asPromise('new');
		p.then(function(doc){
			xhr.response=doc
			xhr.status='success'
			options.success && options.success.call(options.context,doc,xhr.status,xhr);
			options.complete && options.complete.call(options.context,xhr,xhr.status);
			re.resolve(doc)
		},function(error){
			xhr.response=error
			xhr.status='error'
			options.error && options.error.call(options.context,xhr,xhr.status,error);
			options.complete && options.complete.call(options.context,xhr,xhr.status);
			re.reject(error)
		})
		return re
	}
	
	return {
		ajax:ajax,
		get: function(url,options){
			return this.ajax(_.extend({},options,{type:'get',url:url}))
		}
	}
}
