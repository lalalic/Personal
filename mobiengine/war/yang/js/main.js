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
	deps:['jQuery', 'app'],
	callback: function($, app){
		//start application
		$(function () {app.start()})
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
		"JSZip":"http://cdnjs.cloudflare.com/ajax/libs/jszip/2.0.0/jszip",
		"jQuery":"http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.min",
		"Underscore":"http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min",
		"Backbone":"http://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min",
		"i18n":"http://cdnjs.cloudflare.com/ajax/libs/require-i18n/2.0.4/i18n",
		"text":"http://cdnjs.cloudflare.com/ajax/libs/require-text/2.0.10/text",
		"Jasmine":"http://cdnjs.cloudflare.com/ajax/libs/jasmine/2.0.0/jasmine",
		
		"Phonegap":"file:///android_asset/www/phonegap.js",
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