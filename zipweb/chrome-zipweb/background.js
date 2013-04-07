function _(key){
	return chrome.i18n.getMessage(key)
}
chrome.runtime.onInstalled.addListener(function() {
	chrome.contextMenus.create({title: "ZipWeb",			contexts:["page","image","selection"],id: "main"})
	chrome.contextMenus.create({title: _("Icon"),  			contexts:["image"],		id: "icon", 	parentId:"main"})
	chrome.contextMenus.create({title: _("Content"),		contexts:["selection"],	id: "content", 	parentId:"main"})
	chrome.contextMenus.create({title: _("Menu"), 			contexts:["selection"],	id: "menu", 	parentId:"main"})
	chrome.contextMenus.create({title: _("Remove"),  			contexts:["selection"],	id: "remove", 	parentId:"main"})
	chrome.contextMenus.create({title: _("BelowContent"),  	contexts:["selection"],	id: "Below", 	parentId:"remove"})
	chrome.contextMenus.create({title: _("AboveContent"),  	contexts:["selection"],	id: "Above", 	parentId:"remove"})
	chrome.contextMenus.create({title: _("Selected"), 	 		contexts:["selection"],	id: "Node", 	parentId:"remove"})
	
	chrome.contextMenus.create({title: _("Clear"),  			contexts:["page"],				id: "clear", 	parentId:"main"})
	chrome.contextMenus.create({title: _("Download"), 			contexts:["page","image"],		id: "download", parentId:"main"})
	chrome.contextMenus.create({title: _("CurrentPage"), 		contexts:["page","image"],		id: "download1",parentId:"download"})
	chrome.contextMenus.create({title: _("Deep1"), 			contexts:["page","image"],		id: "download2",parentId:"download"})
	chrome.contextMenus.create({title: _("Deep2"), 			contexts:["page","image"],		id: "download3",parentId:"download"})
	chrome.contextMenus.create({title: _("Smart"),  			contexts:["page","image"],		id: "download9",parentId:"download"})	
});

chrome.contextMenus.onClicked.addListener(function(info,tab,a){
	switch(info.menuItemId){
		case "clean":
			chrome.tabs.sendMessage(tab.id,{"cmd":"clean"})
			break
		case "download1":
		case "download2":
		case "download3":
		case "download9":
			a=info.menuItemId.match(/^download(\d)/)
			new Downloader(parseInt(a[1]),(new Date().getTime())+"",tab).start()
			break
		case "content":
			chrome.contextMenus.update('content',{enabled:false})
			chrome.tabs.sendMessage(tab.id,{"cmd":info.menuItemId,info:info})
			break
		case "menu":
			chrome.contextMenus.update('menu',{enabled:false})
			chrome.tabs.sendMessage(tab.id,{"cmd":info.menuItemId,info:info})
			break
		default:
			chrome.tabs.sendMessage(tab.id,{"cmd":info.menuItemId,info:info})
	}
});


chrome.extension.onMessage.addListener(function(info,sender,sendResponse){
	switch(info.cmd){
	case 'NewDocument':
		chrome.contextMenus.update('content',{enabled:true})
		chrome.contextMenus.update('menu',{enabled:true})
		break
	case 'content':
	default:
		Downloader[info.uid].save(info)
		sendResponse("ok")
	}
})

