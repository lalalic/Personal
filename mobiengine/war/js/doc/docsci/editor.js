define(['doc/editor','view/base'],function(Editor,View){
	$('body').append("<style>\
		.datatree{margin:10px 2px;color:lightgray}\
		.datatree ul{margin-left:20px}\
		.datatree li.active>a{color:white;font-weight:700}\
		</style>")
	function base64ToBlob(base64,type){
		type=type||'image/jpeg'
		var binary = atob(base64);
		var array = new ArrayBuffer(binary.length);
		var view=new Uint8Array(array)
		for(var i = 0; i < binary.length; i++)
			view[i]=binary.charCodeAt(i)
		try{
			return new Blob([view], {type: type});
		}catch(e){
			return view.buffer;
			var BlobBuilder=window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
			var builder=new BlobBuilder()
			builder.append(view.buffer)
			return builder.getBlob(type)
		}
	}		
	var DataAside=View.Page.extend({
		tagName:'aside',
		className:'box',
		navs:'',
		content:'<ul class="datatree"/>',
		cmds:'<a><span class="icon data" onclick="this.nextSibling.click()"/><input type="file" class="outview" accept="*.xml"></a>',
		events:{
			'change input[type="file"]':'changeData',
			'click .datatree li':'onCurrent'
		},
		initialize:function(){
			View.Page.prototype.initialize.apply(this,arguments)
			this.$tree=this.$('ul.datatree')
			this.file=this.$('input[type="file"]').get(0)
			this.$('article').removeClass('scroll')
		},
		onCurrent:function(e){
			this.$tree.find('.active').removeClass('active')
			$(e.currentTarget).addClass('active')
			e.stopPropagation()
		},
		getData:function(){
			var n=this.$tree.find('.active')
			if(n.length)
				return n.data('model').outerHTML
			return ""
		},
		render:function(dataNode,htmlParent){
			if(dataNode.nodeType==3)
				return;
			var li=$('<li unselectable="on" draggable="true"><a>'+dataNode.localName+'</a></li>').data('model',dataNode)
			htmlParent.append(li)
			if(dataNode.firstElementChild){
				var ul=$('<ul/>'),siblings={}
				ul.appendTo(li)
				for(var i=0,ds=dataNode.childNodes,d,len=ds.length;i<len;i++){
					d=ds[i]
					if(d.nodeType==3)
						continue
					if(d.localName in siblings)
						continue
					this.render(ds[i],ul)
					siblings[d.localName]=1
				}
			}
		},
		changeData:function(e){
			var reader=new FileReader(),me=this
			reader.onload=function(e){
				me.setData($.parseXML(e.target.result).documentElement)
			}
			reader.readAsText(this.file.files[0])
			this.file.value=""
		},
		setData:function(root){
			this.model=root
			this.$tree.empty()
			this.render(root,this.$tree)
			this.$tree.find('li:first').addClass('active')
		}
	})
	return Editor.extend({
		exports:{"preview":"<a><span class='icon preview'></a>"},
		initialize:function(){
			Editor.prototype.initialize.apply(this,arguments)
			this.dataAside=new DataAside()
			this.dataAside.show()	
		},
		render:function(){
			var me=this
			Editor.create(this.model.document,this.el)
				.then(function(editor){
					me.editor=editor
					editor.render()
				})
		},
		remove:function(){
			this.dataAside.remove()
			this.editor.remove()
		},
		getData:function(){
			return this.dataAside.getData()
		},
		preview:function(){
			var me=this,customerData=this.dataAside.getData()
			if(customerData.length==0)
				return alert('please select data first');
			var pkg=this.model.save()
			var data=new FormData()
			data.append('customerData',customerData)
			data.append('template',pkg.generate({type:'blob'}))
			$.ajax({
				url:'http://localhost:8080/xprs/services/ddp/preview',
				data:data,
				cache: false,
				contentType: false,
				processData: false,
				type: 'POST',
				success: function(data){
					var base64=$(data).find('return').html()
					var blob=base64ToBlob(base64,"application/pdf")
					var a=document.createElement("a")
					document.body.appendChild(a)
					a.href=URL.createObjectURL(blob)
					a.download="preview.pdf"
					a.click()
					document.body.removeChild(a)
				},
				error:function(e){
					alert(e)
				}
			})
		}
	},{
		editable:function(doc){
			return doc.type=='xWord'
		}
	})
})