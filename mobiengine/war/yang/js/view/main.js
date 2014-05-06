define(['UI','i18n!nls/all'],function(UI,i18n){
	var Page=UI.Page
	return new (Page.extend({
		content:_.template('#tmplEmpty')({
				type:'user',
				title:i18n('Empty'),
				description:i18n('Signin'),
				action:'<button class="anchor">signin</button>'})
	}))
})