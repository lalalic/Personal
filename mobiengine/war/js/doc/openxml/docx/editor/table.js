define(['doc/openxml/docx/editor/base','doc/openxml/docx/editor/style/tblPr'],function(Editor,TablePr){
	$('body').append("<style>\
		div.workspace table td{border:1pt solid black}\
		</style>")
	return Editor.extend({
		tagName:'table',
		convertStyle:function(){
			_.each(this.model.$('tblPr').get(),function(pr){
				new TablePr(this.model.getChildModel(pr),this.el.style,this.editor,this.el).render()
			},this)
			
			_.each(this.model.$('tblGrid').get(),function(tblGrid){
				var cols=tblGrid.children,len=cols.length, type=tblGrid.getAttribute('w:type')
				_.each(cols,function(col){
					if(type='pct')
						;
					else
						;
				},this)
			},this)
			
			
		}
	})
})