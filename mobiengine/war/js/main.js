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
	deps:['jQuery', 'app', 'deps/text!template.html','model'],
	callback: function($, app, templates, model){
		//add routes
		app.route('createApp','app','view/app',true)
		app.route('settings','settings','view/app',true)
		app.route('schema','data','view/data',true)
		app.route('analytics','analytics','view/analytics',true)
		app.route('cloudcode','cloudcode','view/cloudcode',true)
		
		//start application
		$(function () {
			templates && $('body').append(templates)
			app.start({
				title:'Mobile Engine',
				asideView:'view/menu',
				shortcutView:'view/applist',
				apiKey:'aglub19hcHBfaWRyCgsSBF9hcHAYAQw'
			})
		})
	},
	shim:{
		'Backbone': {
            deps: ['Underscore', 'jQuery'],
            exports: 'Backbone'
        },
        'Underscore': {
            exports: '_'
        },
		'jQuery':{
			exports:'jQuery'
		}
	},
	paths:{
		"JSZip":"deps/jszip.min",
		"jQuery":"deps/jquery.min",
		"Underscore":"deps/underscore-min",
		"Backbone":"deps/backbone-min",
		"app":"deps/app",
		"i18n":"deps/i18n",
		"Phonegap":"file:///android_asset/www/phonegap.js",
		
		"UI":"view/base",
		"Plugin":"deps/plugin"
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