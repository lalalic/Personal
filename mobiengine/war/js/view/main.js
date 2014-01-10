define(['view/base'],function(View){
	var Page=View.Page
	return new (Page.extend({
		title:text("Mobile Engine"),
		cmds:'<a href="#applist"><span class="icon apps"/></a>\
			<a href="#app"><span class="icon plus"/></a>'
	}));
})