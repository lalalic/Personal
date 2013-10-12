define(function(){
	if(!console.debug)
		console.debug=console.info;
		
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
})