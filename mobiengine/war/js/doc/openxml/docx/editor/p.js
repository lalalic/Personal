define([].add('doc/openxml/docx/editor/','base,style/pPr,r'),
function(Editor,PPr,R){
	return Editor.extend({
		tagName:'p',
		convertStyle:function(){
			_.each(this.model.$('pPr').get(),function(pr){
				new PPr(this.model.getChildModel(pr),this.el.style,this.editor,this.el).render()
			},this)
		},
		render:function(){
			Editor.prototype.render.apply(this,arguments)
			if(!this.el.firstChild){
				new R({model:this.model.getChildModel("<w:r><w:t/></w:r>")},this.editor,this).render()
			}
		},
		onRemoveLastR:function(changes){
			this.editor.avoidObserve(_.bind(function(){
				this.$el.empty()
				new R({model:this.model.getChildModel("<w:r><w:t/></w:r>")},this.editor,this).render()
			},this))
		}
	})
})