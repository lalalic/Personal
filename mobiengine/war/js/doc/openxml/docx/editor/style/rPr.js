define(['doc/openxml/docx/editor/style/base'],function(PrStyle){
	return PrStyle.extend({
		b: function(e){
			if(this.asBool(e,'w:val',true))
				this.style.fontWeight='700'
		},
		i: function(e){
			if(this.asBool(e,'w:val',true))
				this.style.fontStyle='italic'
		},
		color: function(e){
			this.style.color='#'+e.getAttribute('w:val')
		},
		rStyle: function(e){
			this.setStyleName(e)
		},
		sz: function(e){
			this.style.fontSize=parseInt(e.getAttribute('w:val'))/2.0
		}
	})
})