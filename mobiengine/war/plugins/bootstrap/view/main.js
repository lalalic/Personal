define(['UI','Underscore'],function(UI, _){
	var Page=UI.Page
	return new (Page.extend({
		cmds:'<a href="#features"><span class="icon apps"/></a>\
			<a href="#app"><span class="icon plus"/></a>',
		content:_.template('#tmplEmpty')({
				type:'user',
				title:text('App Empty'),
				description:text('Signin and create your first app'),
				action:'<button class="anchor">signin</button>'})
	}))
})