define(['doc/document','doc/openxml/docx/document'],function(Document,WordDocument){
	return Document.extend({
		type:"xWord",
		ext:'xword',
		constructor: function(parts,raw,name){
			var docx=raw.file(/^Document\/Publish\/.*\.docx/)[0]
			this.document=this.createWordDocument(docx.asBinary())
			this.main=this.document.main
			Document.apply(this,arguments)
			this.documentName=docx.name
		},
		save: function(){
			this.document.save()
			this.raw.file(this.documentName,this.document.raw.generate({type:'arraybuffer'}))
			return this.raw
		},
		createWordDocument: function(docx){
			var raw=new JSZip(docx),parts={}
			raw.filter(function(path,file){
				parts[path]=file
			})
			return new WordDocument(parts,raw,null)
		},
		factory:function(){
			return this.document.factory.apply(this.document,arguments)
		},
		getBody:function(){
			return this.document.getBody()
		},
		getStyles:function(){
			return this.document.getStyles()
		}
	},{
		is:function(parts){
			return parts["BDTDesign.xml"]
		}
	})
})