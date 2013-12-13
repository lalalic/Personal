define(['view/base','app','tool/editor'],function(View, app,makeEditor){
	var FormPage=View.FormPage, Post=app.Post, Tag=app.Tag, Favorit=app.Tag
	return new (FormPage.extend({
		content:'<form><fieldset><input type="text" placeholder='+text("title")+' name="title" style="text-align:center"><div class="tags"/></fieldset>\
			<div name="content" style="min-height:1000px" class="editor" contenteditable="true" placeholder='+text("content")+'/></form>',
		cmds:'<a><span class="icon picture"/></a><a><span class="icon link-picture"/></a><a><button type="submit"><span class="icon save"/></button></a>',
		events:_.extend({},FormPage.prototype.events,{
			'click span.picture':'insertPicture',
			'click span.link-picture':'linkPicture'
		}),
		initialize: function(){
			FormPage.prototype.initialize.apply(this,arguments)
			this.editor=makeEditor(this.$('form [contenteditable]').get(0))
			var tagHolder=this.$('div.tags'), t=_.template('#tmplCheckable')
			tagHolder.append(t({title:text('gender'),name:'tags',type:'checkbox',options:Tag.grouped.gender}))
			tagHolder.append(t({title:text('duration'),name:'duration',type:'radio',options:Tag.grouped.duration}))
			tagHolder.append(t({title:text('goal'),name:'tags',type:'checkbox',options:Tag.grouped.goal}))
			this.setDefault()
		},
		render: function(){
			if(this.model.has('title')){
				this.$('form input[name=title]').val(this.model.get('title'))
				this.setTitle(text("Update"))
			}
			if(this.model.has('tags'))
				_.each(this.model.get('tags'),function(tag){
					this.$('.checkable input[value="'+tag+'"]').prop('checked','checked')
					},this)
			if(this.model.has('content'))
				this.editor.setContent(this.model.get('content'))
		},
		show: function(id,categoryName){
			var me=this
			switch(arguments.length){
			case 0:
				this.model=new Post({tags:['Boy','Girl','30','Learning']})
				this.render()
				this.setTitle(text("Create New Theme"))
				break
			case 1:
				if(_.isObject(id)){
					this.model=id
					this.render()
				}else{
					this.model=new Post({id:id})
					this.model.fetch().then(function(){me.render()})
				}
				break
			case 2:
				this.model=new Post({tags:['Boy','Girl','30','Learning',categoryName],category:categoryName})
				this.render()
				this.setTitle(text("Create New ")+text(categoryName))
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
		save: function(e){
			try{
				e.preventDefault()
				var thumb=this.editor.getThumb()
				thumb && this.model.set('thumbnail',thumb)
				this.model.set('content',this.editor.getContent())
				return FormPage.prototype.save.apply(this,arguments)
			}catch(e){
			}
			return false
		},
		change: function(e){
			var el=e.srcElement
			switch(el.name){
			case 'tags':
				this.model[el.checked ? 'addUnique' : 'remove']('tags',el.value)
				break
			default:
				FormPage.prototype.change.apply(this,arguments)
			}
		},
		setDefault: function(){
			$(this.editor).empty()
		}
	}))
})