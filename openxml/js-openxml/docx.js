clazz('xpr.DOCX','xpr.Document',function(blob){
	xpr.Document.apply(this,arguments)
	this.main=new xpr.Document.Part("word/document.xml",this)
},{
	getStylePart: function(){
		return this.getPart('word/styles.xml')
	},
	getNumberingpart: function(){
		return this.getPart('word/numbering.xml')
	}
})

clazz('xpr.docx.DocxModelBuilder','xpr.ModelBuilder',function(){
	xpr.ModelBuilder.apply(this,arguments)
	this.modelContainer='xpr.docx'
	this.styleBuilder=new xpr.docx.DocxModelBuilder.StyleBuilder()
	for(var i=0,d=["shapetype"],len=d.length;i<len;i++)
		this.ignores[d[i].toLowerCase()]=1
},{
	build: function(c){
		var name=c.localName
		if(this.shouldIgnore(name))
			return new xpr.Model.Ignorable(c);
		switch(name){
		case "document":
			return this.instance("Document",c);
		case "body":
			return this.instance("Body",c);
		case "styles":
			return this.instance("Styles",c);
		case "docdefaults":
			return this.instance("DocDefaults",c);
		case "style":
			var type=c.getAttribute("w:type");
			if("paragraph".equalsIgnoreCase(type)){
				return this.instance("PStyle",c);
			}else if("table".equalsIgnoreCase(type)){
				return this.instance("TableStyle",c);
			}else if("numbering".equalsIgnoreCase(type)){
				return this.instance("NumberingStyle",c);
			}else if("character".equalsIgnoreCase(type)){
				return this.instance("CharacterStyle",c);
			}
		case "tbl":
			return this.instance("Table",c);
		case "tr":
			return this.instance("Tr",c);
		case "tc":
			return this.instance("Td",c);
		case "p":
			var pr=c.firstChild
			if(pr && pr.localName=="ppr"){
				
			}
			return this.instance("P",c);
		case "r":
			return this.instance("R",c);
		case "t":
			return this.instance("Text",c);
		case 'inline':
			return this.instance("InlineImage",c)
		default:
			return xpr.ModelBuilder.prototype.build.call(this,c);
		}
	}
})

clazz('xpr.docx.DocxModelBuilder.StyleBuilder','xpr.ModelBuilder',function(){
	xpr.ModelBuilder.apply(this,arguments)
	this.modelContainer='xpr.docx.DocxModelBuilder'
	for(var i=0,d=["shapetype"],len=d.length;i<len;i++)
		this.ignores[d[i].toLowerCase()]=1
},{
	isMainBuilder: function(){return false},
	build: function(node,ctx){
		var name=node.localName
		if(this.shouldIgnore(name))
			return new xpr.Model.Ignorable(node);
		name=name.substring(0,1).toUpperCase()+name.substring(1);
		var m=null;
		if(ctx)
			m=this.instance(ctx+"."+name,node);
		if(m==null)
			m=this.instance(name,node);
		if(m==null)
			m=new PropertyConverter(c);
		return m;
	}
})	
