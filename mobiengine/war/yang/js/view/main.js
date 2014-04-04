define(['UI','Underscore'],function(UI, _){
	var Page=UI.Page
	return new (Page.extend({
		content:_.template('#tmplEmpty')({
				type:'user',
				title:text('Empty'),
				description:text('Signin'),
				action:'<button class="anchor">signin</button>'})
	}))
})