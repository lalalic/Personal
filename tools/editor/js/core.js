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
	var View=function(){};
	this.View=View;
	View.prototype.draw=function(canvas){};
	
	
	var Selection=function(){};
	this.Selection=Selection;
	Selection.prototype=new View();
	Selection.prototype.draw=function(canvas){};
}).call(Editor);

