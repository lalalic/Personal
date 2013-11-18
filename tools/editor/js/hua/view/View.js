define(function(){
	var View=function(){
		this.margin={left:0,top:0,right:0,bottom:0};
		this.border={left:0,top:0,right:0,bottom:0};
		this.padding={left:0,top:0,right:0,bottom:0};
		this.position={left:0,top:0,right:0,bottom:0};
		this.offset={left:0,top:0,right:0,bottom:0};
		this.size={width:0,height:0};
		this.style={};
		this.eventBindings={};
		this.parent=null;
		this.name=this.clazz+new Date().getTime()
	};
	
	function bindTextarea(canvas){
		if(canvas.input)
			return
		canvas.insertAdjacentHTML('beforeBegin','<textarea tabindex="-1" style="position:absolute;top:-999px;left:-999px"></textarea>')
		canvas.input=canvas.previousElementSibling
		canvas.parentNode.style.display="inline-block";
		canvas.parentNode.style.outline="none"
		canvas.addEventListener('focus',function(e){
			console.debug('canvas on focus')
			canvas.input.value=""
			canvas.input.focus()
			canvas.parentNode.style.outline="rgb(0,153,255) solid 1px"
			require('view/Selection').validate()
		},false)
		canvas.input.addEventListener('blur',function(){
			console.debug('blur from canvas input')
			require('view/Selection').invalidate()
			canvas.parentNode.style.outline="none"
		},false)
		
		"keydown,keyup,keypress,input".split(',').each(function(i,e){
			canvas.input.addEventListener(e,function(event){
				var input=require('view/Selection').getHolder()
				if(!input)
					return
				input.triggerEvent(event)
			},false)
		})
	};
	
	View.prototype.clazz="View"
	View.prototype.draw=function(canvas){
		if(!this.canvas)
			this.setCanvas(canvas);

		if(this.isRoot()){
			this.size.width=canvas.width;
			this.size.height=canvas.height;
			bindTextarea(canvas)
		}
		this.position.right=this.position.left+this.size.width;
		this.position.bottom=this.position.top+this.size.height;
		var me=this;

		//content
		this.onDraw(canvas);
		//children
		this.dispatchDraw(canvas);
		//scrollbar
		this.onDrawScrollBars(canvas);
		//background

		//border
		this.drawBorder(canvas); 
		
		"click,dblcick,mousedown,mouseup,touchstart,touchend,touchcancel".split(",")
		.each(function(i,e){
			canvas.addEventListener(e,function(event){
				if(me.isInBounds(event))
					me.triggerEvent(event)
			},false)
		})
	};
	View.prototype.onDraw=function(canvas){

	};
	
	View.prototype.dispatchDraw=function(canvas){
		
	};
	
	View.prototype.onDrawScrollBars=function(canvas){
		
	};
	
	View.prototype.getContentLeft=function(){
		return this.margin.left+this.border.left+this.padding.left;
	};
	
	View.prototype.getContentTop=function(){
		return this.margin.top+this.border.top+this.padding.top;
	};
	View.prototype.getContentWidth=function(){
		var me=this, w=this.size.width;
		"margin,border,padding".split(",").each(function(i,a){
			"left,right".split(",").each(function(j,b){
				w-=me[a][b];
			})
		})
		return w;
	};
	
	View.prototype.getContentHeight=function(){
		var me=this, w=this.size.height;
		"margin,border,padding".split(",").each(function(i,a){
			"top,bottom".split(",").each(function(j,b){
				w-=me[a][b];
			})
		})
		return w;
	};
	
	View.prototype.setCanvas=function(canvas){
		this.canvas=canvas;
		this.paint=canvas.getContext('2d');
	}
	
	View.prototype.bindEvent=function(e, f){
		var me=this
		e.split(',').each(function(i,e){
			console.debug('event: binding '+e+' on '+me.name)
			if(!(e in me.eventBindings))
				me.eventBindings[e]=[]
			me.eventBindings[e].push(f)
		})
	};
	View.prototype.unbindEvent=function(e, f){
		var me=this
		e.split(',').each(function(i,e){
			if(!(e in me.eventBindings))
				return;
			me.eventBindings[e].remove(f)
		})
	};
	
	View.prototype.isInBounds=function(e){
		return e.offsetX<=this.position.right && e.offsetX>=this.position.left 
			&& e.offsetY<=this.position.bottom && e.offsetY>=this.position.top;
	};
	
	View.prototype.triggerEvent=function(e){
		if(!(e.type in this.eventBindings))
			return;
		console.debug(e.type+" triggered on "+this.name);
		for(var i=0,hs=this.eventBindings[e.type],len=hs.length,f; i<len;i++)
			if(e.cancelBubble || !(f=hs[i]).call(this,e))
				break
	};
	
	View.prototype.isRoot=function(){
		return this.canvas && !this.parent
	};
	
	View.prototype.drawBorder=function(){
		var paint=this.paint, w,t;
		paint.save();
		paint.translate(this.position.left,this.position.top);
		paint.beginPath();
		if((w=this.border['top'])){
			paint.moveTo(this.margin.left,this.margin.top);
			paint.lineTo(this.size.width-this.margin.left-this.margin.right,this.margin.top);
			paint.lineWidth=w;
		}
		if((w=this.border['right'])){
			paint.moveTo(this.size.width-this.margin.left-this.margin.right,this.margin.top);
			paint.lineTo(this.size.width-this.margin.left-this.margin.right,
				this.size.height-this.margin.top-this.margin.bottom);
			paint.lineWidth=w;
		}
		if((w=this.border['bottom'])){
			paint.moveTo(this.size.width-this.margin.left-this.margin.right,
				(t=Math.floor(this.size.height-this.margin.top-this.margin.bottom)+0.5));
			paint.lineTo(this.margin.left,t);
			paint.lineWidth=w;
		}
		if((w=this.border['left'])){
			paint.moveTo(this.margin.left,this.size.height-this.margin.top-this.margin.bottom);
			paint.lineTo(this.margin.left,this.margin.top);
			paint.lineWidth=w;
		}
		paint.stroke();
		paint.restore();
		
	}
	return View
})