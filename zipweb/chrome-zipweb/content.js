Selection.prototype.extend = function() {
    var r=document.createRange(),
		c=this.getRangeAt(0).commonAncestorContainer
	r.selectNode(this.getRangeAt(0).commonAncestorContainer)
    this.removeAllRanges();
	this.addRange(r)
    return c;
}
NodeList.prototype.indexOf = function(n){
	for(var i=0;i<this.length;i++)
		if(n==this[i])
			return i;
	return -1
}
NodeList.prototype.filters = function(){
	var result=[]
	for(var i=0,n;i<this.length;i++){
		n=this[i]
		result.indexOf(n)==-1 && result.push(n)
		while(n.parentElement){
			result.indexOf(n.parentElement)==-1 && result.push(n.parentElement)
			n=n.parentElement
		}
	}
	return result
}
window.$1=function (selector,context){
	return document.querySelector(selector,context||document)
},
window.$9=function (selector,context){
	return document.querySelectorAll(selector,context||document)
}
window.xPath=new XPathEvaluator()
xPath.query=function(path){
	if(!path)
		return null
	return this.evaluate(path, document.documentElement, null,XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue	 
}
xPath.getPath=function(elm) { 
	var elm=elm||document.getSelection().getRangeAt(0).commonAncestorContainer,segs
    for (segs = []; elm && elm!=document.body && elm.nodeType==1; elm = elm.parentElement) { 
        if (elm.hasAttribute('id')) { 
                segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]')
                break 
        } else if (elm.hasAttribute('class')) { 
            var s=elm.localName.toLowerCase() + '.' + elm.getAttribute('class')
			s=elm.localName.toLowerCase()+'[@class="'+ elm.getAttribute('class')+'"]['+($9(s,elm.parentElement).indexOf(elm)+1)+']'
			segs.unshift(s)
        } else { 
            var s=elm.localName.toLowerCase()
			s=elm.localName.toLowerCase()+'['+($9(s,elm.parentElement).indexOf(elm)+1)+']'
			segs.unshift(s)
        }
    }
    return segs.length ? '//' + segs.join('/') : null; 
}


