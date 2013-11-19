/**
{
	bind:function(img,{}){},
	click:function(){}
}

String.prototype.toImageDataURL,toImageData
*/
define(function(){
	var IMAGE_DATA_SCHEME="data:image/jpeg;base64,",
		IMAGE_DATA_PATTERN=new RegExp('<img\s+src="data:image/jpeg;base64,(.*?)"\s*>', "gim")
	_.extend(String.prototype,{
		isImageData:function(){return this.substr(0,IMAGE_DATA_SCHEME.length)==IMAGE_DATA_SCHEME},
		splitByImageData:function(){return this.split(IMAGE_DATA_PATTERN)}
	})	
	
	function webUploader(){
		$(document.body)
			.append('<input type="file" id="_uploader" class="outview" onchange="this.save()">')
			.append('<canvas id="_imgSizer" class="outview"></canvas>')
			
		var _imgSizer=document.getElementById('_imgSizer'),
			_uploader=document.getElementById('_uploader')
			_.extend(String.prototype,{
				toImageDataURL:function(size){
					var ctx=_imgSizer.getContext('2d'),
						img=new Image();
					img.src=this;
					var wh=img.width/img.height;
					_imgSizer.width = wh>=1 ? (size<img.width ? size : img.width) : (size<img.height ? Math.floor(size*wh) : img.width);
					_imgSizer.height = wh<1 ? (size<img.height ? size : img.height) : (size<img.width ? Math.floor(size/wh) : img.height);
					_imgSizer.style.width=_imgSizer.width+"px"
					_imgSizer.style.height=_imgSizer.height+"px"
					ctx.drawImage(img,0,0,img.width,img.height,0,0,_imgSizer.width, _imgSizer.height);
					return _imgSizer.toDataURL("image/jpeg")
				},
				toImageData=function(size){
					return this.substr.call(size?this.toImageDataURL(size):this,IMAGE_DATA_SCHEME.length)
				}
			})
			
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
					var file=me.files[i-1]
					var data=e.target.result.toImageData(me.opt.size)
					function save(base64Data){
						var data={base64:base64Data},
							f=new Parse.File(file.name,data,file.type),
							needSave=true
						me.opt['onSave'] && (needSave=me.opt.onSave.call(me,f, IMAGE_DATA_SCHEME+data.base64,e))
						needSave!==false && f.save(me.opt)
						i<len ? reader.readAsDataURL(me.files[i++]) : (me.value="")
					}
					if(Promise.is(data))
						data.then(save)
					else
						save(data)
				}
				reader.readAsDataURL(this.files[i++])
			}
		})
		return _uploader
	}
	
	function phonegapUploader(){
		return {
			DEFAULT:{ 
				quality : 75,
				destinationType : Camera.DestinationType.DATA_URL,
				sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
				mediaType: Camera.MediaType.PICTURE,
				allowEdit : false,
				encodingType: Camera.EncodingType.JPEG,
				targetWidth: 150,
				targetHeight: 150,
				cameraDirection: Camera.Direction.BACK,
				saveToPhotoAlbum: false 
			},
			bind: function(a,opt){
				this.opt=_.extend({
					success: function(f){
						a && 'IMG'==a.nodeName && (a.src=f.url())
					},
					size: 1024,
				},this.DEFAULT,opt||{})
				this.opt.targetWidth=this.opt.targetHeight=this.opt.size
				return this
			},
			click: function(){
				var p=new Promise,onSave=this.opt['onSave'],success=this.opt.success
				p.then(function(data64){
					var data={base64:data64},f=new Parse.File("a.jpg",data),
						needSave=true, 
					onSave && (needSave=onSave(f, IMAGE_DATA_SCHEME+data.base64))
					needSave!==false && f.save().then(success)
				})
				navigator.camera.getPicture(
					function(data64){p.resolve(data64)},
					function(msg){p.reject(msg)},
					this.opt)
			}
		}
	}

	if(_.has(navigator,'camera'))
		return phonegapUploader()
	return webUploader()
})