define(function(){
	var IMAGE_DATA_SCHEME="data:image/jpeg;base64,"
	var IMAGE_DATA_PATTERN=new RegExp('<img\s+src="data:image/jpeg;base64,(.*?)"\s*>', "gim")
	
		String.prototype.toImageDataURL=function(size){
			var tool=_imgSizer,
				ctx=tool.getContext('2d'),
				img=new Image();
			img.src=this;
			var wh=img.width/img.height;
			tool.width = wh>=1 ? (size<img.width ? size : img.width) : (size<img.height ? Math.floor(size*wh) : img.width);
			tool.height = wh<1 ? (size<img.height ? size : img.height) : (size<img.width ? Math.floor(size/wh) : img.height);
			tool.style.width=tool.width+"px"
			tool.style.height=tool.height+"px"
			ctx.drawImage(img,0,0,img.width,img.height,0,0,tool.width, tool.height);
			return tool.toDataURL("image/jpeg")
		}
		
		String.prototype.toImageData=function(size){
			return this.substr.call(size?this.toImageDataURL(size):this,IMAGE_DATA_SCHEME.length)
		}
		String.prototype.isImageData=function(){return this.substr(0,IMAGE_DATA_SCHEME.length)==IMAGE_DATA_SCHEME}
		String.prototype.splitByImageData=function(){return this.split(IMAGE_DATA_PATTERN)}


	$(document.body)
		.append('<input type="file" id="_uploader" class="outview" onchange="this.save()">')
		.append('<canvas id="_imgSizer" class="outview"></canvas>')
	_.extend(_uploader,{
		bind:function(a,opt){
			this.opt=_.extend({
					success: function(f){
						a && 'IMG'==a.nodeName && (a.src=f.url())
					},
					error:Parse.error,
					size:1024
				},opt)
			return this			
		},
		save:function(){
			var me=this,
				reader=new FileReader(), 
				i=0,len=this.files.length
			reader.onloadend=function(e){
				var file=me.files[i-1],
					data={base64:e.target.result.toImageData(me.opt.size)}
					f=new Parse.File(file.name,data,file.type),
					needSave=true
				me.opt['onSave'] && (needSave=me.opt.onSave.call(me,f, IMAGE_DATA_SCHEME+data.base64))
				needSave!==false && f.save(me.opt)
				i<len ? reader.readAsDataURL(me.files[i++]) : (me.value="")
			}
			reader.readAsDataURL(this.files[i++])
		}
	})
	return _uploader
})