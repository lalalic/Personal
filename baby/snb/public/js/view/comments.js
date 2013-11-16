define(['view/base','app'],function(View, app){
	var ListPage=View.ListPage, Comment=app.Comment
	return new (ListPage.extend({
		title:'Comments',
		cmds:'<a><form id="_comment"><textarea name="content" style="height:46px;padding:5px;width:100%;margin:0" placeholder="How do you like?"/></form></a><button form="_comment"><span class="icon save"/></button>',
		events:_.extend({},ListPage.prototype.events,{
			'submit form':'save'
		}),
		itemTemplate:'#tmplComment',
		collection:new (Parse.Collection.extend({model:Comment})),
		show: function(id){
			this.post=id
			this.setQuery((new Parse.Query(Comment))
				.equalTo('post',id)
				.ascending('createdAt'))
			return ListPage.prototype.show.apply(this,arguments)
		},
		save: function(){
			var me=this
			new Comment({content:this.$('form textarea').val(),post:this.post})
				.save()
				.then(function(newComment){
					me.$('form textarea').val("")
					me.collection.add(newComment)
				})
			return false
		}
	}))
})