(function(){
	document.ready=function(f){
		this.addEventListener('DOMContentLoaded',f);
	};
	
	HTMLElement.prototype.getAbsolutePosition=function(){
		var curleft = 0, curtop = 0, obj=this;
	    if(obj.offsetLeft) curleft += parseInt(obj.offsetLeft);
	    if(obj.offsetTop) curtop += parseInt(obj.offsetTop);
	    if(obj.scrollTop && obj.scrollTop > 0) curtop -= parseInt(obj.scrollTop);
	    if(obj.offsetParent) {
	        var pos = obj.offsetParent.getAbsolutePosition();
	        curleft += pos.left;
	        curtop += pos.top;
	    } else if(obj.ownerDocument) {
	        var thewindow = obj.ownerDocument.defaultView;
	        if(!thewindow && obj.ownerDocument.parentWindow)
	            thewindow = obj.ownerDocument.parentWindow;
	        if(thewindow) {
	            if(thewindow.frameElement) {
	                var pos = thewindow.frameElement.getAsbolutePosition();
	                curleft += pos.left;
	                curtop += pos.top;
	            }
	        }
	    }

	    return {left:curleft,top:curtop};
	};
	if(!Array.prototype.each)
		Array.prototype.each=function(f){for(var i=0;i<this.length;i++) f.call(this[i],i,this[i]);};
	if(!Array.prototype.remove)
		Array.prototype.remove=function(v){
			var i=this.indexOf(v);
			if(i!=-1)
				return this.splice(i,1);
		};
	
	this.ui=function(){}
	
}).call(this);

(function(){
	var FontMetrics=function(s){
		var div=document.createElement('div'),
			body=document.body;
		this.style=s;
		with(div.style){
			font=s;
			position="absolute";
			whiteSpace="nowrap";
		}
		body.appendChild(div);
		div.innerHTML="m";
		
		this.height=div.offsetHeight;
		this.width=div.offsetWidth;
		
		
		var span=document.createElement('span');
		with(span.style){
			display="inline-block";
			height="1px";
			width="1px";
			overflow="hidden";
		}
		div.appendChild(span);
		this.baseline=span.offsetTop+span.offsetHeight;
		body.removeChild(div);		
	};
	this.FontMetrics=FontMetrics;
}).call(ui);

