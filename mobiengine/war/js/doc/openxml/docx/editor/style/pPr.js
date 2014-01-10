define(['doc/openxml/docx/editor/style/base'],function(PrStyle){
	return PrStyle.extend({
		pStyle: function(e){
			this.setStyleName(e)
		}
	})
})