define(['doc/openxml/docx/editor/style/base'],function(PrStyle){
	return PrStyle.extend({
		pgSz:function(e){
			this.style.width=this.fromWord(e.getAttribute('w:w'))+'pt'
			this.style.minHeight=this.fromWord(e.getAttribute('w:h'))+'pt'
		}
	})
})