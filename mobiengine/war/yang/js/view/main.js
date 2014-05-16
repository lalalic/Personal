define(['UI','i18n!nls/all'],function(UI,i18n){
	return new UI.Page.extend({
		EMPTY:_.extend({},UI.Page.prototype.EMPTY,{
				type:'user',
				title:i18n('Empty'),
				description:i18n('Signin'),
				action:'<button class="anchor">signin</button>'})
	})
})