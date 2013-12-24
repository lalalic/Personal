clazz('xpr.docx.out.html.HtmlConverterBuilder','xpr.docx.DocxModelBuilder',function(){
	xpr.docx.DocxModelBuilder.apply(this,arguments)
	this.modelContainer='xpr.docx.out.html'
	this.convertedDocument=workspace
},{
	instance: function(type,node){
		var m=xpr.docx.DocxModelBuilder.prototype.instance.apply(this,arguments)
		if(m==null)
			m=new xpr.docx.out.html.Converter(node);
		m.convertedDoc=this.convertedDocument;
		return m;
	}
})

clazz('xpr.docx.out.html.Converter','xpr.Model',function(){
	xpr.Model.apply(this,arguments)
	this.tag=null
	this.convertedDoc=null
},{
	traverse:function(convertedParent){
		var converted=null
		if(this.tag!=null)
			converted=document.createElement(this.tag)
		else
			converted=this.createNode()
			
		if(convertedParent && converted)
			convertedParent.appendChild(converted);
			
		if('click' in converted){//html element
			try{
				this.convertStyle(converted)
			}catch(e){
			
			}
		}
		
		try{
			this.convertContent(converted||convertedParent)
		}catch(e){
		
		}
		console.debug('converted for '+this.raw.localName)
	},
	convertContent: function(converted){xpr.Model.prototype.traverse.apply(this,arguments)},
	convertStyle: function(){},
	createNode: function(){ return null}
})

clazz('xpr.docx.out.html.Document','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="Article"
},{
	isAsync: function(){
		return true
	},
	traverse: function(converted, callback){
		var me=this
		this.convertStyles(function(){
			me.convertNumbering(function(){
				xpr.docx.out.html.Converter.prototype.traverse.call(me,me.convertedDoc)
				callback && callback.apply(me)
			})
		})
	},
	convertStyles: function(callback){
		var docx=this.getBuilder().rawDocument,me=this,
			stylePart=docx.getStylePart()
		stylePart.getRootThen(function(root){
			var el=document.createElement('style'),a
			(a=$('head').get(0)).insertBefore(el,null)
			new xpr.docx.out.html.Styles(root)
				.traverse(el.sheet)
			callback && callback.call(me)
		})
	},
	convertNumbering: function(callback){
		callback && callback.call(this)
	}
})

clazz('xpr.docx.out.html.Body','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="div"
},{
	convertStyle: function(converted){
		this._super.prototype.convertStyle.apply(this,arguments)
		converted.classList.add('section')
	}
})

clazz('xpr.docx.out.html.Styles','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
},{
	traverse: function(stylesheet){
		new xpr.docx.out.html.DocDefautls(this.raw.firstElementChild)
			.traverse(stylesheet)
		
		for(var i=0,styles=$9('style',this.raw),len=styles.length,style;i<len;i++)
			new xpr.docx.out.html.Style(styles[i])
				.traverse(stylesheet)
	}
})

clazz('xpr.docx.out.html.Style','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
},{
	traverse: function(stylesheet){
		var selector="article "
		switch(this.raw.getAttribute('w:type')){
		case 'paragraph':
			selector+="P"
			break
		case 'table':
			selector+="Table"
			break
		case 'character':
			selector+="Span"
			break
		}
		selector+=("."+this.raw.getAttribute('w:styleId'))
		var rule=this.createRule(stylesheet,selector)
		
		var ppr=$1('pPr',this.raw)
		if(ppr)
			new xpr.docx.out.html.css.PPr(ppr).traverse(rule.style)
		
		var rpr=$1('rPr',this.raw)
		if(rpr)
			new xpr.docx.out.html.css.RPr(rpr).traverse(rule.style)	
			
		$(document).trigger('style.traversed',[rule])			
	},
	createRule: function(stylesheet,selector){
		var rules=stylesheet.rules,len=rules.length
		var index=stylesheet.insertRule(selector+'{}',len)
		return stylesheet.rules[index]
	}
})


