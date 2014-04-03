define(['UI','Underscore'],function(UI, _){
	var Page=UI.Page
	return new (Page.extend({
		cmds:'<a href="#applist"><span class="icon apps"/></a>\
			<a href="#app"><span class="icon plus"/></a>',
		content:_.template($('#tmplNoApp').html())({})
	}))
})