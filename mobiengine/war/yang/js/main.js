/**
 *  it's a standard requireJS configuration, which is loaded by require.js with data-main in html file as following
 *  <br>
 *  <br><b>&lt;script data-main="js/main" src="js/lib/require.js"&gt;&lt;/script&gt;</b>
 *  <p>
 *  The application at least requires third-party modules <a href="http://jquery.com">jQuery</a>, 
 *  <a href="http://underscorejs.org">Underscore</a>, and <a href="backbonejs.org">Backbone</a>, and internal modules {@link module:app}
 *  </p>
 *  @module requireJSConf
 *  @requires jQuery
 *  @requires Underscore 
 *  @requires Backbone 
 *  @requires JSZip 
 *  @requires app
 *  @example
 *  //callback is the entry point, you have to call app.start when dom ready
 *  require.config({
 *  	deps:['jQuery', 'app'],
 *  	callback:function($, app){
 *  		//first, add routes
 *			app.route('createApp','app','view/app',true)
 *			
 *			//second, other customization stuff, such as extend app.init, app.init4User, and etc
 *			
 *			//last, start application with <b>your apiKey</b> when dom ready
 *			$(function(){
 *				app.start({apiKey:'your key here'})
 *			})
 *  	}
 *  })
 */
require.config(/** @lends requireJSConf*/{
	baseUrl:'./js',
	config:{
		Plugin:{
			root:"../../plugins/",//use path replative to ./js
			zipped:false
		}
	},
	deps:['jquery','app'],
	callback: function($, app){
		//start application
		$(function () {app.start()})
	},
	shim:{
		jasmine:{
			exports:'jasmine'
		},
		Phonegap: {
			exports: '_cordovaNative',
			init:function(){
				$.os=$.extend($.os||{},{phonegap:true})
				
				$.isOffline=function(){
					if(location.protocol.match(/^file/))
						return (Date.now()-$.isOffline.lastCheckAt)<5000
					return false
				}
				
				//check offline status
				$.isOffline.lastCheckAt=0
				$.ajax=$.aop($.ajax,function(_raw){
					return function(url,options){
						options=$.isString(url) ? $.extend(options||{},{url:url}) : url
						return _raw.call(this,$.extend(options,{
								error: $.aop(options.error,function(_error){
									return function(xhr){
										xhr.status==0 && ($.isOffline.lastCheckAt=Date.now())
										_error && _error.apply(this,arguments)
									}
								})
							}))
					}
				})
			}
		}
	},
	paths:{
		JSZip:"libs/jszip.min",
		jquery:"libs/jquery-2.1.0.min",
		i18n:"libs/i18n",
		Text:"libs/text",
		jasmine:"libs/jasmine",
		
		Backbone:"libs/backbone-min",
		underscore:"libs/underscore-min",
		Phonegap:"file:///android_asset/www/phonegap.js",
		
		app:"core/app",
		UI:"core/UI",
		Plugin:"core/Plugin",
		specs:"core/specs"
	},
	waitSeconds:30,
	urlArgs: "v=0.1"
});

/**
 * @module requireJS
 * @see {@link http://requirejs.org}
 */

/**
 * @module jQuery
 * @see {@link http://jquery.com}
 */
 
/**
 * @module Backbone 
 * @see {@link http://backbonejs.org}
 */
 
/**
 * @module Underscore 
 * @see {@link http://underscorejs.org}
 */

/**
 * @module JSZip 
 * @see {@link http://stuk.github.io/jszip}
 */ 