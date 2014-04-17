define(['UI','app'],function(UI, app){
	var tmplComment=''
	var Comment=app.Comment
	return new (UI.ListPage.extend({
		title:'Comments',
		cmds:'<a><form id="_comment">\
			<textarea name="content" \
				style="height:46px;padding:5px;width:100%;margin:0" placeholder="How do you like?"/></form></a>\
			<button form="_comment"><span class="icon save"/></button>',
		events:_.extend({},UI.ListPage.prototype.events,{
			'submit #_comment':'save'
		}),
		itemTemplate:_.template(tmplComment),
		collection: Comment.collection(),
		show: function(id){
			this.post=id
			return this._super().show.apply(this,arguments)
		},
		refresh:function(){
			this.collection.query
				.equalTo('post',this.post)
				.ascending('createdAt')
			return this._super().refresh.apply(this,arguments)
		},
		save: function(){
			new Comment({
				content:this.$('form textarea').val(),
				post:this.post})
				.save()
				.then(_.bind(function(newComment){
					this.$('form textarea').val("")
					this.collection.add(newComment)
				},this))
			return false
		}
	}))
})