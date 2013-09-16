(function(){
	document.ready=function(f){
		this.addEventListener('DOMContentLoaded',f);
	};
}).call(this)


(function(){
	var Editor=function(){};
	Editor.version="0.1";
	this.Editor=Editor;
}).call(this);


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

(function(){
	var FontMetrics=function(s){
		s && (this.style=s) && this.init(s);
	};
	this.FontMetrics=FontMetrics;
	FontMetrics.prototype.STYLE="'Courier New', Courier, monospace 12px";
	FontMetrics.prototype.init(s){
		var div=document.createElement('div'),
			body=document.body;
		div.style=(s||this.style||this.STYLE)+";position:absolute;white-space: nowrap;";
		body.appendChild(div);
		div.innerHTML="m";
		
		this.height=div.offsetHeight;
		this.width=div.offsetWidth;
		body.removeChild(div);
		
		var span=document.createElement('span');
		span.style="display:inline-block;height:1px;width:1px;overflow:hidden;";
		body.appendChild(span);
		this.baseline=span.offsetTop+span.offsetHeight;
		boyd.removeChild(span);		
	};
}).call(Editor);

(function(){
	var View=function(){};
	this.View=View;
	View.prototype.draw=function(canvas){
		//background
		//content
		this.onDraw(canvas);
		//children
		this.dispatchDraw(canvas);
		//scrollbar
		this.onDrawScrollBars(canvas);
	};
	View.prototype.onDraw=function(){
		
	};
	View.prototype.dispatchDraw=function(){
	};
	View.prototype.onDrawScrollBars=function(){
		
	};
	
	
	
	
	var Selection=function(){};
	this.Selection=Selection;
	Selection.prototype=new View();
	Selection.prototype.draw=function(canvas){
		
	};
	
	var ViewGroup=function(){};
	this.ViewGroup=ViewGroup;
	ViewGroup.prototype=new View();
	
	var RelativeLayout=function(){};
	this.RelativeLayout=RelativeLayout;
	RelativeLayout.prototype=new ViewGroup();
	
	var FlowLayout=function(){};
	this.FlowLayout=FlowLayout;
	FlowLayout.prototype=new ViewGroup();
	
	var LinearLayout=function(){};
	this.LinearLayout=LinearLayout;
	LinearLayout.prototype=new ViewGroup();
	
	var FrameLayout=function(){};
	this.FrameLayout=FrameLayout;
	FrameLayout.prototype=new FrameLayout();
	
}).call(Editor);

