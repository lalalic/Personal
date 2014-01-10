define(['doc/openxml/docx/editor/style/base'],function(PrStyle){
	return PrStyle.extend({
		tblStyle: function(e){
			this.setStyleName(e)
		}
	})
})