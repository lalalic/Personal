define(['doc/model'],function(Model){
	return Backbone.Model.extend({
		MODEL:{},
		Node2Model:{},
		_mainPartName:false,
		constructor:function(parts,raw, name){
			this.raw=raw
			this.parts=parts
			this.name=name
			this._mainPartName && (this.main=this.getPart(this._mainPartName))
			Backbone.Model.prototype.constructor.apply(this)
		},
		initialize:function(){
			Backbone.Model.prototype.initialize.apply(this,arguments)
			this.on('content:change',function(){
				this.main.changed=true
			},this)
		},
		download: function(){
			this.save()
			var a=document.createElement("a")
			document.body.appendChild(a)
			a.href=URL.createObjectURL(this.raw.generate({type:'blob'}))
			a.download=this.name||"document."+this.ext
			a.click()
			document.body.removeChild(a)
		},
		save: function(){
			_.each(this.parts,function(part){
				if(part.changed)
					this.raw.file(part.name,part.asText())
			}, this)
			return this.raw
		},
		getPart:function(name){
			return this.parts[name]
		},
		getBody:function(){
			return this.body ? this.body : (this.body=this.factory(this.main.root.firstChild,this,this))
		},
		factory: function(wXml,parent){
			var type=wXml.localName,mapedType
			if(this.MODEL[type])
				return new this.MODEL[type](wXml,this,parent)
			else if((mapedType=this.Node2Model[type]))
				return new this.MODEL[mapedType](wXml,this,parent)
			return new Model(wXml, this, parent)
		}
	},{
		collectModel:function(args,start){
			var models={}
			for(var i=start,len=args.length,m;i<len;i++)
				models[(m=args[i]).prototype.type]=m
			this.prototype.MODEL=models
			return this
		},
		load:function(f){
			var reader=new FileReader(),p=new Promise
			reader.onload=function(e){
				var raw=new JSZip(e.target.result),parts={}
				raw.filter(function(path,file){
					parts[path]=file
				})
				require(DOCTYPES,function(){
					for(var i=0,len=arguments.length,DOCTYPE;i<len;i++){
						if((DOCTYPE=arguments[i]).is(parts))
							p.resolve(new DOCTYPE(parts,raw,f.name))
					}
				})
			}
			reader.readAsArrayBuffer(f);
			return p
		},
		is:function(){return false}
	})
})