clazz('xpr.docx.out.html.DocDefautls','xpr.docx.out.html.Style',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
},{
	traverse: function(stylesheet){
		var ppr=$1('pPr',this.raw)
		if(ppr){
			var rule=this.createRule(stylesheet,"article P")
			new xpr.docx.out.html.css.PPr(ppr).traverse(rule.style)
			$(document).trigger('style.traversed',[rule])
		}
		
		var rpr=$1('rPr',this.raw)
		if(rpr){
			var rule=this.createRule(stylesheet,"article Span")
			new xpr.docx.out.html.css.RPr(rpr).traverse(rule.style)
			$(document).trigger('style.traversed',[rule])
		}
		
	}
})

clazz('xpr.docx.out.html.P','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="P"
},{
	convertStyle:function(converted){
		xpr.docx.out.html.Converter.prototype.convertStyle.apply(this,arguments)
		if(converted.classList.length==0)
			converted.classList.add('Normal')
	}
})

clazz('xpr.docx.out.html.R','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="Span"
},{
	convertStyle: function(converted){
		xpr.docx.out.html.Converter.prototype.convertStyle.apply(this,arguments)
		if(this.raw.firstChild.localName=='rPr')
			new xpr.docx.out.html.css.RPr(this.raw.firstChild,converted)
				.traverse(converted.style)
		if(converted.classList.length==0)
			converted.classList.add('DefaultParagraphFont')
	},
	convertContent: function(converted){
		this._super.prototype.convertContent.apply(this,arguments)
		var me=this
		converted.addEventListener('change',function(){
			alert((new XMLSerializer()).serializeToString(me.raw))
		})
	}
})

clazz('xpr.docx.out.html.Text','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
},{
	createNode: function(){
		return document.createTextNode(this.raw.textContent)
	}
})

clazz('xpr.docx.out.html.Table','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="Table"
},{
	convertStyle: function(converted){
		xpr.docx.out.html.Converter.prototype.convertStyle.apply(this,arguments)
		if(converted.classList.length==0)
			converted.classList.add('TableNormal')
	}
})

clazz('xpr.docx.out.html.Tr','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="Tr"
})

clazz('xpr.docx.out.html.Td','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="Td"
})

clazz('xpr.docx.out.html.InlineImage','xpr.docx.out.html.Converter',function(){
	xpr.docx.out.html.Converter.apply(this,arguments)
	this.tag="Img"
},{
	convertContent:function(img){},
	convertStyle: function(img){
		var blip=$(this.raw).find('blip'), me=this
		var rid=blip.attr('r:embed')
		var docx=this.getBuilder().rawDocument
		img.id=rid
		docx.main.getRel(rid,function(target){
			docx.getImageDataURI(target,function(uri){
				$('#'+rid).attr('src',uri)
			})
		})
	}
})

clazz('xpr.docx.out.html.css.StyleConverter','xpr.Model',function(node,converted){
	xpr.Model.apply(this,arguments)
	this.content=converted
},{
	traverse: function(stylesheet){
		var me=this,
			handler=function(e){
				var style=e.localName
				if(style in me)
					me[style](stylesheet,e)
			}
		
		for(var i=0, ns=this.raw.childNodes,len=ns.length;i<len;i++)
			handler(ns[i])
		
		for(var i=0, ns=this.raw.attributes,len=ns.length;i<len;i++)
			handler(ns[i])
	}
})

clazz('xpr.docx.out.html.css.PPr','xpr.docx.out.html.css.StyleConverter',function(node,converted){
	xpr.docx.out.html.css.StyleConverter.apply(this,arguments)
})

clazz('xpr.docx.out.html.css.RPr','xpr.docx.out.html.css.StyleConverter',function(node,converted){
	xpr.docx.out.html.css.StyleConverter.apply(this,arguments)
},{
	b: function(e){
		var val=e.getAttribute('w:val')
		css.fontWeight=(!val||val=='true')?'700':''
	},
	i: function(e){
		var val=e.getAttribute('w:val')
		css.fontStyle=(!val||val=='true')?'italic':'normal'
	},
	color: function(e){
		css.color='#'+e.getAttribute('w:val')
	},
	rStyle: function(e){
		this.content && this.content.classList.add(e.getAttribute('w:val'))
	},
	sz: function(e){
		css.fontSize=parseInt(e.getAttribute('w:val'))/2.0
	}
})