window.cleaner={
	cmds:[],
	icon:false,
	clearAbove:	function (a,filter,n,p){
		if(!a) return;
		filter=filter||[]
		p=a.parentNode
		while((n=a.previousElementSibling) && filter.indexOf(n)==-1)
			p.removeChild(n)
	},
	clearBelow:	function (a,filter,n,p){
		if(!a) return;
		p=a.parentNode
		filter=filter||[]
		while((n=a.nextElementSibling) && filter.indexOf(n)==-1)
			p.removeChild(n)
	},
	clearBoth: function (a,filter){
		this.clearAbove(a,filter)
		this.clearBelow(a,filter)
	},
	clearNode: function (a){
		if(!a) return;
		if('length' in a){
			for(var i=0;i<a.length;i++)
				a[i].parentNode.removeChild(a[i])
		}else{
			a.parentNode.removeChild(a)
			delete a
		}
	},
	clearBase: function (){
		this.clearNode($9('[display=none]'))
		this.clearNode($9('meta'))
		this.clearNode($9('script'))
		this.clearNode($9('iframe'))
		this.clearBase=function(){}
	},
	clearContentAndMenu: function (content,menu){
		content && this.markContent(content)
		menu && this.markMenu(menu)
		
		var keeped=$9('.keepme'),
			filters=keeped.filters(),
			selectors=[],
			style,content
		
		for(var i=0;i<keeped.length;i++){
			var keep=keeped[i]
			keep.classList.remove('keepme')
			this.clearBoth(keep,filters)
			while((keep=keep.parentElement) && keep!=document.body)
				this.clearBoth(keep,filters)
		}
		
		filters=$9('.makecontent').filters()
		for(var i=0,n; i<filters.length;i++){
			n=xPath.query(xPath.getPath(filters[i]))
			if(!n) continue
			if(n.classList.contains('makecontent')){
				n.classList.remove('makecontent')
				content=n
				for(var j=0;j<content.children.length;j++)
					content.children[j].style.width="100%"
			}
			style=n.style
			style.margin=0
			style.border=0
			style.padding=0
			style.width="100%"
		}
		var menu=$1('.makemenu')
		if(!menu) return
		menu.classList.remove('makemenu')
		document.body.style.marginLeft="12px"
		style=menu.style
		style.overflow="hidden"
		style.position="fixed"
		style.minHeight="100%"
		style.margin=0
		style.padding=0
		style.border="1px solid lightgreen"
		style.width='0px'
		style.left='-2px'
		style.borderLeft="solid 12px lightgreen"
		style.backgroundColor="white"
		style.zIndex=99999
	},
	markContent: function(content){
		content=content||document.getSelection().extend()
		var classes=content.classList
		classes.add('keepme')
		classes.add('makecontent')
	},
	markMenu: function(menu){
		menu=menu||document.getSelection().extend()
		var classes=menu.classList
		classes.add('keepme')
		classes.add('makemenu')
		classes.add('itismenu')
	},
	clearScriptAndStyle: function(){
		//trim css
		var css=[]
		for(var style,styles=document.styleSheets,len=styles.length, i=0;i<len;i++){
			if((style=styles[i]).disabled)
				continue;
			if(style.href && style.href.search(document.location.hostname)==-1)
				continue;

			for(var rules=style.cssRules,j=0,rule;j<rules.length;j++){
				rule=rules[j]
				if($1(rule.selectorText))
					css.push(rules[j].cssText)
			}
		}
		
		//trim link,styles
		this.clearNode($9("style"))
		this.clearNode($9('link'))
		var el=document.createElement('style')
		document.head.insertBefore(el,document.head.firstChild)
		el.innerHTML=css.join('')+"\r\n"
		
		el=document.createElement('script')
		el.src="file:///android_asset/lib/quo.min.js"
		document.head.insertBefore(el,document.head.firstChild)
	},
	clearSpecified: function(){
		var cmd
		while((cmd=this.cmds.shift())){
			var content=xPath.query(cmd.content)
			if(!content) continue
			
			switch(cmd.cmd){
				case 'clear':
					this.clearContentAndMenu(content,xPath.query(cmd.menu))
				break
				case "Node":
				case "Above":
				case "Below":
					this['clear'+cmd.cmd](content)
				break
			}
		}
	},
	_toRelatives: function(){
		var host=document.location.hostname,
			path=document.location.pathname
		if(path=="/")
			path="."
		else{
			path=path.substring(1,path.lastIndexOf('/'))
			path=path.replace(/\w+/g,'..')
		}
		
		for(var i=0,imgs=document.images,img,a=document.createElement("a");i<imgs.length;i++){
			img=imgs[i]
			a.href=img.src
			if(a.hostname!=host) continue
			img.src=path+a.pathname
		}
		for(var i=0,links=document.links,link,a;i<links.length;i++){
			link=links[i]
			if(((a=link.protocol.toLowerCase())!='http:' && a!="https:" ) ||
				link.hostname!=host)
				continue
			link.href=path+link.pathname
		}
	},
	getPageInfo: function(uid,deep){
		var info={images:[],links:[],uid:uid,url:location.href.replace(location.hash,''),cmd:"content"}
		info.file={name:location.pathname.substring(1)+location.search.replace('?','%3F')}
		for(var i=0,d=document.images,l=d.length;i<l;i++)
			info.images.push(d[i].src)
			
		if(deep>0){
			for(var i=0,d=document.links,l=d.length,a,b;i<l;i++){
				a=d[i]
				if((b=a.protocol.toLowerCase())!='http:' && b!="https:" )
					continue
				if(a.host!=location.host && a.hostname!=location.hostname)
					continue
				if(a.href==location.href)
					continue
				info.links.push({href:d[i].href.replace(d[i].hash,''),deep:deep})
			}
		}
		
		this._toRelatives()
		info.file.content=$1('html').outerHTML
		return info
	},
	save:function(uid){
		this.uid=uid
		return (localStorage[uid+"_clean"]=JSON.stringify(this.cmds))
	},
	restore: function(uid){
		this.uid=uid
		this.cmds=JSON.parse(localStorage[uid+"_clean"])
	},
	release: function(uid){
		localStorage.removeItem(uid+"_clean")
	},
	save2Cloud: function(){
		var request=new XMLHttpRequest(),data=[]
		data.push("url="+btoa(location.href))
		data.push("title="+btoa(document.title))
		data.push("cmds="+btoa(JSON.stringify(this.cmds)))
		var n=$1("meta[name$=eywords],meta[name=KEYWORDS]")
		if(n){
			var keywords=n.getAttribute('content').split(",")
			keywords=keywords.length>5 ? keywords.slice(0,5) : keywords
			data.push("tags="+btoa(keywords.join(',')))
		}	
			
		if((n=$1("meta[name$=escription],meta[name=DESCRIPTION]")))
			data.push('description='+btoa(n.getAttribute('content')))

		this.icon && data.push('thumbnail='+btoa(this.icon))
		
		request.open("POST","http://www.getzipweb.com/book/post",true)
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded")
		request.send(data.join('&'))
	}
}


