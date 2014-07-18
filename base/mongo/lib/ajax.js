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
	return function(options){
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
			url.query && _.each(url.query.split("&"),function(t){
				var d=t.split('=')
				this[d[0]]=d[1]
			},query)
			p=Service.prototype.get.apply(service, Service.parseQuery(id, query))
		break
		case 'post':
			p=service.create(data)
		case 'put':
			p=service.update(info[++i],data)
		case 'delete':
			p=service.delete(info[++i])
		case 'patch':
			p=service.patch(info[++i],data)
		default:
			var Promise=require('node-promise').Promise
			p=new Promise()
			p.reject(new Error("Not support "+method))
		}
		
		return p.then(function(doc){
			xhr.response=doc
			xhr.status='success'
			options.success && options.success.call(options.context,doc,xhr.status,xhr);
			options.complete && options.complete.call(options.context,xhr,xhr.status);
		},function(error){
			xhr.response=error
			xhr.status='error'
			options.error && options.error.call(options.context,xhr,xhr.status,error);
			options.complete && options.complete.call(options.context,xhr,xhr.status);
		})
	}
}
