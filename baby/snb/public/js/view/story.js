define(['view/Base','app','tool/editor'],function(View, app, makeEditor){
	var FormPage=View.FormPage, 
		Story=app.Story, Favorite=app.Favorite, Post=app.Post, Child=app.Child
	return new (FormPage.extend({
		content:'<form><div name="content" style="min-height:1000px" class="editor" contenteditable="true" placeholder='+text("content")+'/></form>',
		cmds:'<a><span class="icon picture"/></a><a><span class="icon link-picture"/></a><a><button type="submit"><span class="icon save"/></button></a>',
		events:_.extend({},FormPage.prototype.events,{
			'click span.picture':'insertPicture',
			'click span.link-picture':'linkPicture'
		}),
		initialize: function(){
			FormPage.prototype.initialize.apply(this,arguments)
			this.editor=makeEditor(this.$('form [contenteditable]').get(0))
		},
		render: function(){
			if(this.model.has('content'))
				this.editor.setContent(this.model.get('content'))
		},
		show: function(post,id){
			var me=this
			switch(arguments.length){
			case 1:
				this.model=new Story({post:post})
				this.render()
				this.setTitle(text("Tell new story"))
				break
			case 2:
				if(_.isObject(id)){
					this.model=id
					this.render()
				}else{
					this.setTitle(text("Tell more story"))
					this.model=new Story({id:id,post:post})
					this.model.fetch().then(function(){me.render()})
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
			this.model.set('child',Child.current.id)
			this.model.set('childName',Child.current.get("name"))
			return FormPage.prototype.save.apply(this,arguments)
		},
		setDefault: function(){
			$(this.editor).empty()
		}
	}))
})