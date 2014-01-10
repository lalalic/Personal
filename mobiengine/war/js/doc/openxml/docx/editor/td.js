define([].add('doc/openxml/docx/editor/','base,section'),function(Editor,Section){
	return Editor.extend({
		tagName:'td',
		onAddP:Section.prototype.onAddP,
		onRemoveP:Section.prototype.onRemoveP
	})
})