var Downloader=function(deep,uid,tab){
	var me=this,
		temp
	this.deep=deep,this.uid=uid,this.tab=tab
	this.images=[],	this.links=[], this.downloading={}
	this.errors=[], this.saved={},	this.files=[], this.info=[]
	
	this.zipWriter=null
	temp=document.createElement("a")
	temp.href=tab.url
	this.site=temp.hostname
	this.info.push("id="+uid)
	this.info.push("url="+tab.url)
	this.info.push("title="+tab.title)
	Downloader[uid]=this
	zip.createWriter(new zip.BlobWriter,function(writer) {me.zipWriter = writer}, function(m){me.onError(m)});
}
Downloader.prototype={
	start: function(url,deep){
		var me=this
		if(!this.waitUntil(this.zipWriter,function(){me.start(url,deep)}))
			return this
		this.isFirstPage(url) && this.links.unshift({href:this.tab.url,deep:this.deep})
		this.downloading[url||this.tab.url]=1
		if(typeof(deep)=='undefined')
			deep=this.deep-1
		chrome.tabs.sendMessage(this.tab.id,{cmd:"download",url:url,uid:this.uid,deep:deep},function(info){
			me.save(info)
			if(me.isFirstPage(url)){
				me.info.push("home="+info.file.name)
				if(info.cmds.length>10){
					me.info.push("cmds="+info.cmds)
				}
				if(info.icon){
					var a=document.createElement('a')
					a.href=info.icon
					me.info.push("icon="+a.pathname.substring(1))
				}
				me.tryClose()
			}
		})
	},
	isFirstPage:function(url){
		return !url;
	},
	save: function(info){
		var me=this
		info.file.content=new zip.TextReader(info.file.content)
		this.files.push(info.file)
		this.saved[info.url]=1
		this.links.shift()
		delete this.downloading[info.url]
		this.push(info)
	},
	push: function(info){
		for(var i=0,a=info.images,len=a.length;i<len; i++){
			if(a[i] in this.saved || 
				this.images.indexOf(a[i])!=-1 ||
				a[i] in this.downloading)
				continue;
			this.images.push(a[i])
		}
		
		if(this.deep==1)
			return
		
		for(var i=0,a=info.links,len=a.length;i<len; i++){
			if(a[i].href in this.saved || a[i].href in this.downloading)
				continue;
			this.links.push(a[i])
		}
	},
	downloadImage: function(){
		if(this.images.length==0)
			return
		var img=this.images[0], me=this
		me.downloading[img]=1
		var request=new XMLHttpRequest()
		request.addEventListener("load", function() {
			if(request.status==200){
				me.images.shift()
				me.saved[img]=1
				delete me.downloading[img]
				me.files.push({name:me.getFileName(img),
					content:new zip.BlobReader(new Blob([new Uint8Array(request.response)],{type:"image/*"}))})
			}else{
				me.onError(img)
				me.images.shift()
				delete me.downloading[img]
			}
		}, false);
		request.addEventListener("error", function(){
			me.onError(img)
			me.images.shift()
			delete me.downloading[img]
		}, false);
		request.open("GET", img);
		request.responseType = "arraybuffer";
		request.send();
	},
	downloadPage: function(){
		if(this.deep==1 || this.links.length==0)
			return;
		var link=this.links[0]
		if(link.href in this.saved || link.href in this.downloading)
			this.links.shift()
		else			
			this.start(link.href,link.deep-1)
	},
	zip: function(){
		if(this.files.length==0)
			return
		this.add(this.files.shift())
	},
	add:function(file,onAdd){
		var me=this
		try{
			this.zipWriter.add(file.name, file.content,
				function(){
					me.onAdd(file)
					onAdd&&onAdd.call(this,file)
				})
		}catch(e){
			if(e=="File already exists."){
				console.error("already zipped "+file.name)
				return onAdd&&onAdd.call(this,file)
			}
			
			if('tried' in file){
				if(file.tried>3){
					if(this.errors.indexOf(file.name)==-1){
						this.errors.push(file.name)
						this.onError("Failed to save "+file.name+" with error: "+e)
					}
					onAdd&&onAdd.call(this,file)
				}else{
					file.tried+=1
					this.files.push(file)
				}
			}else{
				file.tried=1
				this.files.push(file)
			}
		}
	},
	onError: function(m){
		console.error(m)
	},
	onAdd: function(file){
		console.info("added "+file.name)
	},
	getFileName: function(url){
		return url.substring(url.indexOf('/',9)+1).replace('?','%3F')
	},
	tryClose: function(onClose){
		var me=this
		if(!this.waitUntil(this.finished(),function(){me.tryClose(onClose)})){
			this.zip()
			this.downloadImage()
			this.downloadPage()
			return
		}
		if(this.errors.length>0)
			this.info.push("errors="+this.errors.join(','))
		this.add({name:"info.properties",content:new zip.TextReader(this.info.join('\n'))},function(){
			me.zipWriter.close(function(blob){
				me.images=me.links=me.errors=me.saved=me.files=null
				me.zipWriter=null
				chrome.tabs.sendMessage(me.tab.id,{cmd:"save",zipURL:URL.createObjectURL(blob),uid:me.uid})
				delete Downloader[me.uid]
			})
		})
	},
	waitUntil: function(a, h){
		if(!a){
			var me=this
			setTimeout(function(){h.apply(me)},1000)
			return false;
		}
		return true
	},
	finished: function(){
		return this.files.length==0 &&
			this.images.length==0 &&
			this.links.length==0;
	}
}