chrome.extension.onMessage.addListener(function(info,sender,sendResponse){
	switch(info.cmd){
	case "clean":
		cleaner.clearBase()
		cleaner.clearSpecified()
		cleaner.clearScriptAndStyle()
		break
	case "save":
		var a=document.createElement("a")
		document.body.appendChild(a)
		a.href=info.zipURL
		a.download=document.title+".zip"
		a.click()
		document.body.removeChild(a)
		window.onunload=function(){	cleaner.release(info.uid)}
		console.debug("saved "+a.download)
		break
	case "download":
		if(info.url){
			open(info.url+"#autodownload_"+info.uid+"_"+info.deep)
		}else{
			cleaner.clearBase()
			if($1('.keepme')){
				cleaner.cmds.push({cmd:'clear',
					content:xPath.getPath($1('.makecontent')), 
					menu: xPath.getPath($1('.makemenu'))})
				cleaner.clearContentAndMenu()
			}
			cleaner.clearScriptAndStyle()
			var res=cleaner.getPageInfo(info.uid,info.deep)
			res.cmds=cleaner.save(info.uid)
			res.title=document.title
			
			if(cleaner.icon)
				res.images.push(res.icon=cleaner.icon)
			else if(res.images.length)
				cleaner.icon=(res.icon=res.images[0])
			
			cleaner.save2Cloud()
			sendResponse(res)
		}
		break
	
	case "content":
		cleaner.markContent()
		break
	case "menu":
		cleaner.markMenu()
		break
	case "clear":
		cleaner.cmds.push({cmd:'clear',
			content:xPath.getPath($1('.makecontent')), 
			menu: xPath.getPath($1('.makemenu'))})
		cleaner.clearContentAndMenu()
		break
	case "Node":
	case "Above":
	case "Below":
		var path=xPath.getPath()
		if(!path) break
		var n=xPath.query(path)
		if(!n) break
		cleaner['clear'+info.cmd](n)
		cleaner.cmds.push({cmd:info.cmd,content:path})
		break
	case "icon":
		cleaner.icon=info.info.srcUrl
		break
	}
})

document.addEventListener('DOMContentLoaded', function (a,b,c,m) {
	if((m=location.href.match(/#autodownload_(\d+)_(\d+)/))){
		var uid=m[1],deep=m[2]
		cleaner.restore(uid)
		cleaner.clearBase()
		cleaner.clearSpecified()
		cleaner.clearScriptAndStyle()
		console.debug("cleaned "+location.href)
		chrome.extension.sendMessage(null,cleaner.getPageInfo(uid,deep),function(){
			close()
		})		
	}else{
		chrome.extension.sendMessage(null,{cmd:'NewDocument'})
	}
})
