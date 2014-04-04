define(['app','UI'],function(app,View){
	var tmplMenu='\
			<ul class="list">\
				<li><a href="#analytics" class="analytics">'+text('Analytics')+'</a></li>\
				<li><a href="#data" class="databrowser">'+text('Data Browser')+'</a></li>\
				<li><a href="#cloudcode" class="cloudcode">'+text('Cloud Code')+'</a></li>\
				<li><a href="#settings" class="settings">'+text('Settings')+'</a></li>\
			</ul>'
	var Page=View.Page, Application=app.Application
	return new (Page.extend({
		content:tmplMenu,
		events:{'click article li':'activeMenu'},
		activeMenu:function(e){
			var li=$(e.currentTarget)
			li.addClass('active')
				.siblings('.active')
				.removeClass('active')
		}
	}).asAside())
})