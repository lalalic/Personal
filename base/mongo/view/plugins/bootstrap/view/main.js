define(['UI','i18n!../nls/l10n'],function(UI,i18n){
	return UI.Page.extend({
		cmds:'<a href="#features"><span class="icon apps"/></a>\
			<a href="#app"><span class="icon plus"/></a>',
		EMPTY:_.extend({},UI.Page.prototype.EMPTY, {
			type:'app',
			title:i18n('App Empty'),
			action:'<a href="#app" class="button anchor">'+i18n('create first app')+'</a>'
		})
	})
})