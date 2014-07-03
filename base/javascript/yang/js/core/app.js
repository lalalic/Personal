/**
 * it's an application singleton instance
 * @namespace app
 * @requires jQuery
 * @requires Underscore 
 * @requires Backbone 
 */
define(['module','jquery','Backbone','specs'], function(module){
	(function(){
		$.extend($,{
			toArray: function(args){
				var a=[];
				for(var i=0,len=args.length;i<len;i++)
					a.push(args[i])
				return a
			},
			aop:function(f,wrap){return wrap(f)},
			aopromise: function(_raw,lenP){
				return function(){
					var p=$.Deferred(),
						args=$.toArray(arguments)
					lenP>args.length && args.splice(args.length,lenP-args.length,undefined)
					var success=args[lenP-2],fail=args[lenP-1]
					args[lenP-2]=function(a){success && success(a); p.resolve(a)}
					args[lenP-1]=function(a){fail && fail(a); p.fail(a)}
					_raw.apply(this,args)
					return p
				}
			},
			newClass: function (constructor, properties, classProperties) {
				if(!$.isFunction(constructor)){
					classProperties=properties
					properties=constructor
					constructor=function(){}
				}
				$.extend(constructor.prototype, properties||{})
				classProperties && $.extend(constructor, classProperties)
				return constructor;
			}
		})
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
			return a&&a.length ? this.concat($.map(a.split(','),function(one){
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
				return require('i18n!nls/all')('yesterday')
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

		//Promisify FileReader
		$.each('ArrayBuffer,BinaryString,DataURL,Text'.split(','),function(index,type){
			FileReader.prototype['readAs'+type]=$.aop(FileReader.prototype['readAs'+type],function(_raw){
				return function(){
					var p=$.Deferred();
					$.extend(this,{
						onloadend:$.aop(this.onloadend,function(_rawOn){
							return function(a){
								_rawOn && _rawOn.apply(this,arguments)
								p.resolve(a.target.result)
							}
						}),
						onerror: $.aop(this.onerror, function(_rawOn){
							return function(a){
								_rawOn && _rawOn.apply(this,arguments)
								p.fail(a)
							}
						})
					})
					_raw.apply(this,arguments)
					return p
				}
			})
		})
		
		function extendBackbone(){
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
			};
			
			Backbone.Model.collection=function(models, options){
				return new (Backbone.Collection.extend({model:this}))(models, options)
			};
			
			_.extend(_,{
				template: $.aop(_.template,function(_raw){
					var templates={}
					return function(text,data,setting){//make template support id selector
						if(text.charAt(0)=='#'){
							var name=text.substr(1);
							if(!(name in templates)){
								templates[name]=_raw.call(this,$(text).html())
								$(text).remove()
							}
							if(data!=undefined)
								return templates[name](data,setting)
							return templates[name]
						}else
							return _raw.apply(this,arguments)
					}
				}),
				templateSettings : {
					evaluate    : /<%([\s\S]+?)%>/g,
					interpolate : /\{\{([\s\S]+?)\}\}/g,
					escape      : /\{\{\{([\s\S]+?)\}\}\}/g
				},
				newClass: $.aop($.newClass, function(_raw){
					return function(){
						var a=_raw.apply(this,arguments)
						$.extend(a.prototype, Backbone.Events)
						a.extend=Backbone.Model.extend
						return a
					}
				})
			})
		}
		
		extendBackbone()
	})();
	
	
	
	var router=new Backbone.Router()
	return /** @lends app*/{
			/**
			* application title shown as title of page
			*/
			title:'',
			name:'mobiengine',
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
			plugins:'bootstrap',
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
				$.extend(this,module.config(),opt||{})
				
				$(window).bind('resize',function(){
					if($('#media').length==0)
						$('body').append('<div id="media" class="outview"></div>')
					$.media=$('#media').width()==1 ? 'phone' : 'tablet'
					$('body').data('device',$.media)
				}).resize()
				
				var app=this
				
				console.debug=$.aop(console.debug,function(_debug){
					return function(m){
						app.debug && _debug.apply(console,arguments)
					}
				})
				
				$.each([//route name, url, view name[,user]
					'main,,view/main',
					'account,account,view/user',
					'test,test,view/test',
					'features,features,view/features',
					'syncOffline,sync,view/sync,true'],(function(index,r){
					this.route.apply(this,r.split(','))
				}).bind(this))
				
				require(['i18n!nls/all'].add('Plugin!',this.plugins),(function(i18n){
					this.title=document.title=i18n(this.title)
					function myKey(k){return app.name+'/'+app.apiKey+'/'+k}
					$.extend(localStorage,{
						setItem:$.aop(localStorage.setItem,function(_raw){
							return function(a,b){_raw.call(this, myKey(a), b)}
						}),
						getItem: $.aop(localStorage.getItem,function(_raw){
							return function(a){return _raw.call(this,myKey(a))}
						}),
						removeItem: $.aop(localStorage.removeItem, function(_raw){
							return function(a){return _raw.call(this,myKey(a))}
						})
					})
					
					require(['view/splash'],(function(splash){
						this.startUI(splash)
					}).bind(this))
					
				}).bind(this))
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

				this.asideView && (p=p.then((function(){
					var p=new $.Deferred()
					require([this.asideView],function(aside){
						aside[$.media=='tablet' ? 'show' : 'hide']()
						p.resolve()
					})
					return p
				}).bind(this)))
				
				
				this.shortcutView && (p=p.then((function(){
					var p=new $.Deferred()
					require([this.shortcutView],function(){
						p.resolve()
					})
					return p
				}).bind(this)))
				
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
				router.route(url, name, (function(){
					if(needLogin && !this.isLoggedIn())
						require(['view/user'],function(page){new page().show('signin')})
					else{
						var args=_.toArray(arguments)
						args[args.length-1]==null && args.pop()
						require([view],function(page){
							if(page['prototype']){
								page=new page()
								page.close=$.aop(page.close, function(_raw){
									return function(){_raw.apply(this,arguments);page.remove()}
								})
							}
							page.show.apply(page,args)
							page._emptivible()
						})
					}
				}).bind(this))
			},
			
			/**
			 *  navigate to a url
			 *  @param {string} url - hash without #
			 *  @param {object} opt - {@link Backbone.Route#navigate}
			 */
			navigate:function(url, opt){
				router.navigate(url, opt)
			},
			localPath: function(){
				return this.name||""
			}
		}
})