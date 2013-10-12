define(['view/View'],function(View){
	var ViewGroup=function(){
		if(!arguments.length) return;
		View.call(this,arguments);
		this.children=[];
	};
	ViewGroup.prototype=new View();
	ViewGroup.prototype.add=function(v,i){
		this.children.push(v);
		v.parent=this;
	};
	ViewGroup.prototype.remove=function(v){
		this.children.remove(v);
		v.parent=null;
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
	return ViewGroup;
})