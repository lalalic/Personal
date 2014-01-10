define(['app','view/base'],function(app,View){
	var Page=View.Page, Application=app.Application
	return new (Page.extend({
		content:_.template('#tmplMenu',this)
	}).asAside())
})