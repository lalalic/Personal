define(['doc/openxml/docx/editor/base'],function(Editor){
	return Editor.extend({
		tagName:'img',
		render: function(){
			this.convertStyle()
			this.$el.attr('src',this.model.getSrc())
		}
	})
})