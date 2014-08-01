var request=require('request'),
	_=require('underscore'),
	promise=require('node-promise'),
	gDefaults={
		method:'get',
		encoding:'utf-8',
		headers:{}
	};
	
module.exports=function(){
	var defaults=_.extend({},gDefaults), AJAX={};
	defaults.headers=_.extend({},gDefaults.headers,defaults.headers||{})
	
	function initParams(uri, options, callback) {
		var opts;
		if ((typeof options === 'function') && !callback) callback = options
		if (options && typeof options === 'object') {
			opts = _.extend({},defaults,_.omit(options,"dataType,type,data".split(",")));
			opts.headers=_.extend({},defaults.headers,opts.headers||{})
			options && ajaxSetup(options,opts)
			opts.uri = uri
		} else if (typeof uri === 'string') {
			opts = _.extend({},defaults,{uri:uri})
		} else {
			opts = _.extend({}, defaults, uri);
			opts.headers=_.extend({},defaults.headers,opts.headers||{})
			uri = opts.uri
		}
		
		return { uri: uri, options: opts, callback: callback }
	}
	
	function ajaxSetup(options, target){
		target=target||defaults
		if(options.dataType=='json')
			target.json=true;
		if(options.headers)
			_.extend(target.headers,options.headers)
		if(options.type)
			target.method=options.type.toLowerCase()
		if(options.data && target.json)
			target.json=options.data
	}
	
	function _request(uri,options){
		var p=new promise.Promise()
		var params=initParams(uri,options)
		uri=params.uri
		options=params.options
		
		options.error && p.addErrback(options.error)
		delete options.error
		
		request(uri, options, function(error, response, body){
			if(error)
				p.reject(error)
			else if(response.statusCode>=400)
				p.reject(body)
			else
				p.resolve(body)
		})
		return p
	}
	
	_.each("get,delete,put,post,patch".split(','),function(key){
		this[key]=function(uri, options, callback){
			var params = initParams(uri, options, callback)
			params.options.method = key.toUpperCase()
			return _request(params.uri || null, params.options, params.callback)
		}
	},AJAX)
	
	AJAX.ajax=function(options){
		return _request(options.url,options)
	}
	
	AJAX.inspect=inspect
	AJAX.fail=fail
	AJAX.ajaxSetup=ajaxSetup
	
	jasmine.getEnv().defaultTimeoutInterval = 250;
	
	ajaxSetup({
		async:false,
		dataType:"json",
		headers:{
			"X-Application-Id":"test",
			"X-Session-Token":"test"
		},
		error: function(error){
			expect(error).toBe(null)
		}
	})
	
	AJAX.reset4All=function(host){
		return this.get(host+"/apps/reset4Test",{
			dataType:"json",
			headers:{
				"X-Application-Id":"admin",
				"X-Session-Token":"test"
			},
			error: function(error){
				expect(error).toBe(null)
			}
		})
		.then(function(result){
			expect(result.ok).toBe(1)
		})
	}
	
	return AJAX
}

function inspect(o){
	console.log(require('util').inspect(o))
}
function fail(error){
	expect(error||true).toBeUndefined()
}
	