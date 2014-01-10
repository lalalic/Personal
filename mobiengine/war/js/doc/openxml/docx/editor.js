var _editorClass='base,body,section,p,r,t,image,table,tr,td,styles,tblGrid,gridCol',
	_styleClass='base,style,docDefaults,rPr,pPr'
define(['doc/editor']
	.add('doc/openxml/docx/editor/',_editorClass)
	.add('doc/openxml/docx/editor/style/',_styleClass),
function(Editor, Any,Body,Section,P,R,T,Image,Table,Tr,Td,Styles,TblGrid,GridCol,
		AnyStyle,Style,DefaultStyle,RPr,PPr){
	return Editor.extend({
		initialize:function(){
			Backbone.View.prototype.initialize.apply(this,arguments)
			this.styles=this.factory(this.model.getStyles(),this)
			this.body=this.factory(this.model.getBody(),this)
			this.styleParent={}
			this.defaultStyles={}
		},
		render: function(){
			this.styles.render()
			this.body.render()
		},
		getStyleClass:function(name){
			var classes=[name],current=name
			while((current=this.styleParent[current]))
				classes.push(current)
			return classes.reverse().join(' ')
		},
		factory:function(model,parent){
			switch(model.type){
			case 'docDefaults':
				return new DefaultStyle({model:model,el:parent.el},this,parent)
			case 'style':
				return new Style({model:model,el:parent.el},this,parent)
			default:
				if(this.MODEL[model.type])
					return new this.MODEL[model.type]({model:model},this,parent)
				return new Any({model:model,el:parent.el},this,parent)
			}
		},
		styleFactory:function(model,ruleStyle){
			if(this.STYLE[model.type])
				return new this.STYLE[model.type](model,ruleStyle,this)
			return new AnyStyle(model,ruleStyle,this)
		},
		remove: function(){
			this.body.$el.remove()
			this.styles.$el.remove()
		}
	},{
		editable:function(doc){
			return doc.type=='Word'
		}
	}).collectModel(arguments)
})