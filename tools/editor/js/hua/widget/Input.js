define(['view/View'],function(View){
	var Input=function(metrics,selection){
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
	return Input;
})