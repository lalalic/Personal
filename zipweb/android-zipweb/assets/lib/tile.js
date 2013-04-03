window.TileLayer={
	resizeListened:false,
	menu:false,
	colors:["00A0B1","2E8DEF","A700AE","643EBF","BF1E4B","0A5BC4","DC572E","00A600","00A0B1","A700AE","643EBF","BF1E4B"],
	init: function(container,max,min,rows,cols,menu){
		max=max||200,min=min||75,rows=rows||2,cols=cols||3
		var $container=$$(container),
			fullWidth=$container.width(), fullHeight=$container.height()
		var b=this.createStyleSheet() 
			style=b.cssRules[b.insertRule(".tile{float:left;margin:5px; max-width:"+max+"px;min-width:"+min+"px;max-height:"+max+"px;min-height:"
					+min+"px;border:0;padding:0;text-align:center;background:no-repeat center;border-radius:5px}",0)].style
		var w=(this.lastWidth=fullWidth),h=(this.lastHeight=fullHeight),
			rcMin=Math.min(rows,cols), rcMax=Math.max(rows,cols),
			width=Math.floor(w/(w<h?rcMin:rcMax)-10),height=Math.floor(h/(w>h?rcMin:rcMax)-10)
		style.width=width+"px"
		style.height=height+"px"
		style.lineHeight=Math.min(max,height)+"px"
		this.container=container;
		this.last=this.container.firstChild
		width=Math.min(max,width)
		var n=Math.floor(fullWidth/(width+10)),
			leftWidth=Math.floor((fullWidth-n*(width+10))/(n-1)),
			selectors=[".tile:nth-of-type("+n+"n)"]
		for(var i=2;i<n;i++)
			selectors.push(".tile:nth-of-type("+n+"n+"+i+")")
		b.insertRule(selectors.join(',')+"{margin-left:"+(leftWidth+5)+"px}",b.cssRules.length)
		if(!this.resizeListened){
			this.resizeListened=true
			window.addEventListener('resize',function(){
				if(TileLayer.lastWidth==fullWidth &&
					TileLayer.lastHeight==fullHeight)
					return
				TileLayer.init(container,max,min,rows,cols)
			})
		}
		
		if(menu){
			this.menu=menu
			document.addEventListener('click',function(){
				$$(menu).hide()
			})
		}
		return this
	},
	createStyleSheet: function(){
		var stylesheet=document.querySelector('style#tile')
		if(!stylesheet){
			stylesheet=document.createElement('style')
			stylesheet.id='tile'
			document.head.insertBefore(stylesheet,null)
		}else{
			var sheet=stylesheet.sheet
			while(sheet.cssRules.length)
				sheet.removeRule(0)
		}
		return stylesheet.sheet;
	},
	add: function(title,onclick,icon){
		var tile=document.createElement('div')
		tile.className='tile'
		tile.style.backgroundColor='#'+this.colors[Math.floor((Math.random()*10)+1)]
		onclick && tile.addEventListener('click',onclick)
		this.menu && $$(tile).hold(function(){
			TileLayer.current=this
			$$(menu).show()
		})
		try{
			this.container.insertBefore(tile,this.last)
		}catch(eror){
			this.container.insertBefore(tile,(this.last=this.container.firstChild))
		}
		if(icon){
			tile.style.backgroundImage="url("+icon+")"
			tile.style.backgroundSize="50% 50%"
		}else{
			tile.innerHTML="<span>"+title+"</span>"
		}
		return tile;
	}
}
