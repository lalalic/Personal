define(['app'],function(app){
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
				toImageData:function(size){
					return this.substr.call(size?this.toImageDataURL(size):this,IMAGE_DATA_SCHEME.length)
				}
			})
			
		_.extend(_uploader,{
			bind:function(a,opt){
				this.opt=_.extend({
					onSaved: function(f){
						a && 'IMG'==a.nodeName && (a.src=f.url())
					},
					size:1024
				},opt||{})
				return this			
			},
			save:function(){
				var reader=new FileReader(), 
					onSave=this.opt['onSave'], 
					onSaved=this.opt.onSaved,
					size=this.opt.size,
					file=this.files[0]
				reader.onloadend=function(e){
					var data=e.target.result.toImageData(size),
						f=new app.File({name:file.name,data:atob(data),type:file.type}),
						needSave=true
					onSave && (needSave=onSave(f, IMAGE_DATA_SCHEME+data))
					needSave!==false && f.save().then(onSaved)
				}
				reader.readAsDataURL(file)
			}
		})
		return _uploader
	}
	
	function phonegapUploader(){
		var DEFAULT={ 
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
			}
		return {
			type:'phonegap',
			bind: function(a,opt){
				this.opt=_.extend({
					onSaved: function(f){
						a && 'IMG'==a.nodeName && (a.src=f.url())
					},
					size: 1024,
				},DEFAULT,opt||{})
				this.opt.targetWidth=this.opt.targetHeight=this.opt.size
				return this
			},
			click: function(){
				var p=new Promise,onSave=this.opt['onSave'],onSaved=this.opt.onSaved
				p.then(function(data64){
					var data=data64,f=new app.File({name:"a.jpg",data:atob(data)}),
						needSave=true
					onSave && (needSave=onSave(f, IMAGE_DATA_SCHEME+data.base64))
					needSave!==false && f.save().then(onSaved)
				})
				navigator.camera.getPicture(
					function(data64){p.resolve(data64)},
					function(msg){p.reject(msg)},
					this.opt)
				return p
			}
		}
	}

	if(_.has(navigator,'camera'))
		return phonegapUploader()
	return webUploader()
})