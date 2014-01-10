define(['tool/editor'].add('doc/openxml/docx/editor/','base,style/sectPr,p,r,t'),
function(makeEditable,Editor,SectPr,P,R,T){
	$('body').append("<style>\
		div.section{position:relative;width:210mm;margin:10px auto;padding:2.54cm;box-shadow: 0 0 4px 4px rgba(0,0,0,0.15);background-color:white;color:black}\
		</style>")
	return Editor.extend({
		tagName:'div',
		className:'editor section',
		initialize:function(){
			Editor.prototype.initialize.apply(this,arguments)
			makeEditable(this.el)
		},
		convertStyle:function(){
			new SectPr(this.model,this.el.style,this.editor,this.el).render()
		},
		onAddP:function(changes){
			var prev=changes[0].previousSibling,
				editorP=new P({model:this.model.getChildModel("<w:p/>"),el:changes[0].addedNodes[0]},this.editor,this),
				editorR=new R({model:editorP.model.getChildModel('<w:r/>'),el:changes[1].addedNodes[0]},this.editor,editorP),
				editorT=new T({model:editorR.model.getChildModel('<w:t/>'),el:changes[2].addedNodes[0]},this.editor,editorR)
			//when first content is added to r, then add r to p later
			editorR.model.$xml.append(editorT.model.wXml)
			
			//chrome would copy previous style, so the model must be copied too
			if($(prev).is('p')){
				editorP.model.$xml.prepend(prev.editor.model.$xml.find('>pPr').clone())
				editorR.model.$xml.prepend(prev.editor.model.$xml.find('r:last rPr').clone())
			}
			prev.editor.model.$xml.after(editorP.model.wXml)
			
			this.model.trigger('content:change')
		},
		onRemoveP:function(changes){
			var p=changes[1].removedNodes[0]
			p.editor.remove()
		}
	})
})