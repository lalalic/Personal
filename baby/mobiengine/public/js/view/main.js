define(['UI','Underscore'],function(UI, _){
	var Page=UI.Page
	return new (Page.extend({
		title:document.title
	}))
})