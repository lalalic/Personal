define(function(){
	return function(s){
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
	}
})