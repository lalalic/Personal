define(['app','UI'],function(app,View){
	var Page=View.Page, Application=app.Application
	return new (Page.extend({
		content:_.template('#tmplMenu',this),
		events:{'click article li':'activeMenu'},
		activeMenu:function(e){
			var li=$(e.currentTarget)
			li.addClass('active')
				.siblings('.active')
				.removeClass('active')
		}
	}).asAside())
})