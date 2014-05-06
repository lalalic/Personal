define(['UI','i18n!../nls/l10n'],function(UI,i18n){
	var Page=UI.Page
	return new (Page.extend({
		cmds:'<a href="#features"><span class="icon apps"/></a>\
			<a href="#app"><span class="icon plus"/></a>',
		content:_.template('#tmplEmpty')({
				type:'user',
				title:i18n('App Empty'),
				description:i18n('Signin and create your first app'),
				action:'<button class="anchor">signin</button>'})
	}))
})