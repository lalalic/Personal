define(['view/ViewGroup'],function(ViewGroup){
	var RelativeLayout=function(){
		ViewGroup.call(this,arguments);
	};
	this.RelativeLayout=RelativeLayout;
	RelativeLayout.prototype=new ViewGroup();
	return RelativeLayout;
})