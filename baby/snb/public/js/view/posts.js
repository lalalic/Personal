define(['view/base','app'],function(View,app){
	var ListPage=View.ListPage, Post=app.Post
	return new (ListPage.extend({
		itemTemplate:'#tmplPosts',
		cmds:'<a href="#create"><span class="icon plus"/></a><a href="#share"><span class="icon share"/></a>',
		collection:new (Parse.Collection.extend({model:Post})),
		show:function(catId, catName){
			ListPage.prototype.show.apply(this,arguments)
			this.setQuery((new Parse.Query(Post)).equalTo('category',catName).ascending('createdAt'))
			this.$('footer .plus').parent().attr('href','#create/'+catId+"/"+catName)
			this.setTitle(catName)
			return this
		}
	}))
})