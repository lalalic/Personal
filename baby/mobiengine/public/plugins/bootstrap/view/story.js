define(['UI','app','tool/editor','i18n!../nls/i18n'],function(UI, app, makeEditor,i18n){
	var Story=app.Story, 
		Favorite=app.Favorite, 
		Post=app.Post, 
		Child=app.Child
	return UI.FormPage.extend({
		content:'<form class="layout"><div name="content" data-layout="middle" class="editor" contenteditable="true" placeholder='+i18n("content")+'/></form>',
		cmds:'<a><span class="icon picture"/></a><a><span class="icon link-picture"/></a><a><button type="submit"><span class="icon save"/></button></a>',
		events:_.extend({},UI.FormPage.prototype.events,{
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
			this.setTitle(i18n(this.model.isNew() ? "Tell new story" : "Tell more story"))
			return this
		},
		show: function(post,id){
			var me=this
			if(id){
				if(_.isObject(id))
					this.setModel(id)
				else{
					new Story({id:parseInt(id),post:parseInt(post)})
						.fetch()
						.then(_.bind(function(s){this.setModel(s)},this))
				}
			}else
				this.setModel(new Story({post:parseInt(post)}))
			return this._super().show.apply(this,arguments)
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
			return this._super().save.apply(this,arguments)
		},
		setDefault: function(){
			$(this.editor).empty()
			return this._super().setDefault.apply(this,arguments)
		}
	})
})