/**
 * splash page when start up application
 * @module Splash
 */
define(['UI'],function(View){
	return new (View.Page.extend({
		el:'#splash',
		current:0,
		initialize:function(){
			this.width=this.$el.width()
			var style={width:this.width,height:this.$el.height()}
			this.$slides=this.$('.slides>div')
			this.length=this.$slides.each(function(i,slide){$(slide).css(style)}).length
			this.style=this.$('.slides').css('width',(this.$slides.length*style.width)+"px").get(0).style
			this.style.transitionDuration='500ms'
			_.each('MozT,webkitT,msT,OT'.split(','),function(a){
				this.style[a+'ransitionDuration']=this.style.transitionDuration
			},this)
		},
		show: function(){
			this._super().show.apply(this,arguments)
			var me=this
			if(this.length>1)
				this.interval=setInterval(function(){me.slide()},1500)
		},
		slide: function(index){
			var i=index
			if(i==undefined)
				i=this.current
			this.style.MozTransform=this.style.webkitTransform="translate3d(" + -(i * this.width) + "px,0,0)";
			this.style.msTransform=this.style.OTransform="translateX(" + -(i * this.width) + "px)";
			if(index==undefined)
				this.current++
			else
				this.current=index
			this.current=this.current%this.length
		}
	}))();
})