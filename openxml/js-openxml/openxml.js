function $1(selector, ctx){
	return $(ctx).find(selector).get(0)
}

function $9(selector,ctx){
	return $(ctx).find(selector)
}
function getClazz(fullname){
	var ps=fullname.split('.'),_ns=window,n
	while((n=ps.shift())!=null)
		_ns=_ns[n]
	return _ns;
}
function Unknown(){}
function clone(to,from){
	if(!from)
		return;
	for(var i in from)
		to[i]=from[i]
}
function clazz(name,_super,_ex,_prototype){
	if(_super && typeof(_super)!='string'){
		_prototype=_ex
		_ex=_super
		_super=null
	}		
	
	//create pacakges
	var ps=name.split('.'),className=ps[ps.length-1],_ns=window
	for(var i=0,len=ps.length-1,p;i<len;i++){
		p=ps[i]
		if(!(p in _ns))
			_ns[p]=function(){}
		_ns=_ns[p]
	}
	
	_super= _super ? getClazz(_super) : Unknown
	
	_ns[className] = _ex
	clone(_ns[className].prototype,_super.prototype)
	_ns[className].prototype._super=_super
	_ns[className].prototype.clazz=name
	_ns[className].prototype.constructor=_ex
	clone(_ns[className].prototype,_prototype)
	console.debug('created Class '+name)
}

clazz('xpr.Document',function(docx){
	var me=this
	this.parts={}
	this.raw=docx
	this.main=null
},{
	readThen: function(callback){
		var me=this
		zip.createReader(new zip.BlobReader(this.raw), function(reader){
			reader.getEntries(function(entries){
				for(var i=0,len=entries.length;i<len;i++)
					me.parts[entries[i].filename]=entries[i]
				console.debug('unziped file '+me.raw.name+' with '+entries.length+' entries')
				callback && callback.apply(this)
			})
		})
	},
	traverseWith:function(builder,callback){
		var me=this
		builder.rawDocument=this
		this.main.getRootThen(function(){
			var documentModel=builder.build(me.main.root)
			if(callback && documentModel.isAsync()){
				documentModel.traverse(null,function(){
					callback.apply(me)
				})
			}else{
				documentModel.traverse(null)
				callback && callback.apply(me)
			}
		})
	},
	getImageDataURI: function(target,callback){
		var zipentry=this.parts[target]
		zipentry.getData(new zip.BlobWriter(zip.getMimeType(zipentry.filename)),function(blob){
			var reader=new FileReader()
			reader.onload=function(e){
				callback && callback(e.target.result)
			}
			reader.readAsDataURL(blob)
		})
	},
	getPart: function(part){
		return new xpr.Document.Part(part,this);
	}
});

clazz('xpr.Document.Part',function(name,document){
	this.name=name
	this.root=null
	this.document=document
	this.folder=""
	var i=this.name.lastIndexOf('/');
	if(i==-1)
		this.relName="_rels/"+this.name+".rels";
	else{
		this.folder=this.name.substring(0,i)
		this.relName=this.folder+"/_rels/"+this.name.substring(i+1)+".rels";
	}
	this.rels=null
},{
	getRootThen:function(callback){
		var me=this
		if(this.root)
			callback && callback.call(this,this.root)
		else{
			this.document.parts[this.name].getData(new zip.TextWriter(), function(text){
				me.root=jQuery.parseXML(text).documentElement
				console.debug('parsed '+me.name)
				callback && callback.call(me,me.root)
			})
		}
		return this.root
	},
	getRel:function(rid, callback){
		var me=this
		if(this.rels)
			callback && callback.call(me,me.folder+"/"+me.rels[rid])
		else{
			new xpr.Document.Part(this.relName,this.document)
				.getRootThen(function(){
					me.rels={}
					$('Relationship',this.root).each(function(){
						me.rels[this.getAttribute('Id')]=this.getAttribute('Target')
					})
					callback && callback.call(me,me.folder+"/"+me.rels[rid])
				})
		}
	}
})

clazz('xpr.Model',function(node){
	this.raw=node
	console.debug('created model for '+node.localName)
},{
	traverse:function(o){
		this.iterateContent(o)
	},
	iterateContent:function(o){
		var content=this.getContent()
		var child=null;
		var builder=this.getBuilder();
		for(var i=0, len=content.length; i<len; i++){
			child=content.item(i);
			if(this.isIgnoreableChild(child))
				continue;
			this.initChildModel(builder.build(child))
				.traverse(o);
		}
	},
	getContent:function(){
		return this.raw.childNodes
	},
	getBuilder:function(){
		return xpr.ModelBuilder.instance
	},
	isIgnoreableChild:function(node){
		return false;
	},
	initChildModel:function(model){
		return model
	},
	isAsync: function(){
		return false
	}
})

clazz('xpr.Model.Ignorable','xpr.Model',function(node){
	xpr.Model.apply(this,arguments)
},{
	traverse:function(){
		console.debug('ignore a/an '+node.localName)
	}
})

clazz('xpr.ModelBuilder',function(){
	this.ignores={}
	this.modelContainer='xpr'
	this.rawDocument=null
	if(this.isMainBuilder())
		xpr.ModelBuilder.instance=this
},{
	build:function(node){
		if(this.shouldIgnore(node.localName))
			return new xpr.Model.Ignorable(node)
		return new xpr.Model(node)
	},
	shouldIgnore:function(nodeName){
		return (nodeName.toUpperCase() in this.ignores)
	},
	isMainBuilder:function(){
		return true
	},
	instance: function(type,node){
		var model=getClazz(this.modelContainer+"."+type)
		return new model(node)
	}
})
