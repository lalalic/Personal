(function ($) {
	function log(msg){
		if($('#DEBUG').length==0){
			$('body').prepend("<div id='DEBUG' style='position:absolute;right:0;width:150px;'></div>")
		}
		$('#DEBUG').append("<div>"+msg+"</div>")
	}
	var UUID=new Date().getTime()
	$.fn.centerAt=function(pos){//center element at pos
		var $this=$(this.get(0)).css(pos),
			offset=$this.position()
		$this.css({left:Math.floor(offset.left-$this.width()/2), top:Math.floor(offset.top-$this.height()/2)})
		return this;
	}
	$.fn.center=function(){//get center of an element
		var $this=$(this.get(0)),
			pos=$(this).position()
		return {left:pos.left+Math.floor($this.width()/2), top:pos.top+Math.floor($this.height()/2)}
	}

{/*utilize path and wire to express object relationship
	network={
		name:'raymond',
		friends:[
			{name:'maomao',friends:[]}	
			{name:'xiongxiong',friends:''}
			{name:'yangyang',friends:''}
			]
		}
	 1. auto align
	 2. movable
	 3. zoomable
	 4. centerable
*/
	$.fn.network=function(options){
		if(typeof(options)=='string')
			return Network.prototype.instance.call(this.get(0),name)
			
		return this.each(function(){
			(new Network(this,options)).init();
		})
		
	}
	var Network=function(element,options){
		var self=this
		this.options=$.extend(true,{
			name:false,
			template:"<div>${name}</div>",
			model:false,
			path:{},
			wire:false
		},options||{})
		this.center=(this.options.path.center || $(element).center())
		
		this.container=$('<div class="networks" style="position:absolute;left:0;top:0"></div>')
			.appendTo(element);
		if(this.options.wire)
			this.options.wire.container=this.container;
		
		this.model=options.model;
		
		$.each(['getNodeModels','zoomPath','zoomNode'],function(index,name){
			if($.isFunction(self.options[name]))
				self[name]=self.options[name];

		})
		
		if(this.options.template.match(/^\s+\<.*/)){
			$(this.options.template)
				.css('display','none')
				.appendTo('body')
				.attr('id',(this.options.template=++UUID))
			this.options.template+="#";
		}
		
		
		//event handler	
		this.dblclick=function(){self.centerIt(this)}
		
	}
	Network.prototype={
		init: function(){
			this.rootNode=this.centerNode
				=this.createNode(this.options,1.2)
				.centerAt(this.center)
				.dblclick(this.dblclick)
			this.render(this.model,this.rootNode,1)
		},
		render:function(model,node,level){	
			var self=this,
				nodeModels=this.getNodeModels(model),
				childNodes=[],
				pathName=++UUID+'',
				path=$.extend(true,{},this.options.path,{center:$(node).center(),zoom:this.zoomPath(level)})
				
			if(nodeModels==null || nodeModels.length==0)
				return;
			
			for(var i=0;i<nodeModels.length;i++)
				childNodes.push(this.createNode(nodeModels[i],level))
			
			$(this.container)
				.path({name:pathName,accept:childNodes,path:path})
			
			if(this.options.wire && node)
				$(node).wire(childNodes,this.options.wire)
			
			$(node).dblclick(this.dblclick)
			
			for(var i=0;i<nodeModels.length;i++)
				this.render(nodeModels[i].model,childNodes[i],level+1)
				
		},
		centerIt: function(node){
			if(this.centerNode.get(0)==$(node).get(0))
				return;
			else
				this.centerNode=$(node)
			$(this.container)
				.css({left:0,top:0})
				
			var pos=$(node).center(),
				rootPos=$(this.rootNode).center(),
				deltaLeft=pos.left-rootPos.left,
				deltaTop=pos.top-rootPos.top,
				containerPos=$(this.container).center()
			containerPos.left-=deltaLeft
			containerPos.top-=deltaTop
			$(this.container)
				.centerAt(containerPos)				
		},
		getNodeModels: function(model){
			if(typeof(model)!=='object')
				return null;
			
			var models=[]
			for(var a in model){
				if($.isFunction(model[a])) continue;
				models.push({name:a, model:model[a]});
			}
			return models;
		},
		createNode: function(node,level){
			var el=$(this.options.template)
				.tmpl(node)
				.appendTo(this.container)
			this.zoomNode(level,el)
			return el
		},
		zoomPath: function(level){
			return 1/(level||1);
		},
		zoomNode: function(level, node){
			level=this.zoomPath(level)
			node.css({width:node.width()*level,height:node.height()*level,'font-size':level*100+'%'})
		}
	}

}
	
{/*align elements on the specified path
option:
	name:false,
	accept:false,
	path:{
		shape:'circle',
		number:false//default equals to $(accept).length
	},
	css:{
		container:'path',
		item:'path-item'
	}

			circle:{
				path:{
					center:false,//left:0,top:0,
					radius:100,
					direction:'clockwise',//counterclockwise, or clockwise
					start: 'top'//top,right,bottom,left
				}
			horizon:{
				path:{
					center:false,//left:0,top:0,
					height:100,
					width:100,
					start:'center'//center,left,right
				}	
			vertical:{	
				path:{
					center:false,//left:0,top:0,
					height:100,
					width:100,
					start:'center'//center,top,bottom
				},				
example:
$('#container').path({name:'category',accept:'.item',path:{shape:'circle'}})
*/

	$.fn.path=function(options){
		if(typeof(options)=='string')
			return Path.prototype.instance.call(this,this.get(0),options)
			
		return this.each(function(){
			(new Path(this,options)).init();
		})
	}
	
	var Path=function(element,options){
		this.options=$.extend(true,{
				name:false,
				accept:false,
				path:{
					shape:'circle',
					number:false//default equals to $(accept).length
				},
				css:{
					container:'path',
					item:'path-item'
				}
			},options)
		this.element=element;
		
		if(this.options.name){
			var path=this.instance()
			if(path!=null)
				return path;
		}else
			this.options.name=new Date().getTime()

		if(!$.isFunction(this.options.path.shape))
			this.options.path=$.extend(true,{},this.impl[this.options.path.shape||'circle'].options,this.options.path)
		this._create();	
	}
	
	Path.prototype={
		impl:{
			circle:{
				options:{
					center:false,//left:0,top:0,
					radius:100,
					zoom:1,
					direction:'clockwise',//counterclockwise, or clockwise
					start: 'top'//top,right,bottom,left
				},
				offset:{
					top:-Math.PI/2,
					right:0,
					bottom:Math.PI/2,
					left:Math.PI
				},
				calc:function(index,path){
					if(!path.center)
						path.center=$(this.element).center()
					
					var offset=this.impl.circle.offset,
						num=path.number,
						zoom=path.zoom||1,
						radius = path.radius*zoom, // user specified radius
						direction=path.direction=='clockwise' ? 1 : -1,
						angleOffset = typeof(path.start)=='string' ? offset[path.start] : path.start, // provide flexibility of angle
						angle = 2 * Math.PI * (parseFloat(index/num)), // radians
						l = path.center.left + (Math.cos(direction*(angle + angleOffset*direction)) * radius), // "left"
						t = path.center.top + (Math.sin(direction*(angle + angleOffset*direction)) * radius); // "top"
					return {left: l, top: t}; // return the x,y coords
				}
			},
			horizon:{
				options:{
					center:false,//left:0,top:0,
					height:100,
					width:100,
					zoom:1,
					start:'center'//center,left,right
				},
				calc: function(index,path){
					if(!path.center)
						path.center={left:$(this.element).width()/2,top:0}
					
					var num=path.number,
						zoom=path.zoom||1,
						height=path.height*zoom,
						width=path.width*zoom,
						start=path.start,
						t=path.center.top+height,
						l=path.center.left
					switch(start){
					case 'left':
						l+=((num-1)/2-index)*width
					break;
					case 'right':
						l+=(index-(num-1)/2)*width
					break
					default:	
						l+=(index%2==1 ? -1 : 1)*Math.ceil(index/2)*width
					}	
					return {left:l,top:t}
				}
			},
			vertical:{
				options:{
					center:false,//left:0,top:0,
					height:100,
					width:100,
					start:'center'//center,top,bottom
				},
				calc: function(index,path){
					if(!path.center)
						path.center={top:$(this.element).height()/2,left:0}
					var num=path.number,
						zoom=path.zoom||1,
						height=path.height*zoom,
						width=path.width*zoom,
						start=path.start,
						l=path.center.left+height,
						t=path.center.top
					switch(start){
					case 'top':
						t+=(index-(num-1)/2)*width
					break;
					case 'bottom':
						t+=((num-1)/2-index)*width
					break;
					default:
						t+=(index%2==1 ? -1 : 1)*Math.ceil(index/2)*width
					}
					return {left:l,top:t}
				}
			},
			arc:{},
			ellipse:{}
		},
		instance:function(el,name){
			if(el!=undefined && name!=undefined)
				return $(el).data('path-'+name);
			return $(this.element).data(this._name())
		},
		_name:function(){
			return 'path-'+this.options.name;
		},
		_create: function(){
			$(this.element).data(this._name(),this)
			for(var i in this.options.css)
				this.options.css[i]=this.options.css[i]+" "
					+this.options.css[i]+"-"+this.options.path.shape;
			$(this.element).addClass(this.options.css.container)
		},
		init: function(){
			var self=this
			this._items=$(this.options.accept,this.element).toArray()
			if(this.options.path.number===false)
				this.options.path.number=this._items.length
				
			this.refresh()
		},
		get: function(index){
			return this._items[index]
		},
		add: function(item){
			var $item=$(item)
			this._items.push($item
					.addClass(this.options.css.item)
					.centerAt(this._xy(this._current++))
					.trigger('move'))
		},
		_xy: function (index){
			return (this.impl[this.options.path.shape] ? this.impl[this.options.path.shape].calc : this.options.path.shape).call(this,index,this.options.path)
		},
		refresh: function(){
			var self=this
			this._current=0;
			$(this._items).each(function(){self.add(this)})			
		},
		set: function(key,value){
			switch(key){
			case 'path':
				if(value!=undefined){
					$.extend(this.options.path,value)
					this.refresh();
				}else
					return this.options.path;
			break;
			case 'name':
				if(value!=undefined){
					$(this.element).removeData(this._name())
					this.options.name=value
					$(this.element).data(this._name(),this)
				}else
					return this.options.name;
			break;
			case 'accept':
				if(value!=undefined){
					this.options.accept=value
					this._resetItems()
					this.init()
				}else
					return this.options.accept;
				
			break;
			case 'center':
				if(value!=undefined){
					this.options.path.center=value
					this.refresh()
				}else
					return this.options.path.center;
			break;
			}
		},
		_resetItems: function(){
			var csses=this.options.css,
				itemCss=csses.item
			$(this._items).each(function(){
				$(this).removeClass(itemCss)
			})
		},
		destroy: function(){
			var containerCss=this.options.css.container
			this._resetItems();
			$(this.element).removeClass(containerCss)
			
			$(this.element).removeData(this._name())
			delete this.options;
			delete this._items;
			delete this._current;
		}
		
	}
}	

{/* connect two elements with wire
options:
	container:'body',
	coeffMulDirection:50,
	bordercap:'round',
	bordercolor:'#0000ff',
	borderwidth:1,
	cap:'round',
	color:'rgb(173, 216, 230)',
	width:3,
	autoPosition:'topbottom',//which is first, topbottom, or leftright
	terminalInOptions:{},
	terminalOutOptions:{direction:[0,-1]},
	drawingMethod:'bezier'//bezier,straight,arrows, bezierArrows
example:
	$('#citya').wire('#cityb',{}),
	or
	$.wire('#citya','#cityb',{})
*/	
	$.wire=function(port1,port2,options){
		(new Wire(port1,port2,options)).redraw()
	}
	
	$.fn.wire=function(port,options){
		if(this.length==0) return;
		var port1=this.get(0)
		$(port).each(function(){
			(new Wire(port1,this,options)).redraw()
		})
	}
	
	var Wire=function(terminal1,terminal2,options){
			this.options=$.extend(true,{
					container:'body',
					coeffMulDirection:50,
					bordercap:'round',
					bordercolor:'#0000ff',
					borderwidth:1,
					cap:'round',
					color:'rgb(173, 216, 230)',
					width:3,
					arrowLength:20,
					togglable:true,
					autoPosition:'topbottom',//which is first, topbottom, or leftright
					terminalInOptions:{},
					terminalOutOptions:{direction:[0,-1]},
					drawingMethod:'bezier'//bezier,straight,arrows, bezierArrows
				},options||{})
			this.parentEl = $(this.options.container);
			
			this.element = document.createElement('canvas');
			$(this.parentEl).append(this.element)
			
			// excanvas.js for dynamic canvas tags
			if(typeof (G_vmlCanvasManager)!="undefined")				
				this.element = $(G_vmlCanvasManager.initElement(this.element));

			this.element=$(this.element).addClass('ui-wireit-wire')
			
			this.terminal1 = terminal1.addWire ? terminal1 : new Terminal(terminal1,this.options.terminalOutOptions);
			this.terminal2 = terminal2.addWire ? terminal2 : new Terminal(terminal2,this.options.terminalInOptions);
			this.terminal1.addWire(this,Terminal.OUT)
			this.terminal2.addWire(this,Terminal.IN)
			this.UUID=++UUID
		},
		Terminal=function(parentEl,options){	
			this.options=$.extend(true,{
					name:'terminal',
					direction:[0,1],
					fakeDirection:[0,-1],
					className:'ui-wireit-terminal',
					connectedClassName:'ui-wireit-terminal-connected',
					dropinviteClassName:'ui-wireit-terminal-dropinvite',
					editable:false,
					offsetPosition:false//auto
				},options||{})
				
			this.parentEl=$(parentEl)
			
			if(!this.options.offsetPosition && 
				$.inArray(this.parentEl.css('position').toLowerCase(),['absolute','relative'])==-1)
				this.parentEl.css('position','relative')
			//don't create duplicated terminal at the same position
			var terminals=this.parentEl.data('terminals'),
				i,j,tempOptions,terminal;	
			if(!terminals)
				this.parentEl.data('terminals',(terminals=[]));
			/* decrease the number of terminals according to offset
			else if(this.options.offsetPosition){
				for(i=0;i<terminals.length;i++){
					if((tempOptions=terminals[i].options.offsetPosition))
					for(j in this.options.offsetPosition)
						if(this.options.offsetPosition[j]!=tempOptions[j])
							break;
					
					terminal=terminals[i];
					break;
				}
				if(terminal)
					return terminal;
			}*/
				
			this.wires=[]	
			this.render();
			if(this.options.editable)
				this.scissor=new Scissors(this)
			
			terminals.push(this)
			this.UUID=UUID++
			this.showed=true
		},
		Scissors=function(terminal){
			this.terminal=terminal
			this.UUID=UUID++
		}
		
	
	
	Wire.prototype={
		CSS_HIDE:'ui-wireit-hide',
		getContext:function(){return this.element.get(0).getContext('2d')},
		remove:function(){
			// Remove the canvas from the dom
			$(this.element).remove();

			// Remove the wire reference from the connected terminals
			if(this.terminal1 && this.terminal1.removeWire) {
				this.terminal1.removeWire(this);
			}
			if(this.terminal2 && this.terminal2.removeWire) {
				this.terminal2.removeWire(this);
			}

			// Remove references to old terminals
			this.terminal1 = null;
			this.terminal2 = null;
		},
		toggle: function(sourceTerminal, toHide){
			if(!this.options.togglable)
				return;
			var otherTerminal=this.getOtherTerminal(sourceTerminal),
				terminalsChildren=otherTerminal.parentEl.data('terminals');
			
			if(toHide){
				otherTerminal.parentEl.attr('class',otherTerminal.parentEl.attr('class')+' '+this.CSS_HIDE);
				this.element.attr('class',this.element.attr('class')+' '+this.CSS_HIDE);
			}else{
				otherTerminal.parentEl.removeClass(this.CSS_HIDE);
				this.element.removeClass(this.CSS_HIDE);

			}		
			
			if(terminalsChildren){
				for(var i=0;i<terminalsChildren.length;i++)
					if(otherTerminal.UUID!=terminalsChildren[i].UUID)
						terminalsChildren[i].toggle(toHide)
			}
			
			//this.element.is(':visible') && sourceTerminal.el.trigger('move')
		},
		setCanvasRegion:function(left,top,width,height){
			var offset=this.parentEl.offset()
			if(!this.parentEl.is('body')){
				left=left-offset.left
				top=top-offset.top
			}
			this.element.css({left:left,top:top})
			//css resize for canvas doesn't work, here must use element attribute width/height to reseth 
			var el=this.element.get(0)
			el.width=width
			el.height=height
			this.getContext().clearRect(0,0,width,height);
		},
		getOtherTerminal: function(terminal1){ return (terminal1 == this.terminal1) ? this.terminal2 : this.terminal1;},
		drawBezierCurve: function(){
			// Get the positions of the terminals
			var p1 = this.terminal1.getXY();
			var p2 = this.terminal2.getXY();

			// Coefficient multiplicateur de direction
			// 100 par defaut, si distance(p1,p2) < 100, on passe en distance/2
			var coeffMulDirection = this.options.coeffMulDirection;


			var distance=Math.sqrt(Math.pow(p1[0]-p2[0],2)+Math.pow(p1[1]-p2[1],2));
			if(distance < coeffMulDirection){
			coeffMulDirection = distance/2;
			}

			// Calcul des vecteurs directeurs d1 et d2 :
			var d1 = [this.terminal1.options.direction[0]*coeffMulDirection,
				this.terminal1.options.direction[1]*coeffMulDirection];
			var d2 = [this.terminal2.options.direction[0]*coeffMulDirection,
				this.terminal2.options.direction[1]*coeffMulDirection];

			var bezierPoints=[];
			bezierPoints[0] = p1;
			bezierPoints[1] = [p1[0]+d1[0],p1[1]+d1[1]];
			bezierPoints[2] = [p2[0]+d2[0],p2[1]+d2[1]];
			bezierPoints[3] = p2;
			var min = [p1[0],p1[1]];
			var max = [p1[0],p1[1]];
			for(var i=1 ; i<bezierPoints.length ; i++){
			var p = bezierPoints[i];
			if(p[0] < min[0]){
			min[0] = p[0];
			}
			if(p[1] < min[1]){
			min[1] = p[1];
			}
			if(p[0] > max[0]){
			max[0] = p[0];
			}
			if(p[1] > max[1]){
			max[1] = p[1];
			}
			}
			// Redimensionnement du canvas
			var margin = [4,4];
			min[0] = min[0]-margin[0];
			min[1] = min[1]-margin[1];
			max[0] = max[0]+margin[0];
			max[1] = max[1]+margin[1];
			var lw = Math.abs(max[0]-min[0]);
			var lh = Math.abs(max[1]-min[1]);

			this.setCanvasRegion(min[0],min[1],lw,lh);

			var ctxt = this.getContext();
			for(i = 0 ; i<bezierPoints.length ; i++){
			bezierPoints[i][0] = bezierPoints[i][0]-min[0];
			bezierPoints[i][1] = bezierPoints[i][1]-min[1];
			}

			// Draw the border
			ctxt.lineCap = this.options.bordercap;
			ctxt.strokeStyle = this.options.bordercolor;
			ctxt.lineWidth = this.options.width+this.options.borderwidth*2;
			ctxt.beginPath();
			ctxt.moveTo(bezierPoints[0][0],bezierPoints[0][1]);
			ctxt.bezierCurveTo(bezierPoints[1][0],bezierPoints[1][1],bezierPoints[2][0],bezierPoints[2][1],bezierPoints[3][0],bezierPoints[3][1]);
			ctxt.stroke();

			// Draw the inner bezier curve
			ctxt.lineCap = this.options.cap;
			ctxt.strokeStyle = this.options.color;
			ctxt.lineWidth = this.options.width;
			ctxt.beginPath();
			ctxt.moveTo(bezierPoints[0][0],bezierPoints[0][1]);
			ctxt.bezierCurveTo(bezierPoints[1][0],bezierPoints[1][1],bezierPoints[2][0],bezierPoints[2][1],bezierPoints[3][0],bezierPoints[3][1]);
			ctxt.stroke();
		},
		drawBezierArrows: function(){
			//From drawArrows function
			
			var arrowWidth = Math.round(this.options.width * 1.5 + this.options.arrowLength);
			var arrowLength = Math.round(this.options.width * 1.2 + this.options.arrowLength);
			var d = arrowWidth/2; // arrow width/2
			var redim = d+3; //we have to make the canvas a little bigger because of arrows
			var margin=[4+redim,4+redim];

			// Get the positions of the terminals
			var p1 = this.terminal1.getXY();
			var p2 = this.terminal2.getXY();

			// Coefficient multiplicateur de direction
			// 100 par defaut, si distance(p1,p2) < 100, on passe en distance/2
			var coeffMulDirection = this.options.coeffMulDirection;


			var distance=Math.sqrt(Math.pow(p1[0]-p2[0],2)+Math.pow(p1[1]-p2[1],2));
			if(distance < coeffMulDirection){
			coeffMulDirection = distance/2;
			}

			// Calcul des vecteurs directeurs d1 et d2 :
			var d1 = [this.terminal1.options.direction[0]*coeffMulDirection,
				this.terminal1.options.direction[1]*coeffMulDirection];
			var d2 = [this.terminal2.options.direction[0]*coeffMulDirection,
				this.terminal2.options.direction[1]*coeffMulDirection];

			var bezierPoints=[];
			bezierPoints[0] = p1;
			bezierPoints[1] = [p1[0]+d1[0],p1[1]+d1[1]];
			bezierPoints[2] = [p2[0]+d2[0],p2[1]+d2[1]];
			bezierPoints[3] = p2;
			var min = [p1[0],p1[1]];
			var max = [p1[0],p1[1]];
			for(var i=1 ; i<bezierPoints.length ; i++){
			var p = bezierPoints[i];
			if(p[0] < min[0]){
			min[0] = p[0];
			}
			if(p[1] < min[1]){
			min[1] = p[1];
			}
			if(p[0] > max[0]){
			max[0] = p[0];
			}
			if(p[1] > max[1]){
			max[1] = p[1];
			}
			}
			// Redimensionnement du canvas
			//var margin = [4,4];
			min[0] = min[0]-margin[0];
			min[1] = min[1]-margin[1];
			max[0] = max[0]+margin[0];
			max[1] = max[1]+margin[1];
			var lw = Math.abs(max[0]-min[0]);
			var lh = Math.abs(max[1]-min[1]);

			this.setCanvasRegion(min[0],min[1],lw,lh);

			var ctxt = this.getContext();
			for(i = 0 ; i<bezierPoints.length ; i++){
			bezierPoints[i][0] = bezierPoints[i][0]-min[0];
			bezierPoints[i][1] = bezierPoints[i][1]-min[1];
			}

			// Draw the border
			ctxt.lineCap = this.options.bordercap;
			ctxt.strokeStyle = this.options.bordercolor;
			ctxt.lineWidth = this.options.width+this.options.borderwidth*2;
			ctxt.beginPath();
			ctxt.moveTo(bezierPoints[0][0],bezierPoints[0][1]);
			ctxt.bezierCurveTo(bezierPoints[1][0],bezierPoints[1][1],bezierPoints[2][0],bezierPoints[2][1],bezierPoints[3][0],bezierPoints[3][1]+arrowLength/2*this.terminal2.options.direction[1]);
			ctxt.stroke();

			// Draw the inner bezier curve
			ctxt.lineCap = this.options.cap;
			ctxt.strokeStyle = this.options.color;
			ctxt.lineWidth = this.options.width;
			ctxt.beginPath();
			ctxt.moveTo(bezierPoints[0][0],bezierPoints[0][1]);
			ctxt.bezierCurveTo(bezierPoints[1][0],bezierPoints[1][1],bezierPoints[2][0],bezierPoints[2][1],bezierPoints[3][0],bezierPoints[3][1]+arrowLength/2*this.terminal2.options.direction[1]);
			ctxt.stroke();

			//Variables from drawArrows
			//var t1 = p1;
			var t1 = bezierPoints[2],
			 t2 = p2;

			var z = [0,0]; //point on the wire with constant distance (dlug) from terminal2
			var dlug = arrowLength; //arrow length
			var t = 1-(dlug/distance);
			z[0] = Math.abs( t1[0] +  t*(t2[0]-t1[0]) );
			z[1] = Math.abs( t1[1] + t*(t2[1]-t1[1]) );	

			//line which connects the terminals: y=ax+b
			var W = t1[0] - t2[0];
			var Wa = t1[1] - t2[1];
			var Wb = t1[0]*t2[1] - t1[1]*t2[0];
			if (W !== 0) {
			a = Wa/W;
			b = Wb/W;
			}
			else {
			a = 0;
			}
			//line perpendicular to the main line: y = aProst*x + b
			if (a === 0) {
			aProst = 0;
			}
			else {
			aProst = -1/a;
			}
			bProst = z[1] - aProst*z[0]; //point z lays on this line

			//we have to calculate coordinates of 2 points, which lay on perpendicular line and have the same distance (d) from point z
			var A = 1 + Math.pow(aProst,2),
			 B = 2*aProst*bProst - 2*z[0] - 2*z[1]*aProst,
			 C = -2*z[1]*bProst + Math.pow(z[0],2) + Math.pow(z[1],2) - Math.pow(d,2) + Math.pow(bProst,2),
			 delta = Math.pow(B,2) - 4*A*C;

			if (delta < 0) { return; }

			var x1 = (-B + Math.sqrt(delta)) / (2*A),
			 x2 = (-B - Math.sqrt(delta)) / (2*A),
			 y1 = aProst*x1 + bProst,
			 y2 = aProst*x2 + bProst;

			if(t1[1] == t2[1]) {
			var o = (t1[0] > t2[0]) ? 1 : -1;
			x1 = t2[0]+o*dlug;
			x2 = x1;
			y1 -= d;
			y2 += d;
			}   	

			//triangle fill
			ctxt.fillStyle = this.options.color;
			ctxt.beginPath();
			ctxt.moveTo(t2[0],t2[1]);
			ctxt.lineTo(x1,y1);
			ctxt.lineTo(x2,y2);
			ctxt.fill();

			//triangle border	
			ctxt.strokeStyle = this.options.bordercolor;
			ctxt.lineWidth = this.options.borderwidth;
			ctxt.beginPath();
			ctxt.moveTo(t2[0],t2[1]);
			ctxt.lineTo(x1,y1);
			ctxt.lineTo(x2,y2);
			ctxt.lineTo(t2[0],t2[1]);
			ctxt.stroke();


			return [p1,p2,t1,t2];		
		},
		drawArrows:function(){
			var d = 7; // arrow width/2
			var redim = d+3; //we have to make the canvas a little bigger because of arrows
			var margin=[4+redim,4+redim];

			// Get the positions of the terminals
			var p1 = this.terminal1.getXY();
			var p2 = this.terminal2.getXY();

			var distance=Math.sqrt(Math.pow(p1[0]-p2[0],2)+Math.pow(p1[1]-p2[1],2));

			var min=[ Math.min(p1[0],p2[0])-margin[0], Math.min(p1[1],p2[1])-margin[1]];
			var max=[ Math.max(p1[0],p2[0])+margin[0], Math.max(p1[1],p2[1])+margin[1]];

			// Redimensionnement du canvas

			var lw=Math.abs(max[0]-min[0])+redim;
			var lh=Math.abs(max[1]-min[1])+redim;

			p1[0]=p1[0]-min[0];
			p1[1]=p1[1]-min[1];
			p2[0]=p2[0]-min[0];
			p2[1]=p2[1]-min[1];

			this.setCanvasRegion(min[0],min[1],lw,lh);

			var ctxt=this.getContext();

			// Draw the border
			ctxt.lineCap=this.options.bordercap;
			ctxt.strokeStyle=this.options.bordercolor;
			ctxt.lineWidth=this.options.width+this.options.borderwidth*2;
			ctxt.beginPath();
			ctxt.moveTo(p1[0],p1[1]);
			ctxt.lineTo(p2[0],p2[1]);
			ctxt.stroke();

			// Draw the inner bezier curve
			ctxt.lineCap=this.options.cap;
			ctxt.strokeStyle=this.options.color;
			ctxt.lineWidth=this.options.width;
			ctxt.beginPath();
			ctxt.moveTo(p1[0],p1[1]);
			ctxt.lineTo(p2[0],p2[1]);
			ctxt.stroke();

			/* start drawing arrows */

			var t1 = p1;
			var t2 = p2;

			var z = [0,0]; //point on the wire with constant distance (dlug) from terminal2
			var dlug = this.options.arrowLength//20; //arrow length
			var t = (distance == 0) ? 0 : 1-(dlug/distance);
			z[0] = Math.abs( t1[0] +  t*(t2[0]-t1[0]) );
			z[1] = Math.abs( t1[1] + t*(t2[1]-t1[1]) );	

			//line which connects the terminals: y=ax+b
			var W = t1[0] - t2[0];
			var Wa = t1[1] - t2[1];
			var Wb = t1[0]*t2[1] - t1[1]*t2[0];
			if (W !== 0) {
			a = Wa/W;
			b = Wb/W;
			}
			else {
			a = 0;
			}
			//line perpendicular to the main line: y = aProst*x + b
			if (a == 0) {
			aProst = 0;
			}
			else {
			aProst = -1/a;
			}
			bProst = z[1] - aProst*z[0]; //point z lays on this line

			//we have to calculate coordinates of 2 points, which lay on perpendicular line and have the same distance (d) from point z
			var A = 1 + Math.pow(aProst,2);
			var B = 2*aProst*bProst - 2*z[0] - 2*z[1]*aProst;
			var C = -2*z[1]*bProst + Math.pow(z[0],2) + Math.pow(z[1],2) - Math.pow(d,2) + Math.pow(bProst,2);
			var delta = Math.pow(B,2) - 4*A*C;
			if (delta < 0) { return; }

			var x1 = (-B + Math.sqrt(delta)) / (2*A);
			var x2 = (-B - Math.sqrt(delta)) / (2*A);	 
			var y1 = aProst*x1 + bProst;
			var y2 = aProst*x2 + bProst;

			if(t1[1] == t2[1]) {
			  var o = (t1[0] > t2[0]) ? 1 : -1;
			   x1 = t2[0]+o*dlug;
			   x2 = x1;
			   y1 -= d;
			   y2 += d;
			}   	

			//triangle fill
			ctxt.fillStyle = this.options.color;
			ctxt.beginPath();
			ctxt.moveTo(t2[0],t2[1]);
			ctxt.lineTo(x1,y1);
			ctxt.lineTo(x2,y2);
			ctxt.fill();

			//triangle border	
			ctxt.strokeStyle = this.options.bordercolor;
			ctxt.lineWidth = this.options.borderwidth;
			ctxt.beginPath();
			ctxt.moveTo(t2[0],t2[1]);
			ctxt.lineTo(x1,y1);
			ctxt.lineTo(x2,y2);
			ctxt.lineTo(t2[0],t2[1]);
			ctxt.stroke();
		
		},
		drawStraight:function(){
			var margin = [4,4];

			// Get the positions of the terminals
			var p1 = this.terminal1.getXY();
			var p2 = this.terminal2.getXY();

			var min=[ Math.min(p1[0],p2[0])-margin[0], Math.min(p1[1],p2[1])-margin[1]];
			var max=[ Math.max(p1[0],p2[0])+margin[0], Math.max(p1[1],p2[1])+margin[1]];

			// Redimensionnement du canvas
			var lw=Math.abs(max[0]-min[0]);
			var lh=Math.abs(max[1]-min[1]);

			// Convert points in canvas coordinates
			p1[0] = p1[0]-min[0];
			p1[1] = p1[1]-min[1];
			p2[0] = p2[0]-min[0];
			p2[1] = p2[1]-min[1];

			
			this.setCanvasRegion(min[0],min[1],lw,lh);
			
			var ctxt=this.getContext();
			
			// Draw the border
			ctxt.lineCap=this.options.bordercap;
			ctxt.strokeStyle=this.options.bordercolor;
			ctxt.lineWidth=this.options.width+this.options.borderwidth*2;
			ctxt.beginPath();
			ctxt.moveTo(p1[0],p1[1]);
			ctxt.lineTo(p2[0],p2[1]);
			ctxt.stroke();

			// Draw the inner bezier curve
			ctxt.lineCap=this.options.cap;
			ctxt.strokeStyle=this.options.color;
			ctxt.lineWidth=this.options.width;
			ctxt.beginPath();
			ctxt.moveTo(p1[0],p1[1]);
			ctxt.lineTo(p2[0],p2[1]);
			ctxt.stroke();		
		},
		autoPosition: function(){
			if(!this.options.autoPosition)
				return;
			var self=this,
				pos1=this.terminal1.parentOffset(),
				pos2=this.terminal2.parentOffset()
				
			var topbottom=function(){
				if(pos1.bottom<pos2.top){//bottom->top
					self.terminal1.offset("bottom")
					self.terminal2.offset("top")
				}else if(pos1.top>pos2.bottom){//top->bottom
					self.terminal1.offset("top")
					self.terminal2.offset("bottom")
				}else
					return false
				
			}
			
			var leftright=function(){
				if(pos1.left>pos2.right){//left->right
					self.terminal1.offset("left")
					self.terminal2.offset("right")
				}else if(pos1.right<pos2.left){//right->left
					self.terminal1.offset("right")
					self.terminal2.offset("left")
				}else
					return false
			}
			
			switch(this.options.autoPosition){
			case 'leftright':
			case 'rightleft':
			case 'lr':
			case 'rl':
				leftright()===false && topbottom()
			break;
			default:
				topbottom()===false && leftright()
			break;
			}
		},
		redraw:function(){
			if(!this.element.is(':visible'))
				return;
			this.autoPosition();
			
			if(this.options.drawingMethod == 'straight') {
				this.drawStraight();
			}
			else if(this.options.drawingMethod == 'arrows') {
				this.drawArrows();
			}
			else if(this.options.drawingMethod == 'bezier') {
				this.drawBezierCurve();
			}
			else if(this.options.drawingMethod == 'bezierArrows') {
				var positions = this.drawBezierArrows();
				if(this.options.label) {
					this.drawLabel(positions);
				}
			}
			else {
				throw new Error("WireIt.Wire unable to find '"+this.drawingMethod+"' drawing method.");
			}

			
		},
		drawLabel:function(positions){
			var p1 = positions[0];
			var p2 = positions[1];
			var t1 = positions[2];
			var t2 = positions[3];

			var winkel = 0;
			var distance = 15;

			var ctxt=this.getContext();
			ctxt.save();

			//1.Quadrant
			if ((p1[0]<p2[0])&&(p1[1]>p2[1])){
				winkel=Math.PI*1.5+winkel;
				ctxt.translate(t1[0],t1[1]);
			}
			//2. Quadrant
			else if ((p1[0]<p2[0])&&(p1[1]<p2[1])){
				winkel = Math.PI/2-winkel;
				ctxt.translate(t1[0],t1[1]);
			}
			//3. Quadrant
			else if ((p1[0]>p2[0])&&(p1[1]<p2[1])){
			 //winkel = Math.PI/2+winkel;
				winkel = Math.PI*1.5+winkel;
				ctxt.translate(t2[0],t2[1]);
			}
			//4. Quadrant
			else if ((p1[0]>p2[0])&&(p1[1]>p2[1])){
				winkel=Math.PI*0.5-winkel;
				ctxt.translate(t2[0],t2[1]);
			}

			ctxt.rotate(winkel);

			ctxt.font = "14px Arial";
			ctxt.fillStyle = "Black";
			ctxt.translate((distance-(ctxt.measureText(this.options.label)).width)/2,0);
			ctxt.fillText(this.options.label, 0, 0);
			ctxt.restore();		
		},
		wireDrawnAt:function(){
			var ctxt = this.getContext();
			var imgData = ctxt.getImageData(x,y,1,1);
			var pixel = imgData.data;
			return !( pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 0 );		
		}
	}
	Terminal.IN=1
	Terminal.OUT=2
	Terminal.prototype={
		parentOffset: function(){
			var $parentEl=$(this.parentEl),
				pos=$parentEl.offset()
			pos.bottom=pos.top+$parentEl.height()
			pos.right=pos.left+$parentEl.width()
			return pos;
		},
		offset: function(v){
			if(typeof(v)=='string'){
				var pos=this.parentOffset(),
					h=$(this.el).height()/2,
					w=$(this.el).width()/2;
				
				switch(v){
				case "top":
					v={top:-h,left:(pos.right-pos.left)/2-w,bottom:'auto',right:'auto'}
				break;
				case "bottom":
					v={bottom:-h,left:(pos.right-pos.left)/2-w,right:'auto',top:'auto'}
				break;
				case "left":
					v={left:-w,top:(pos.bottom-pos.top)/2-h,bottom:'auto',right:'auto'}
				break;
				case "right":
					v={right:-w,top:(pos.bottom-pos.top)/2-h,bottom:'auto',left:'auto'}
				break;
				case "center":
					v={left:(pos.right-pos.left)/2-w,top:(pos.bottom-pos.top)/2-h,bottom:'auto',right:'auto'}
				break;
				}
			}
			this.el.css(v);
		},
		render:function(){
			var pos = this.options.offsetPosition, self=this
			// Create the DIV element
			this.el = $('<div/>').addClass(this.options.className)
			if(this.options.name)
				this.el.title = this.options.name
				
			// Append the element to the parent
			this.parentEl.append(this.el)
				
			// Set the offset position
			pos && this.offset(pos);
			
			this.el.click(function(){//to toggle all terminals on the same position
				var terminals=self.parentEl.data('terminals'),
					offset=self.el.offset(),
					anotherOffset,
					targets=[];
				for(var i=0;i<terminals.length;i++){
					anotherOffset=terminals[i].el.offset();
					if(Terminal.OUT==terminals[i].direction && offset.left==anotherOffset.left && offset.top==anotherOffset.top)
						targets.push(i);//the position would be changed when toggled, so just get who should be toggled here
				}
				
				for(var i=0;i<targets.length;i++)
					terminals[targets[i]].toggle()
			})
		},
		addWire:function(wire,direction){
			var self=this
			this.wires.push(wire)
			this.direction=direction
			// Set class indicating that the wire is connected
			this.el.addClass(this.options.connectedClassName)
			/*
			this.parentEl.bind('move',function(event){
				log($(self.parentEl).text()+" 1moving")
				if(event.target==this)
					return false
				//wire.redraw()
				log($(self.parentEl).text()+" 1moved")
				return false
			})*/
		},
		removeWire:function(wire){
			var index = $.inArray(wire, this.wires), w;   
			if( index != -1 ) {
				this.wires[index].remove();
				this.wires[index] = null;
				this.wires = this.wires.compact();
				// Remove the connected class if it has no more wires:
				if(this.wires.length == 0)
					$(this.el).removeClass(this.options.connectedClassName);
			}
		},
		getXY: function(){
			var pos=this.el.offset()
			return [pos.left+15,pos.top+15]
		},
		remove: function(){
			// This isn't very nice but...
			// the method Wire.remove calls Terminal.removeWire to remove the reference
			while(this.wires.length > 0) 
				this.wires[0].remove();
			this.el.remove();

			// Remove scissors widget
			if(this.scissors)
				this.scissors.remove()
		},
		toggle: function(toHide){
			if(this.wires.length==0)
				return;
			if(toHide==undefined)
				toHide=this.wires[0].element.is(':visible')
			for(var i=0;i<this.wires.length;i++)
				this.wires[i].toggle(this,toHide);
		}
	}
	
	Scissors.prototype={
		draw:function(){},
		remove:function(){}
	}
}
})(jQuery);