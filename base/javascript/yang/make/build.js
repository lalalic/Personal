({
	baseUrl:'js',
	shim:{
		Backbone: {
            deps: ['Underscore', 'jQuery'],
            exports: 'Backbone'
        },
        Underscore: {
            exports: '_'
        },
		jQuery:{
			exports:'jQuery'
		},
		jasmine:{
			exports:'jasmine'
		}
	},
	paths:{
		JSZip:"libs/jszip.min",
		jQuery:"libs/jquery-2.1.0.min",
		Underscore:"libs/underscore-min",
		Backbone:"libs/backbone-min",
		i18n:"libs/i18n",
		Text:"libs/text",
		jasmine:"libs/jasmine",
		
		Phonegap:"file:///android_asset/www/phonegap.js"
	},
	optimize:'uglify2',
	include:["UI","Plugin"],
	name:'app',
	preserveLicenseComments:false
})