define(['doc/openxml/document','doc/model'].add('doc/openxml/docx/model/','body,section,p,r,t,image,table,tr,td'),
	function(Document,Model,Body,Section,P,R,T,Image,Table,Tr,Td){	
		return Document.extend({
			Node2Model:{'sectPr':'section','inline':'image','tc':'td','tbl':'table'},
			_mainPartName:"word/document.xml",
			type:"Word",
			ext:'docx',
			getStyles: function(){
				if(!this.styles){
					this.styles=this.factory(this.getPart("word/styles.xml").root,this.getBody())
					this.styles.ignores={latentStyles:true}
				}
				return this.styles
			}
		},{
		is:function(parts){
			return parts["word/document.xml"]
		}
	}).collectModel(arguments,2)
})