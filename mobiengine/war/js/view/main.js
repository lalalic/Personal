define(['UI'],function(UI){
	var Page=UI.Page
	return new (Page.extend({
		title:text("Mobile Engine"),
		cmds:'<a href="#applist"><span class="icon apps"/></a>\
			<a href="#app"><span class="icon plus"/></a>'
	}));
})