/**
 *  create and update post
 *  @module Post
 */
define(['UI','app','tool/editor'],function(View, app,makeEditor){
	var FormPage=View.FormPage, Post=app.Post, Tag=app.Tag, Favorit=app.Tag
	return new (FormPage.extend({
		model:new Post,
		content:'\
			<form>\
				<fieldset><input type="text" placeholder='+text("title")+' name="title" style="text-align:center"><div class="tags"></div></fieldset>\
				<div name="content" style="min-height:1000px" class="editor" contenteditable="true" placeholder='+text("content")+'/>\
			</form>',
		cmds:'<a><span class="icon picture"/></a>\
			<a><span class="icon link-picture"/></a>\
			<a><button type="submit"><span class="icon save"/></button></a>',
		events:_.extend({},FormPage.prototype.events,{
			'click span.picture':'insertPicture',
			'click span.link-picture':'linkPicture'
		}),
		render:function(){
			this._super().render.apply(this,arguments)
			this.editor=makeEditor(this.$('form [contenteditable]').get(0))
			var tagHolder=this.$('div.tags'), t=_.template('#tmplCheckable')
			tagHolder.append(t({title:text('gender'),name:'tags',type:'checkbox',options:Tag.grouped.gender}))
			tagHolder.append(t({title:text('duration'),name:'duration',type:'radio',options:Tag.grouped.duration}))
			tagHolder.append(t({title:text('goal'),name:'tags',type:'checkbox',options:Tag.grouped.goal}))
			return this
		},
		setModel: function(m){
			this._super().setModel.apply(this,arguments)
			if(this.model.has('title'))
				this.$('form input[name=title]').val(this.model.get('title'))

			if(this.model.has('tags'))
				_.each(this.model.get('tags'),function(tag){
					this.$('.checkable input[value='+tag+']').prop('checked','checked')
					},this)
			
					
			if(this.model.has('content'))
				this.editor.setContent(this.model.get('content'))
				
			if(this.model.isNew()){
				var a
				this.setTitle(text("Create New ")
					+text((a=this.model.get('category'))&&Tag.all.get(this.model.get('category')).get('name')
						||'Theme'))
			}else
				this.setTitle(text("Update"))
			return this
		},
		show: function(id,categoryName){
			var me=this
			switch(arguments.length){
			case 1:
				if(this.model.isNew())
					break
				this.setModel(new Post())
				break
			case 2:
				if(_.isObject(id))
					this.setModel(id)
				else{
					var model=new Post({id:parseInt(id)})
					model.fetch()
						.then(_.bind(function(){this.setModel(model)},this))
				}
				break
			case 3:
				this.setModel(new Post({
					tags:_.chain(['Boy','Girl','30','Learning',categoryName])
						.map(function(n){return Tag.all.findWhere({name:n}).id})
						.value(),
					category:parseInt(id),
					duration:30}))
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
			return FormPage.prototype.save.apply(this,arguments)
		},
		change: function(e){
			var el=e.target
			switch(el.name){
			case 'duration':
				el.checked && this.model.set('duration',parseInt(el.value))
			case 'tags':
				this.model[el.checked ? 'addUnique' : 'remove']('tags',parseInt(el.value))
				break
			default:
				FormPage.prototype.change.apply(this,arguments)
			}
		},
		clear:function(){
			$(this.editor).empty()
			return this._super().clear.apply(this,arguments)
		}
	}))
})