define(['view/base','app'],function(View,app){
	var ListPage=View.ListPage, Favorite=app.Favorite
	return new (ListPage.extend({
		title:'My Favorites',
		itemTemplate:'#tmplPostRef',
		collection: Favorite.all,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.collection.trigger('reset')
		}
	}))
})