define(['doc/document'],function(Document){
	$('body').append('<style>\
		.dropfile{\
				opacity:0.5;\
				background-color:white;\
				background-repeat:no-repeat;\
				background-position:50% 100px;\
				background-image:url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNgekQBo9ZFYe96DW397oR_t7E0D24SbgiiSc2X892vOCfMNEn)\
			}\
	</style>');
	return Backbone.View.extend({
		exports:{},
	},{
		editable:function(){
			return false
		},
		collectModel:function(args){
			var classes=_styleClass.split(','),
				start=args.length-classes.length
			_.each(_styleClass.split(','),function(name,i){
				this[name]=args[start+i]
			},this.prototype.STYLE={})
			
			classes=_editorClass.split(',')
			start=start-classes.length
			_.each(classes,function(name,i){
				this[name]=args[start+i]
			},this.prototype.MODEL={})
			return this
		},
		create:function(doc,el){
			var p=new Promise
			require(EDITORS,function(){
				for(var i=0,len=arguments.length,EDITOR;i<len;i++){
					if((EDITOR=arguments[i]).editable(doc))
						p.resolve(new EDITOR({model:doc,el:el}))
				}
			})
			return p
		},
		avoidObserve:function(f){
			f()
		}
	})
})