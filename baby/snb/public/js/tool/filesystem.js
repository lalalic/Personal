define(function(){
	var requestFS=function(type,size){
			var request=window.requestFileSystem || window.webkitRequestFileSystem, p=new Promise
			request.call(null,type||PERSISTENT,size||5*1024*1024,function(fs){
					p.resolve(fs)
				},function(e){p.reject(e)})
			return p
		},
		resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL
	return {
		getInstance:requestFS,
		remove: function(path){
			var p=new Promise, error=function(e){p.reject(e)}
			requestFS().then(function(fs){
				fs.root.getFile(path,{create:false},function(entry){
					entry.remove(function(){p.resolve()},error)
				},error)
			},error)
			return p
		},
		create: function(path,content,option){
			var p=new Promise, error=function(e){p.reject(e)}
			requestFS().then(function(fs){
				var opt={create: true}
				if(option)
					opt=_.extend({},opt,option)
				fs.root.getFile(path,opt,function(entry){
					entry.createWriter(function(writer){
						writer.onwriteend=function(){
							p.resolve(entry)
						}
						writer.onerror=function(e){
							p.reject(e)
						}
						if(!opt.create)
							writer.seek(writer.length)
						writer.write(content)
					},error)
				},error)
			},error)
			return p
		},
		get: function(path){
			var p=new Promise, error=function(e){console.debug("get file error:"+JSON.stringify(e));p.reject(e)}
			if(path.indexOf('://')!=-1)
				resolveLocalFileSystemURL(path,function(entry){p.resolve(entry)},error)
			else
				requestFS().then(function(fs){
					fs.root.get(path,{create:false},function(entry){p.resolve(entry)},error)
				},error)
			return p
		}
	}
})
	