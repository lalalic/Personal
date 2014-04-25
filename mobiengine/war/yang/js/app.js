/**
 * it's an application singleton instance
 * @namespace app
 * @requires jQuery
 * @requires Underscore 
 * @requires Backbone 
 */
define(['module','jQuery','Underscore','Backbone'], function(module){
	(function(){
		$.os=$.extend($.os||{},{phonegap:_.has(window,'_cordovaNative')})
		window.reject=function(p){return function(e){p.reject()}}
		/**
		 * the built-in Array class 
		 * @external Array
		 */
		/**
		 *  shortcut to create model requires array for models in a parent folder
		 *  @function external:Array.prototype.add
		 *  @param {string} parent directory
		 *  @param {string} relative module names seperated by comma
		 *  @example
		 *  //the result is ["jQuery","Backbone", "pluginA/module1", "pluginA/module2"]
		 *  ["jQuery","Backbone"].add('pluginA/','module1,module2')
		 */
		Array.prototype.add=function(base,a){
			return a&&a.length ? this.concat(_.map(a.split(','),function(one){
				return base+one
			})) : this;
		}
		/**
		 * the built-in Date
		 * @external Date
		 */
		/**
		 *  format date smartly as "10 seconds/minutes/hours ago"/yesterday/2000-10-10
		 *  @function external:Date.prototype.toSmartString
		 */
		Date.prototype.toSmartString=function(){
			var now=new Date(),
				delta=parseInt((now.getTime()-this.getTime())/1000),
				aday=24*60*60
			if(delta<aday){
				if(delta<60)
					return -delta+"s"
				else if(delta<60*60)
					return -parseInt(delta/60)+"m"
				else
					return -parseInt(delta/60/60)+"h"
			}else if (delta<aday*2)
				return text('yesterday')
			else{
				var n
				switch((n=now.getFullYear()-this.getFullYear())){
				case 0:
					if(now.getMonth()==this.getMonth())
						return (this.getDate()-now.getDate())+"d"
					return (this.getMonth()+1)+"-"+(this.getDate()+1)
				default:
					return -n+"y"
				}
			}
		}
		
		/**
		 *  format date as YYYY-mm-dd H:m
		 *  @function external:Date.prototype.toString
		 */
		Date.prototype.toString=function(){
			return this.toSmartString()
		}
		Date.regFrom=/[-\s+:T\.\+]/
		/**
		 *  parse string (YYYY[-mm[-dd[[\s+T]H[:m[:s[.xx[+xxx]]]]]]]) to date
		 *  @function external:Date.from
		 *  @param {string}
		 */
		Date.from=function(s,d){
			var date=new Date()
			switch((d=s.split(Date.regFrom)).length){
			case 8:
			case 7:
				date.setSeconds(parseInt(d[6]))
			case 6:
				date.setSeconds(parseInt(d[5]))
			case 5:
				date.setMinutes(parseInt(d[4]))
			case 4:
				date.setHours(parseInt(d[3]))
			case 3:
				date.setDate(parseInt(d[2]))
			case 2:
				date.setMonth(parseInt(d[1]))
			case 1:
				date.setYear(parseInt(d[0]))
				break
			default:
				throw s +" is illegal date"
			}
			return date
		}
		
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
		_.template=function(text,data,setting){//make template support id selector
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
		
		_.mixin({
			aop:function(f,wrap){return wrap(f)},
			newClass: function (constructor, properties, classProperties) {
				_.extend(constructor.prototype, Backbone.Events, properties)
				_.extend(constructor, classProperties)
				return constructor;
			}
		})
		
		/**
		 *  shortcut to get a Model super class
		 *  <br><b>Backbone.View</b> and <b>Backbone.Collection</b> have the same function
		 *  @function external:Backbone.Model.prototype._super
		 */
		Backbone.View.prototype._super=
		Backbone.Collection.prototype._super=
		Backbone.Model.prototype._super=function(a){
			if(this.__proto__==this.__proto__.constructor.__super__)
				throw "no _super on this class";
			return this.__proto__.constructor.__super__
		}
	})();
	
	define('specs',[],['spec/plugin','spec/tool/uploader','spec/tool/offline']);
	var router=new Backbone.Router
	return _.extend(/** @lends app*/{
			/**
			* application title shown as title of page
			*/
			title:'Application',
			id:'mobiengine',
			version:'0.01',
			/**
			 *  application public key distributed by service provider
			 *  @type {string}
			 *  @example 
			 *  app.start({apiKey:"xxx"})
			 */
			apiKey:'default',
			/**
			 *  Plugins which should be loaded before application starts
			 *  @type {string}
			 *  @example 
			 *  //pluginA, PluginB, and pluginC must be loaded before application starts
			 *  app.start({plugins:"pluginA,pluginB,pluginC"})
			 */
			plugins:'starter',
			/**
			 *  debug switch
			 *  @type {boolean}
			 *  @example 
			 *  app.start({debug:true})
			 */
			debug:false,
			/**
			 *  aside UI model name, which would be loaded automatically when start app
			 *  @type {string}
			 *  @example
			 *  app.start({asideView:'view/aside'})
			 */
			asideView:false,
			/**
			 *  shortcut UI model name, which would be loaded automatically when starts app. shortcut UI is usually a list shown when click top-right user icon, which usually can be seen for signed-in user.
			 *  @type {string}
			 *  @example
			 *  app.start({shortcutView:'view/friendlist'})
			 */
			shortcutView:false,
			/**
			 *  it's whole application entry point. It would load depended plugins, and creates routes, then start UI
			 *  @param {object} configuration of application
			 *  @default false
			 *  @example 
			 *  app.start({
			 *  	apiKey:"",
			 *  	debug: true,
			 *  	plugins:"pluginA,pluginB,pluginC",
			 *  	author: "null tech"
			 *  })
			 */
			start: function(opt){
				$(window).bind('resize',function(){
					if($('#media').length==0)
						$('body').append('<div id="media" class="outview"></div>')
					$.media=$('#media').width()==1 ? 'phone' : 'tablet'
					$('body').data('device',$.media)
				}).resize()
				
				_.each([//route name, url, view name[,user]
					'main,,view/main',
					'account,account,view/user',
					'test,test,view/test',
					'features,features,view/features',
					'syncOffline,sync,view/sync,true'],function(r){
					this.route.apply(this,r.split(','))
				},this)
				
				var app=this
				
				console.debug=_.aop(console.debug,function(_debug){
					return function(m){
						app.debug && _debug.apply(console,arguments)
					}
				})
				
				require(['view/splash','i18n!nls/all'].add('Plugin!',this.plugins),_.bind(function(splash,i18n){
					_.extend(this,module.config(),opt||{})
					/**
					 * translate string to local string
					 * @global
					 */
					window.text=function(a, b){
						return  a ? (((b=a.toLowerCase()) in i18n) ? i18n[b] : (i18n[b]=a)) : ''
					}
					this.title=document.title=text(this.title)
					
					_.extend(localStorage,{
						setItem:_.aop(localStorage.setItem,function(_raw){
							return function(a,b){
								_raw.call(this, app.id+'/'+app.apiKey+'/'+a, b)
							}
						}),
						getItem: _.aop(localStorage.getItem,function(_raw){
							return function(a){
								return _raw.call(this,app.id+'/'+app.apiKey+'/'+a)
							}
						})
					})
					
					this.startUI(splash)
				},this))
			},
			/**
			 *  startUI
			 */
			startUI: function(splash){
				splash.show()
				var _start=function(){
						Backbone.history.start()
						splash.remove()
					},
					p=this.init()

				this.asideView && (p=p.then(_.bind(function(){
					var p=new $.Deferred()
					require([this.asideView],function(aside){
						aside[$.media=='tablet' ? 'show' : 'hide']()
						p.resolve()
					})
					return p
				},this)))
				
				
				this.shortcutView && (p=p.then(_.bind(function(){
					var p=new $.Deferred()
					require([this.shortcutView],function(){
						p.resolve()
					})
					return p
				},this)))
				
				p.then(_start,_start)
			},
			/**
			 *  initialize application
			 *  @protected
			 *  @returns {Promise}
			 */
			init: function(){
				return $.when(this)
			},
			/**
			 *  @method
			 */
			isLoggedIn: function(){
				return true
			},
			
			logout: function(){
				
			},			
			/**
			 *  add UI route
			 *  @param {string} name - route name
			 *  @param {string} url - hash part without #
			 *  @param {string} view - view module name
			 *  @param {boolean} needLogin - show login page if true and isLoggedIn returns false
			 */
			route: function(name, url, view, needLogin){
				router.route(url, name, _.bind(function(){
					if(needLogin && !this.isLoggedIn())
						require(['view/user'],function(page){(page['prototype'] ? new page() : page).show('signin')})
					else{
						var args=_.toArray(arguments)
						args[args.length-1]==null && args.pop()
						require([view],function(page){(page=(page['prototype'] ? new page() : page)).show.apply(page,args)})
					}
				},this))
			},
			
			/**
			 *  navigate to a url
			 *  @param {string} url - hash without #
			 *  @param {object} opt - {@link Backbone.Route#navigate}
			 */
			navigate:function(url, opt){
				router.navigate(url, opt)
			}
		},Backbone.Events)
})