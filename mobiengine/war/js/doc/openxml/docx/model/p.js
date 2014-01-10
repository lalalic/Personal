define(['doc/model'], function(Model){
	return Model.extend({
		type:'p',
		ignores:{pPr:true}
	})
})