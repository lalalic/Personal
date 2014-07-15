define(['app','UI','i18n!../nls/l10n'],function(app,UI,i18n){
	var tmplMenu='\
			<ul class="list">\
				<li><a href="#settings" class="settings">'+i18n('Settings')+'</a></li>\
				<li><a href="#data" class="databrowser">'+i18n('Data Browser')+'</a></li>\
				<li><a href="#cloudcode" class="cloudcode">'+i18n('Cloud Code')+'</a></li>\
				<li><a href="#plugins" class="plugins">'+i18n('Plugins')+'</a></li>\
				<li><a href="#analytics" class="analytics">'+i18n('Analytics')+'</a></li>\
			</ul>'
	var Application=app.Application
	return new (UI.Page.extend({
		content:tmplMenu,
		events:{'click article li':'activeMenu'},
		activeMenu:function(e){
			var li=$(e.currentTarget)
			li.addClass('active')
				.siblings('.active')
				.removeClass('active')
		},
		show: function(){
			if(app.isLoggedIn())
				return this._super().show.apply(this,arguments)
			else
				return this.hide()
		}
	}).asAside())
})