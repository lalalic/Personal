define(['app','UI','i18n!../nls/l10n'],function(app,View,i18n){
	var tmplMenu='\
			<ul class="list">\
				<li><a href="#analytics" class="analytics">'+i18n('Analytics')+'</a></li>\
				<li><a href="#data" class="databrowser">'+i18n('Data Browser')+'</a></li>\
				<li><a href="#cloudcode" class="cloudcode">'+i18n('Cloud Code')+'</a></li>\
				<li><a href="#settings" class="settings">'+i18n('Settings')+'</a></li>\
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