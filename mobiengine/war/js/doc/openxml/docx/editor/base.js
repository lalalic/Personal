define(function(){
	return Backbone.View.extend({
		constructor: function(opt,editor,parent){
			this.editor=editor
			this.parent=parent
			Backbone.View.apply(this,arguments)
			if(this.el.parentNode==null){
				//this.$el.attr('id',this.model.cid)
				this.parent.$el.append(this.el)
			}
			if(undefined===this.el.editor)
				this.el.editor=this
		},
		render:function(){
			this.convertStyle()
			this.model.iterate(function(child){
				this.editor.factory(child,this).render()
			},this)
		},
		convertStyle:function(){
		},
		remove:function(){
			this.model.$xml.remove()
		}
	})
})