(function(){
	var View=function(){
		if(!arguments.length) return;
		this.margin={left:0,top:0,right:0,bottom:0};
		this.border={left:0,top:0,right:0,bottom:0};
		this.padding={left:0,top:0,right:0,bottom:0};
		this.position={left:0,top:0,right:0,bottom:0};
		this.offset={left:0,top:0,right:0,bottom:0};
		this.size={width:0,height:0};
		this.style={};
		this.eventBindings={};
	};
	this.View=View;
	View.prototype.draw=function(canvas){
		if(this.isRoot()){
			this.size.width=canvas.width;
			this.size.height=canvas.height;
		}
		this.position.right=this.position.left+this.size.width;
		this.position.bottom=this.position.top+this.size.height;
		var me=this;
		if(!this.canvas)
			this.setCanvas(canvas);
		
		//content
		this.onDraw(canvas);
		//children
		this.dispatchDraw(canvas);
		//scrollbar
		this.onDrawScrollBars(canvas);
		//background

		//border
		this.drawBorder(canvas); 
		
		"keydown,keypress,keyup,click,dblcick,mousedown,mouseup,touchstart,touchend,touchcancel,focus,blur".split(",")
		.each(function(i,e){
			canvas.addEventListener(e,function(event){
				if(me.isInBounds(event))
					me.triggerEvent(event)
			});
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
		if(!(e in this.eventBindings))
			this.eventBindings[e]=[]
		this.eventBindings[e].push(f)
	};
	View.prototype.unbindEvent=function(e, f){
		if(!(e in this.eventBindings))
			return;
		this.eventBindings[e].remove(f)
	};
	
	View.prototype.isInBounds=function(e){
		return e.offsetX<=this.position.right && e.offsetX>=this.position.left 
			&& e.offsetY<=this.position.bottom && e.offsetY>=this.position.top;
	};
	
	View.prototype.triggerEvent=function(e){
		if(!(e.type in this.eventBindings))
			return;
		console.debug(e.type+" triggered");
		for(var i=0,hs=this.eventBindings[e.type],len=hs.length,f; i<len;i++)
			if(e.cancelBubble || !(f=hs[i]).call(this,e))
				break
	};
	
	View.prototype.isRoot=function(){
		return false;
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
	
	

	/**
	 * with Children
	 */
	var ViewGroup=function(){
		if(!arguments.length) return;
		View.call(this,arguments);
		this.children=[];
	};
	this.ViewGroup=ViewGroup;
	ViewGroup.prototype=new View();
	ViewGroup.prototype.add=function(v,i){
		this.children.push(v);
	};
	ViewGroup.prototype.remove=function(v){
		this.children.remove(v);
	};
	ViewGroup.prototype.get=function(v){
		
	};
	
	ViewGroup.prototype.dispatchDraw=function(canvas){
		var lastView=null, 
			me=this, 
			contentWidth=this.getContentWidth(),
			contentHeight=this.getContentHeight(),
			contentLeft=this.getContentLeft(),
			contentTop=this.getContentTop();
		if(this.children.length){
			with(this.children[0]){
				position.left=contentLeft;
				position.top=contentTop;
				offset.left=this.margin.left+this.border.left+this.padding.left;
				offset.top=this.margin.top+this.border.top+this.padding.top;
			}
		}
		
		this.children.each(function(i,view){
			if(view.size.width==0)
				view.size.width=contentWidth;
				
			if(lastView){
				view.offset.left=lastView.offset.left;
				view.offset.top=lastView.offset.top+lastView.size.height;
				view.position.left=lastView.position.left;
				view.position.top=me.position.top+view.offset.top;
			}
			
			view.draw(canvas);
			lastView=view;
		});
	};
	
	
	var RelativeLayout=function(){
		ViewGroup.call(this,arguments);
	};
	this.RelativeLayout=RelativeLayout;
	RelativeLayout.prototype=new ViewGroup();
	
	var LinearLayout=function(){ViewGroup.call(this,arguments);};
	this.LinearLayout=LinearLayout;
	LinearLayout.prototype=new ViewGroup();
	
	var FrameLayout=function(){ViewGroup.call(this,arguments);};
	this.FrameLayout=FrameLayout;
	FrameLayout.prototype=new ViewGroup();

	/**
	 * selection for input
	 */
	var Selection=this.Selection=function(input){
		if(!arguments.length) return;
		View.call(this,arguments);
		this.input=input;
		this.end=this.start=null;
		this.last={left:-1};
	};
	Selection.prototype=new View();
	Selection.prototype.INTERVAL=500;
	function _draw(canvas){
		if(!this.start){
			this.end=this.start={
				x:this.input.position.left+this.input.getContentLeft(), 
				y:this.input.position.top+this.input.getContentTop()
			};
		}
		var paint=canvas.getContext("2d"),
			w=paint.lineWidth;
			height=this.input.metrics.height;
		if(this.last.left==-1){
			this.last={left:this.start.x, top:this.start.y, right:this.start.x+w, bottom:this.start.y+height};
			paint.beginPath();
			paint.moveTo(Math.floor(this.start.x+w/2)+0.5, this.start.y);
			paint.lineTo(Math.floor(this.start.x+w/2)+0.5, this.start.y+height);
			paint.stroke();
		}else{
			this.clean();
		}
	};
	
	Selection.prototype.onDraw=function(canvas){
		if(!this.timer){
			var me=this;
			this.timer=setInterval(function(){_draw.call(me,canvas);},500);
		}
	};
	Selection.prototype.clean=function(){
		this.paint.clearRect(this.last.left,this.last.top,this.last.right, this.last.bottom);
		this.last={left:-1};
	}
	Selection.prototype.validate=function(){
		this.draw(this.canvas);
	};
	Selection.prototype.invalidate=function(){
		if(this.timer){
			clearInterval(this.timer);
			this.clean();
			this.timer=null;			
		}
	};	
	/**
	 * one line input
	 */
	var Input=this.Input=function(metrics,selection){
		View.call(this,arguments);
		var me=this;
		this.text="";
		this.metrics=metrics;
		this.selection=selection;
		this.size.height=metrics.height;
		this.border.bottom=1;
		
		this.bindEvent('keypress',function(e){
			selection.invalidate();
			me.insertText(String.fromCharCode(e.which));
			selection.validate();
		})
		
		this.bindEvent('click',function(e){
			this.focus();
		})
		
		this.bindEvent('keyup',function(e){
			selection.invalidate();
			switch(e.keyCode) {
		    case 8: // Backspace
		      me.deleteBackChar();
		      break;
		    case 46: // Delete
		      me.deleteChar();
		      break;
		    case 13: // Enter
		      me.insertP('\n');
		      break;
		    case 37: // Left arrow
		      selection.moveLeft(1, this.shiftPressed);
		      break;
		    case 38: // Up arrow
		      selection.moveUp(1, this.shiftPressed);
		      break;
		    case 39: // Right arrow
		      selection.moveRight(1, this.shiftPressed);
		      break;
		    case 40: // Down arrow
		      selection.moveDown(1, this.shiftPressed);
		      break;
			}
			selection.validate();
		});
	};
	Input.prototype=new View();
	Input.prototype.isInBounds=function(e){
		if(e.type.match(/key/gi)){
			return this.selection.input==this;
		}else
			return View.prototype.isInBounds.call(this,arguments);
	}
	
	Input.prototype.onDraw=function(canvas){
		if(this.text){
			var t=this.text;
			this.text="";
			this.insertText(t);
		}
	};
	
	Input.prototype.focus=function(){
		this.selection.input=this;
		this.selection.draw(this.canvas);
	}
	
	Input.prototype.insertText=function(text){
		var _text=this.paint.measureText(text),
			start=this.selection.start,
			height=this.metrics.height;
		this.paint.fillText(text, start.x,start.y+height);
		start.x+=_text.width;
	};
	
	Input.prototype.deleteBackChar=function(){
		
	};
	
	Input.prototype.deleteChar=function(){
		
	};
	
}).call(ui);

(function(){
	var Editor=this.Editor=function(canvas,doc){
		ui.ViewGroup.call(this,arguments)
		var me=this,
		metrics=(this.metrics=new ui.FontMetrics("12px 'Courier New', Courier, monospace"));
		this.document=doc||(new ui.Editor.Document());
		selection=(this.selection=new ui.Selection(this));
		
		this.setCanvas(canvas);
		canvas.tabIndex=0;
		var paint=this.paint;
		paint.font=this.metrics.style;
		paint.textBaseline="bottom";
		paint.lineWidth=1;
		this.size.width=canvas.width;
		this.size.height=canvas.height;
		
		this.add(new ui.Input(metrics,selection));
		this.add(new ui.Input(metrics,selection));
		this.draw(canvas);
		this.children[0].focus();
	};
	
	Editor.version="0.1";	
	Editor.prototype=new this.ViewGroup();
	
	Editor.prototype.isRoot=function(){
		return true;
	};
	
		
	(function(){
		var Document=function(){};
		this.Document=Document;
		Document.prototype=new String();
		Document.prototype.parse=function(){
			
		};
		
		var P=function(){};
		this.P=P;
		P.prototype=new String();
	}).call(Editor);
	
}).call(ui);
