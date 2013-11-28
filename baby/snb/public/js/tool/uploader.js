/**
{
	bind:function(img,{}){},
	click:function(){}
}

String.prototype.toImageDataURL,toImageData
*/
define(['tool/filesystem'],function(filesystem){
	function base64ToBlob(base64,type){
		var binary = atob(base64);
		var array = [];
		for(var i = 0; i < binary.length; i++)
			array.push(binary.charCodeAt(i));
		return new Blob([new Uint8Array(array)], {type: type||'image/jpeg'});
	}
	function webUploader(){
		var IMAGE_DATA_SCHEME="data:image/jpeg;base64,",
			IMAGE_DATA_PATTERN=new RegExp('<img\s+src="data:image/jpeg;base64,(.*?)"\s*>', "gim")
		_.extend(String.prototype,{
			isImageData:function(){return this.substr(0,IMAGE_DATA_SCHEME.length)==IMAGE_DATA_SCHEME},
			splitByImageData:function(){return this.split(IMAGE_DATA_PATTERN)}
		})		
		var _request=Parse._request
		Parse._request=function(o){
			if(o.route!='files')
				return _request.apply(null,arguments)
			var p=new Promise
			$.ajax({
					type: "POST",
					beforeSend: function(request) {
						request.setRequestHeader("X-Parse-Application-Id", 'CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL');
						request.setRequestHeader("X-Parse-REST-API-Key", 'Rv5BONwihYqmH144bG6vbC9tBxxRaxrxNv8Ci27h');
						request.setRequestHeader("Content-Type", o.data._ContentType);
					},
					url: 'https://api.parse.com/1/files/' + o.className,
					data: base64ToBlob(o.data.base64,o.data._ContentType),
					processData: false,
					contentType: false,
					success: function(data) {
						p.resolve(data)
					},
					error: function(data) {
						p.reject(data)
					}
				})
			return p
		}
		
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
					var data={base64:e.target.result.toImageData(size)}
						f=new Parse.File(file.name,data,file.type),
						needSave=true
					onSave && (needSave=onSave(f, IMAGE_DATA_SCHEME+data.base64))
					needSave!==false && f.save().then(onSaved)
				}
				reader.readAsDataURL(file)
			}
		})
		return _uploader
	}
	
	function phonegapUploader(){
		var IMAGE_DATA_PATTERN=new RegExp('<img\s+src="(file://.*?)"\s*>', "gim")
		String.prototype.splitByImageData=function(){return this.split(IMAGE_DATA_PATTERN)}
		var _File=Parse.File
		Parse.File=function(fileUri,type){
			if(fileUri.indexOf('://')!=-1){
				type=type||'image/jpeg'
				this._url=fileUri
				this._name="a.jpg"
				this._source=Promise.as(fileUri,type)
				console.debug('create parse.file with '+fileUri)
			}else
				_File.apply(this,arguments)
		}
		Parse.File.prototype=_File.prototype
		
		var _request=Parse._request
		Parse._request=function(o){
			if(o.route!='files')
				return _request.apply(null,arguments)
			console.debug('parse request for files : '+JSON.stringify(o))
			var p=new Promise, fileUri=o.data.base64
			filesystem.get(fileUri)
				.then(function(entry){
					console.debug('get file entry: '+JSON.stringify(entry))
					$.ajax({
						type: "POST",
						beforeSend: function(request) {
							request.setRequestHeader("X-Parse-Application-Id", 'CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL');
							request.setRequestHeader("X-Parse-REST-API-Key", 'Rv5BONwihYqmH144bG6vbC9tBxxRaxrxNv8Ci27h');
							request.setRequestHeader("Content-Type", o.data._ContentType);
						},
						url: 'https://api.parse.com/1/files/' + o.className,
						data: entry.file(),
						processData: false,
						contentType: false,
						success: function(data) {
							console.debug('created file : '+JSON.stringify(data))
							p.resolve(data)
						},
						error: function(xhr) {
							console.debug('created file error: '+JSON.stringify(xhr))
							p.reject(xhr)
						}
					})
				},function(e){p.reject(e)})
			return p
		}
		
		var DEFAULT={ 
				quality : 75,
				destinationType : Camera.DestinationType.NATIVE_URI,//FILE_URI,//DATA_URL,
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
					var data={base64:data64},f=new Parse.File("a.jpg",data),
						needSave=true
					onSave && (needSave=onSave(f, IMAGE_DATA_SCHEME+data.base64))
					needSave!==false && f.save().then(onSaved)
				})
				navigator.camera.getPicture(
					function(data64){p.resolve(data64)},
					function(msg){p.reject(msg)},
					this.opt)
				return p
			},
			click: function(){
				var p=new Promise,onSave=this.opt['onSave'],onSaved=this.opt.onSaved
				p.then(function(fileUri){
					var needSave=true,f=new Parse.File(fileUri,'image/jpeg'),
						needSave=true
					onSave && (needSave=onSave(f, fileUri))
					needSave!==false && f.save().then(onSaved)
				})
				navigator.camera.getPicture(
					function(fileUri){p.resolve(fileUri)},
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