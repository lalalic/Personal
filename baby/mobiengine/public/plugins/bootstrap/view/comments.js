define(['UI','app'],function(UI, app){
	var tmplComment='\
			<li class="thumb" id="_{{id}}">\
				<a><span class="icon user"/><br>{{get("authorName")}}</a>\
				<div>\
					<p>{{get("content")}}</p>\
					<span class="on-right">{{get("createdAt")}}</span>\
				</div>\
			</li>';
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
		show: function(kind, id){
			this.kind=kind
			this.parent=parseInt(id)
			return this._super().show.apply(this,arguments)
		},
		refresh:function(){
			this.parent && this.collection.query
				.equalTo('parent',this.parent)
				.ascending('createdAt')
				&& this._super().refresh.apply(this,arguments)
			return this
		},
		save: function(){
			new Comment({
				content:this.$('form textarea').val(),
				kind: this.kind,
				parent:this.parent})
				.save()
				.then(_.bind(function(newComment){
					this.$('form textarea').val("")
					this.collection.add(newComment)
				},this))
			return false
		}
	}))
})