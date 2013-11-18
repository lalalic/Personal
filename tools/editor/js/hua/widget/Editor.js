define(['view/ViewGroup','view/FontMetrics','view/Selection','widget/Input'],
function(ViewGroup,FontMetrics,selection,Input){
	var Editor=function(canvas,doc){
		ViewGroup.call(this,arguments)
		this.document=doc||(new Editor.Document());
		var me=this,
			metrics=(this.metrics=new FontMetrics("12px 'Courier New', Courier, monospace"))
		
		this.setCanvas(canvas);
		var paint=this.paint
		canvas.tabIndex=0;
		paint.font=this.metrics.style;
		paint.textBaseline="bottom";
		paint.lineWidth=1;
		this.size.width=canvas.width;
		this.size.height=canvas.height;
		
		this.add(new Input(metrics));
		this.add(new Input(metrics));
		this.draw(canvas);
		this.children[0].focus();
		
	};
	
	Editor.version="0.1";	
	Editor.prototype=new ViewGroup();
	Editor.prototype.clazz="Editor"
	
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
	
	return Editor;
})