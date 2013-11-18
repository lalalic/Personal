define(['view/View'],function(View){
	var Selection=function(){
			View.call(this,arguments);
		}, input;
	Selection.prototype=new View();
	Selection.prototype.INTERVAL=500;
	Selection.prototype.start=Selection.prototype.end=null
	Selection.prototype.last={left:-1}
	View.prototype.clazz="Selection"
	function _draw(canvas){
		if(!this.start){
			this.end=this.start={
				x:input.position.left+input.getContentLeft(), 
				y:input.position.top+input.getContentTop()
			};
		}
		var paint=canvas.getContext("2d"),
			w=paint.lineWidth;
			height=input.metrics.height;
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
	Selection.prototype.setHolder=function(view){
		input=view
		this.position.left=input.position.left
		this.position.top=input.position.top
		this.end=this.start=null;
	};
	
	Selection.prototype.getHolder=function(){
		return input
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
	Selection.prototype.isRoot=function(){
		return false
	}
	return new Selection();
})