var plugins='',
	DEBUG=true
	
require.config({
	waitSeconds:30,
	baseUrl:'./js',
	urlArgs: "v=0.1",//+Date.now(),//VERSION,
	shim:{
		'Backbone': {
            deps: ['Underscore', 'jQuery'],
            exports: 'Backbone'
        },
        'Underscore': {
            exports: '_'
        },
		'Promise':{
			exports:'Promise'
		},
		'jQuery':{
			exports:'jQuery'
		}
	},
	paths:{
		"JSZip":"lib/jszip.min",
		"Promise":"lib/promise",
		"jQuery":"lib/jquery.min",
		"Underscore":"lib/underscore",
		"Backbone":"lib/backbone-min",
		"i18n":"lib/i18n",
		"Phonegap":"file:///android_asset/www/phonegap.js",
		
		"UI":"view/base",
		"Plugin":"lib/plugin"
	},
	deps:['jQuery','app', 'model','Promise'],
	callback:function($, app, model, Promise){
		app.route('createApp','app','view/app',true)
		app.route('settings','settings','view/app',true)
		app.route('schema','data','view/data',true)
		app.route('analytics','analytics','view/analytics',true)
		app.route('cloudcode','cloudcode','view/cloudcode',true)
		var _init=app.init
		app.init=function(){
			return _init.apply(app,arguments)
				.then(function(){
					var p=new Promise
					require(['view/menu', 'view/applist'],function(aside){
						aside[$.media=='tablet' ? 'show' : 'hide']()
						p.resolve()
					})
					return p
				})
		}
		
		$(function () {
			app.start()
		})
	}
});

define('app',['jQuery','Underscore','Promise','Backbone'],function($, _, Promise, Backbone){
	function util(){
		$.os=$.extend($.os||{},{phonegap:_.has(window,'_cordovaNative')})
		window.reject=function(p){return function(e){p.reject()}}
		Array.prototype.add=function(base,a){
			return a&&a.length ? this.concat(_.map(a.split(','),function(one){
				return base+one
			})) : this;
		}
		var _debug=console.debug
		console.debug=function(m){
			if(DEBUG)
				_debug.apply(console,arguments)
		}
		Node.prototype.remove=function(){this.parentNode.removeChild(this)}
		
		$.isOffline=function(){
			if(location.protocol.match(/^file/))
				return (Date.now()-$.isOffline.lastCheckAt)<5000
			return false
		}
		
		//check offline status
		$.isOffline.lastCheckAt=0
		var _$ajax=$.ajax,
			fallback=function(e){
				if(e.status==0)
					$.isOffline.lastCheckAt=Date.now()
			}
		$.ajax=function(options){
			if(options.error){
				var _error=options.error
				options.error=function(xhr){
					fallback(xhr)
					_error.apply(this,arguments)
				}
			}else
				options.error=fallback
			return _$ajax.apply(this,arguments)
		}
		
		//extend _.template
		_.templateSettings = {
			evaluate    : /<%([\s\S]+?)%>/g,
			interpolate : /\{\{([\s\S]+?)\}\}/g,
			escape      : /\{\{\{([\s\S]+?)\}\}\}/g
		  };
		
		var _template=_.template, templates={}
		_.template=function(text,data,setting){
			if(text.charAt(0)=='#'){
				var name=text.substr(1);
				if(!(name in templates)){
					templates[name]=_template($(text).html())
					$(text).remove()
				}
				if(data!=undefined)
					return templates[name](data,setting)
				return templates[name]
			}else
				return _template(text,data,setting)
		}
	}
	
	var app=_.extend({
		version:'0.01',
		start: function(){
			util()
			$(window).bind('resize',function(){
				if($('#media').length==0)
					$('body').append('<div id="media" class="outview"></div>')
				$.media=$('#media').width()==1 ? 'phone' : 'tablet'
				$('body').data('device',$.media)
			}).resize()
			
			require(['view/splash','i18n!nls/all'].add('Plugin!',plugins),function(splash,i18n){
				window.text=function(a, b){return  ((b=a.toLowerCase()) in i18n) ? i18n[b] : (i18n[b]=a)}
				document.title=text(document.title)
				splash.show()
				var _start=function(){
					Backbone.history.start()
					splash.remove()
				}
				app.init().then(_start,_start)
			})
		},
		init: function(){
			return Promise.as()
		},
		isLoggedIn: function(){
			return false
		},
		route: function(name, url, view, needLogin){
			router.route(url, name, function(){
				if(needLogin && !app.isLoggedIn())
					require(['view/user'],function(page){page.show('signin')})
				else{
					var args=arguments
					require([view],function(page){page.show.apply(page,args)})
				}
			})
		},
		navigate:function(url, opt){
			router.navigate(url, opt)
		}
	},Backbone.Events);
	
	//router
	var router=new Backbone.Router
	_.each([//route name, url, view name[,user]
		'main,,view/main',
		'account,account,view/user',
		'test,test,view/test',
		'features,features,view/features',
		'syncOffline,sync,view/sync,true'],function(r){
		app.route.apply(app,r.split(','))
	})
	return app
})