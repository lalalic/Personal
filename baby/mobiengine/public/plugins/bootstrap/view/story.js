define(['UI','app','tool/editor'],function(View, app, makeEditor){
	var FormPage=View.FormPage, 
		Story=app.Story, 
		Favorite=app.Favorite, 
		Post=app.Post, 
		Child=app.Child
	return new (FormPage.extend({
		content:'<form class="layout"><div name="content" data-layout="middle" class="editor" contenteditable="true" placeholder='+text("content")+'/></form>',
		cmds:'<a><span class="icon picture"/></a><a><span class="icon link-picture"/></a><a><button type="submit"><span class="icon save"/></button></a>',
		events:_.extend({},FormPage.prototype.events,{
			'click span.picture':'insertPicture',
			'click span.link-picture':'linkPicture'
		}),
		render: function(){
			this._super().render.apply(this,arguments)
			this.editor=makeEditor(this.$('form [contenteditable]').get(0))
			return this
		},
		setModel:function(){
			this._super().setModel.apply(this,arguments)
			if(!this.model)
				return this
			if(this.model.has('content'))
				this.editor.setContent(this.model.get('content'))
			this.setTitle(text(this.model.isNew() ? "Tell new story" : "Tell more story"))
			return this
		},
		show: function(post,id){
			var me=this
			switch(arguments.length){
			case 1:
				this.setModel(new Story({post:parseInt(post)}))
				break
			case 2:
				if(_.isObject(id))
					this.setModel(id)
				else{
					new Story({id:parseInt(id),post:parseInt(post)})
						.fetch()
						.then(_.bind(function(s){this.setModel(s)},this))
				}
				break
			}
			return FormPage.prototype.show.apply(this,arguments)
		},
		insertPicture:function(){
			this.editor.insertImage()
		},
		linkPicture: function(){
			this.editor.linkImage()
		},
		save: function(){
			var thumb=this.editor.getThumb()
			thumb && this.model.set('thumbnail',thumb)
			this.model.set('content',this.editor.getContent())
			this.model.set('child',Child.current().id)
			this.model.set('childName',Child.current().get("name"))
			return FormPage.prototype.save.apply(this,arguments)
		},
		setDefault: function(){
			$(this.editor).empty()
			return this._super().setDefault.apply(this,arguments)
		}
	}))
})