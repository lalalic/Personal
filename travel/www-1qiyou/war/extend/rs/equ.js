{//extend gm
	{//tools
		window.gm=google.maps
		function calBounds(points){
			var length=points.length 
			if(length==0)
				return null;

			var bounds=new gm.LatLngBounds(points[0],points[0])
			for(var i=1;i<length;i++)
				if(!bounds.contains(points[i]))
					bounds.extend(points[i])
			return bounds;
		}
		gm.Map.prototype.setCursor=function(cursor){
			this.setOptions({draggableCursor:cursor})
		}
		
		gm.LatLng.prototype.latlng=function(){
			return {lat:this.lat(),lng:this.lng()}
		}
		
		gm.LatLng.parse=function(p){
			if('toUrlValue' in p)
				return p;
			else if('lat' in p)
				return new gm.LatLng(p.lat,p.lng)
			else
				return p;
			
		}
	
	}
	
	{//OverlayManager, StyleMarker
		gm.Label=function(overlay,opts){
			var self=this
			this.overlay=overlay;
			this.opts=$.extend({
					content:"",
					style:""
				},opts);
			this.container = $("<div></div>")
				.css("position","absolute")
				.html(this.opts.content)
				.addClass(this.opts.style)
				.hide()
		}
		var glp=gm.Label.prototype=new gm.OverlayView();
		glp.onAdd=function(){
			var self=this
			gm.event.addListener(this.overlay, "position_changed", function () {
				if(this.getDraggable())
					self.setPosition()
			}),
			
			gm.event.addListener(this.overlay, "zindex_changed", function () {
				self.container.css("z-index",this.getZIndex())
			})	
			$(this.getPanes().overlayMouseTarget).append(this.container)
		}
		glp.onRemove=function(){
			this.container.remove()
		}
		glp.draw=function(){
			this.container.show()
			this.setPosition()	
		}
		glp.setPosition=function(){
			var position = this.getProjection().fromLatLngToDivPixel(this.overlay.getPosition());
			this.container.css({left:Math.round(position.x),top:Math.round(position.y)})
		}

		gm.StyleMarker=function(opts,icon,frameStyle,text,backColor,foreColor){
			if(opts){
				icon=icon||"wc"
				frameStyle=frameStyle||"bbtl"
				text=text||" "
				backColor=backColor||"000000"
				foreColor=foreColor||"FFFFFF"
				opts.icon=new gm.MarkerImage("http://chart.apis.google.com/chart?chst=d_bubble_icon_text_small&chld="+icon+"|"+frameStyle+"|"+text+"|"+foreColor+"|"+backColor,
					null,null,new gm.Point(0,0))
			}
			gm.Marker.call(this,opts)
		}
		gm.StyleMarker.prototype=new gm.Marker();
		
		//OverlayManager
		var gmo=gm.OverlayManager=function(name,map){
			if(typeof(name)=='undefined')
				return
			this.name=name
			gm.OverlayManager.instances[name]=this
			this._overlays=[];
			this._bounds=null
			this.map=map
		}
		gmo.instances={}
		gmo.clear=function(){
			var instances=gmo.instances
			for(var i in instances){
				instances[i].clear && instances[i].clear()
			}
		}
		gmo.get=function(id){
			return gmo.instances[id];
		}
		
		gmo.prototype={
			add:function(overlay){
				this._overlays.push(overlay)
				if(this.map==null)
					this.map=overlay.getMap()
					
				if(this._bounds==null)
					this._bounds=new gm.LatLngBounds()

				if('getBounds' in overlay)//layer
					this._bounds.union(overlay.getBounds())
				else if('getPosition' in overlay)//marker
					this._bounds.extend(overlay.getPosition())
				else if('getPath' in overlay)//polyline
					this._bounds.union(calBounds(overlay.getPath().getArray()))
				else if('getDirections' in overlay){
					var routes=overlay.getDirections().routes
					for(var i=0;i<routes.length;i++)
						this._bounds.union(routes[i].bounds)
				}				
			},
			clear: function(){
				for(var i =0; i<this._overlays.length; i++)
					this._overlays[i].setMap && this._overlays[i].setMap(null);
				this._overlays=[];
				this._bounds=null;
			},
			remove: function(overlay){
				for(var i =0; i<this._overlays.length; i++){
					if(overlay==this._overlays[i]){
						this._overlays[i].setMap && this._overlays[i].setMap(null);
						this._overlays.splice(i,1)
						break
					}
				}
			},
			show: function(){
				for(var i =0; i<this._overlays.length; i++)
					this._overlays[i].setVisible && this._overlays[i].setVisible(true)
			},
			hide: function(){
				for(var i =0; i<this._overlays.length; i++)
					this._overlays[i].setVisible && this._overlays[i].setVisible(false)
			},
			fit: function(){
				this._bounds && this.map && this.map.fitBounds(this._bounds)
			}
		}
	}
	
	{
		gm.PhotoLayer=function(){
			var instanace;
			if((instance=gm.PhotoLayer.instance))
				return instance;

			gm.OverlayManager.call(this,"photo")
			gm.PhotoLayer.instance=this;
		}
		
		gm.PhotoLayer.prototype=new gm.OverlayManager()
		gm.PhotoLayer.prototype.constructor=gm.PhotoLayer
		
		gm.PhotoMarker=function(map,url,latlng){
			this._label = new gm.Label(this,{content:"<img src='"+url+"' style='max-height:106px;max-width:112px;position:absolute;left:-46px;top:-138px;'>"})
			gm.Marker.call(this,{map:map, draggable:true,position:latlng, icon: new gm.MarkerImage("http://chart.apis.google.com/chart?chst=d_fnote&chld=balloon|1")})
			
			new gm.PhotoLayer().add(this);	
		}
		
		gm.PhotoMarker.prototype=new gm.Marker()
		gm.PhotoMarker.prototype.setMap=function(map){
			gm.Marker.prototype.setMap.call(this,map)
			this._label.setMap(map)
		}
		
	}
	
	{//AttractionLayer
		gm.AttractionLayer=function(){
			var instanace;
			if((instance=gm.AttractionLayer.instance))
				return instance;
			
			gm.OverlayManager.call(this,"attraction")
			gm.AttractionLayer.instance=this;
		}
		gm.AttractionLayer.prototype=new gm.OverlayManager()
		gm.AttractionLayer.prototype.constructor=gm.AttractionLayer

		gm.CheckableMarker=function(opts){
			var self=this
			var labelOpts=$.extend({
					content:"<input type='checkbox' style='margin:0;padding:0;position:absolute;top:22px;left:36px'>",
				},opts.label)
			this._label = new gm.Label(this,labelOpts)
			$("input",this._label.container).change(function(event){
				gm.event.trigger(self,"checked",this.checked)
			})
			gm.StyleMarker.call(this,$.extend(opts,{draggable:false},"wc","bbtl"," ","000000","ff0000"))
			opts.oncheck &&	gm.event.addListener(this,"checked",opts.oncheck)
			this._label.container.css("zindex",this.getZIndex())
		}
		gm.CheckableMarker.prototype=new gm.StyleMarker();
		gm.CheckableMarker.prototype.setMap=function(map){
			gm.StyleMarker.prototype.setMap.call(this,map)
			this._label.setMap(map)
		}
		
		gm.FocusMarker=function(latlng,map){
			if(typeof(latlng)=='undefined')
				return
			var focusMarker
			if(!(focusMarker=gm.FocusMarker.instance)){
				var markerImage=new gm.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_xpin_icon&chld=pin_star|info|FF0000|FF0000")
				focusMarker=new gm.Marker({map:map,zIndex: gm.Marker.MAX_ZINDEX, draggable:true, icon:markerImage,title:"Current Focus",clickable:false,animation:gm.Animation.DROP})
				gm.FocusMarker.instance=focusMarker
				
				gm.event.addListener(focusMarker,"dragend", gm.FocusMarker.onMove)
			}
			
			focusMarker.setMap(map)
			
			if(latlng.charAt){
				var geo=new gm.Geocoder(),self=this
				geo.geocode({address: latlng},
					function(result, status) {
						if (status != gm.GeocoderStatus.OK) 
							return;
						new gm.FocusMarker(result[0].geometry.location, map)
					});
			}else{
				if(map.getBounds() && !map.getBounds().contains(latlng))
					map.setCenter(latlng)
				focusMarker.setPosition(latlng)
			}
			return focusMarker;
		}		
	}
		
	{//drawing route
		//hacked
		gm.DirectionsRenderer.prototype.getPolylines=function(){
			return this.b.polylines
		}
		
		gm.DrawingLayer=function(map){
			var instanace;
			if((instance=gm.DrawingLayer.instance)){
				instance.clear()
				return instance;
			}
			gm.OverlayManager.call(this,"drawing", map)
			gm.DrawingLayer.instance=this;
			this.service=new gm.DirectionsService()
		}
		var gdp=gm.DrawingLayer.prototype=new gm.OverlayManager()
		gdp.constructor=gm.DrawingLayer

		gdp.start=function(){
			var self=this
			var map=this.map, start=false
			gm.DrawingLayer.drawing=true
			this.clear()
			this.render=new gm.DirectionsRenderer({map:map,suppressMarkers:true,preserveViewport:true})
			this._overlays=[this.render]
			map.setCursor('crosshair')
			var destinationHandler=function(event){
				gm.event.trigger(self,"destination_add",event.latLng)
				start=event.latLng
			}
			var listeners=[
				gm.event.addListener(map,"click", destinationHandler),
				gm.event.addListener(map,"mousemove", function(event){
					if(start)
						self.trying(start,event.latLng)
				}),
				gm.event.addListener(map,"rightclick", function(event){
					map.setCursor(null)
					for(var i in listeners)
						gm.event.removeListener(listeners[i])
		
					self.clear()
					gm.event.trigger(self,"route_end",event.latlng)
				})
			]
		}
		gdp.trying=function(start,destination){
			if(this.trying.timer)
				clearTimeout(this.trying.timer)
			var self=this
			this.trying.timer=setTimeout(function(){
				var request={
						origin:start,
						destination: destination,
						travelMode: gm.DirectionsTravelMode.DRIVING
					}

				self.service.route(request,function(response, status){
					if (status == gm.DirectionsStatus.OK) {
			            self.render.setDirections(response);
			          }
				})
			},500)
		}
		gdp.clear=function(){
			gm.OverlayManager.clear.call(this)
			if(this.render!=null){
				this.render.setMap(null)
				this.render=null
			}
		}
		gdp.end=function(){
			this.clear()
			gm.DrawingLayer.drawing=false
		}
	}
	
	{//track layer
		gm.TrackLayer=function(map){
			var instanace;
			if((instance=gm.TrackLayer.instance))
				return instance;
			
			gm.OverlayManager.call(this,"track",map)
			gm.TrackLayer.instance=this;
			this._overlays=[];
		}
		
		var gtp=gm.TrackLayer.prototype=new gm.OverlayManager();
		gtp.constructor=gm.TrackLayer
		
		gtp.setPath=function(locations){
			var points=[],polyline, imhere
			
			this.clear()
			
			if(locations==null || locations.length==0)
				return;
			
			for(var i=0;i<locations.length;i++){
				points[i]=new gm.LatLng(locations[i].pt.latitude,locations[i].pt.longitude);
				this.add(new gm.TrackMarker(locations[i].time,{map:this.map,position:points[i]}))
			}
			
			imhere=new gm.ImHereMarker(locations[0].when,{map:this.map,position:points[0]})
			this.add(imhere)
			
			this.fit();
		}	
		
		gm.TrackMarker=function(when,opts){
			var t=new Date(parseInt(when)), color
			var d=t.getFullYear()+"-"+t.getMonth()+"-"+t.getDay()
			if(!gm.TrackMarker[d])
				gm.TrackMarker[d]=("000000"+(Math.random()*0xFFFFFF<<0).toString(16)).slice(-6);
			color=gm.TrackMarker[d]
			opts && !opts.icon && (opts.icon=new gm.MarkerImage("http://chart.apis.google.com/chart?chst=d_text_outline&chld=ffffff|12|h|"+color+"|b|o",
				null,null,new gm.Point(4,5)))
			opts && (opts.title=t.toString())

			gm.Marker.call(this,opts)
		}
		
		gm.TrackMarker.prototype=new gm.Marker();
		
		gm.ImHereMarker=function(when,opts){
			opts.icon=new gm.MarkerImage("https://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=location|bb|I'm+here|FF0000|FFFFFF",
				null,null,new gm.Point(0,42))
			gm.TrackMarker.call(this,when,opts)
		}
		
		gm.ImHereMarker.prototype=new gm.TrackMarker();
		
	}
	{//ActivityLayer
		gm.ActivityLayer=function(map){
			var instanace;
			if((instance=gm.ActivityLayer.instance))
				return instance;
			
			gm.OverlayManager.call(this,"Activity",map)
			gm.ActivityLayer.instance=this;
			this._uniques={}
		}
		
		var gap=gm.ActivityLayer.prototype=new gm.OverlayManager()
		gap.constructor=gm.ActivityLayer
		
		function nodeID(node){
			return node.type+"."+node.trans+""+node.latlng.lat+"."+node.latlng.lng;
		}
		
		gap.add=function(node){
			if(!('latlng' in node && 'lat' in node.latlng))
				return
			var id=nodeID(node)
			if(id in this._uniques)
				return;
			var marker=new gm.NodeMarker(node,this.map)
			gm.OverlayManager.prototype.add.call(this,marker)
			this._uniques[id]=marker
		}
		
		gap.remove=function(node){
			var id=nodeID(node)
			if(!(id in this._uniques))
				return;
			var marker=this._uniques[id]
			gm.OverlayManager.prototype.remove.call(this,marker)
			delete this._uniques[id]
		}

		gm.NodeMarker=function(node,map){
			var self=this
			gm.StyleMarker.call(this,{
				map:map,
				position: new gm.LatLng(node.latlng.lat, node.latlng.lng),
				title: node.name},
				gm.NodeMarker.icons[node.type])
		}
		gm.NodeMarker.prototype=new gm.StyleMarker()
	}
	
	{//Route layer
		gm.RouteLayer=function(map){
			var instanace;
			if((instance=gm.RouteLayer.instance)){
				//instance.clear()
				return instance;
			}
			gm.OverlayManager.call(this,"route",map)
			gm.RouteLayer.instance=this;
			this.service = new gm.DirectionsService();
			this.segs=[]
			this.asyncTasks=0
		}
		var grp=gm.RouteLayer.prototype=new gm.OverlayManager()
		grp.constructor=gm.RouteLayer
	
		grp.clear=function(){
			gm.OverlayManager.prototype.clear.call(this)
			this.segs=[]
		}
		
		grp.path=function(segments){
			this.clear()
			this.segs=segments
			this.refresh()
		}
		
		grp.getRequest=function(points){
			var request = {
		            origin:points[0],
		            destination:points[points.length-1],
		            travelMode: gm.DirectionsTravelMode.DRIVING
		        }
			if(points==2)
				return request;
			
			var waypoints=[]
			for(var i=1;i<points.length-1;i++)
				waypoints.push({location: points[i],stopover:true})
			
			request.waypoints=waypoints;
			return request;
		}
		
		grp.refresh=function(){
			if(this.segs.length==0)
				return;
			this.asyncTasks=0
			var self=this, seg
			for(var i in this.segs){
				seg=this.segs[i]
				if(seg.points.length==0)
					continue;
				switch(seg.trans){
				case TransType.airplane:
					if(seg.points.length<2)
						break;
					var 
						icons=[{icon:{path:gm.SymbolPath.FORWARD_CLOSED_ARROW},repeat:'50%'}],
					/*icons= [{
				        icon: {
				            path: 'M -1,1 0,0 1,1',
				            strokeOpacity: 1,
				            strokeWeight: 1.5,
				            scale: 6
				          },
				          repeat: '10px'
				        }],
					*/
						line=new gm.Polyline({
								map:this.map, 
								path:seg.points, 
								icons:icons
							})
					this.add(line)
					break;	
				case TransType.drive:
					var times=Math.ceil(seg.points.length/10), start, end, subSeg
					this.asyncTasks+=times
					for(var j=0; j<times; j++){
						start=(start=j*10)==0 ? 0 : start-1
						end=(end=start+10)>seg.points.length ? seg.points.length : end 
						subSeg=seg.points.slice(start,end)
						this.service.route(this.getRequest(subSeg),function(response, status){
							if (status != gm.DirectionsStatus.OK)
								return;
							var render=new gm.DirectionsRenderer({map:self.map,suppressMarkers:true,preserveViewport:true,draggable:true})
							render.setDirections(response)
							self.add(render)	
							self.asyncTasks--;
						})
					}
					break;
				default:
					if(seg.points.length>1)
						this.add(new gm.Polyline({map:this.map,path:seg.points}))
				}
			}
		}
		
		grp.fit=function(){
			if(this.asyncTasks<1)
				gm.OverlayManager.prototype.fit.call(this)
			else{
				var self=this
				setTimeout(function(){self.fit()},1000)
			}
		}
		
		grp.show=gm.RouteLayer.prototype.refresh
		grp.hide=function(){
			var segs=this.segs
			this.clear()
			this.segs=segs
		}
	}
	
	{//context
		gm.Context=function(option){
			this.option=option
			if(gm.Context.instance)
				return gm.Context.instance
			gm.Context.instance=this
			var self=this, map=this.option.map
			this.setMap(map)
			gm.event.addListener(map,'rightclick',function(event){
				if(gm.DrawingLayer.drawing)
					return
				self.show(event.latLng)
				gm.event.addListenerOnce(map,'click',function(){
					self.hide()
				})
			})
		}
		var gcp=gm.Context.prototype=new gm.OverlayView();
		gcp.onAdd=function(){
			var self=this
			this.container=$("#context")
			$(this.getPanes().overlayMouseTarget).append(this.container)
		}
		gcp.onRemove=function(){
			this.container.remove()
		}
		gcp.draw=function(){
			this.show()
		}
		gcp.show=function(p){
			if(!p)
				return;
			this.latlng=p.latlng();
			var position = this.getProjection().fromLatLngToDivPixel(p);
			this.container.css({left:Math.round(position.x),top:Math.round(position.y)})
			this.container.show()
	
		}
		gcp.hide=function(){
			this.container.hide()
		}
	}	
}





{//define gmap
	$.extend({
		gmap:function(el,options){
			var map=new gm.Map(el,
				$.extend(options,{
					center:	new gm.LatLng(0,0),
					zoom:  10,
					mapTypeId: gm.MapTypeId.ROADMAP,
					scaleControl: false,
					zoomControl: false,
					panControl: false,
					mapTypeControl: false,
					streetViewControl: false,
					overviewMapControl: false
				}))
			map.controls[gm.ControlPosition.TOP_RIGHT].push(document.getElementById('outline'))
			map.controls[gm.ControlPosition.TOP_LEFT].push(document.getElementById('toolbar'))
			return map;
		}
	})
	
	$.fn.extend({
		gmap: function(options){
			if(options && options.center && options.center.charAt){
				var geo=new gm.Geocoder(), 
					center=options.center,
					containers=this;
				options.center=new gm.LatLng(0,0);
				geo.geocode({address: center},
                            function(result, status) {
                                if (status === gm.GeocoderStatus.OK) {
									var center=result[0].geometry.location;
									containers.each(function(){
										var map=$(this).data("map");
										map && map.setCenter(center)
									})
                                }
                            });
			}
			return this.each(function(){
				$(this).data("map",$.gmap(this,options))
			})
		}
	})
}

{//define tree
	$.extend({
		tree: function(el,option){
			var self=this
			option=$.extend({
					template:"#tmplTree",
					data:null,
					empty:{name:"[start]", type:NodeType.other}
				},option)
			
			this.el=el;
			this.option=option;
						
			$(el)
				.data("tree",this)
				.bind("set",function(event,changed){
					switch(changed.type){
					case 'name':
						self.name(changed.to)
					break;
					}
				})
			
			$("li",el).live("click",function(){
				self.current(this)
				return false;
			})
			
			$("li>div>img",el).live("click",function(e){
				var node=$(this).closest("li"),
					children=node.children("ul")
				if(children.length==0)
					return;
				children.toggle()
				children.is(":visible") && node.addClass("open") || node.removeClass("open")
				e.stopPropagation();
			})
			
			this.setData(option.data||option.empty)			
			
		}
	})
	
	$.tree.prototype={
		trigger: function(event, data){
			var self=this
			$.each(event.split(" "),function(){
				$(self.el).trigger(this,data)
			})
		},
		add: function(node){//next sibling
			var $current=this.current()
			if(this.name()==node.name)
				return false;
			var $node=$(this.option.template)
						.tmpl(node)
						.data("data",node)
			if(this.isEmpty())
				$node.replaceAll($current)
			else
				$current.after($node)	
			this.trigger('add change',$node)
			this.current($node)
			return $node;
		},
		remove: function(node){//current
			if(!node){
				var $current=this.current(),
					$next=$current.next()
				if($next.length==0)
					$next=$current.prev()
				if($next.length==0)
					$next=$current.parent("ul").parent("li")
				if($next.length==0){
					$next=this.setData(this.option.empty)
				}else{
					this.trigger('trash',$current)
					$current.remove();
					this.trigger('change',$current)
					this.current($next)
				}	
			}else{
				var $node=$(node)
				if($node.length==0)
					return;
				this.trigger('trash',$node)
				$node.remove()
				var $currentContainer=$(".current>ul",this.el)
				if($(">li",$currentContainer).length==0)
					$currentContainer.remove()		
			}		
			var $current=this.current()
			$("ul:empty",$current).remove()
			if($(">ul",$current).length==0)
				$current.removeClass("folder")
		},
		insert: function(node){//as last child
			var $current=this.current()
			var $node=$(this.option.template)
					.tmpl(node)
					.data('data',node)
					
			var $currentChildContainer=$(">ul",$current)
			if($currentChildContainer.length==0){
				$currentChildContainer=$("<ul></ul>").appendTo($current)
				$current.addClass("folder")
			}
			$currentChildContainer.append($node)
			this.trigger('insert change',$node)
			return $node
		},
		traverse: function(handle,node){
			var data,nodes
			if(node==undefined){
				data={}
				handle(data);
				nodes=$(">li",this.el)
			}else{
				data=$(node).data("data")
				handle(data)
				nodes=$(">ul>li",node)
			}
			if(nodes.length){
				for(var i=0;i<nodes.length;i++)
					this.traverse(handle,nodes.get(i))
			}
		},
		getData: function(node){
			var data,nodes
			if(node==undefined){
				data={}
				nodes=$(">li",this.el)
			}else{
				data=$(node).data("data")
				nodes=$(">ul>li",node)
			}
			if(nodes.length && data){
				data.children=[]
				for(var i=0;i<nodes.length;i++)
					data.children.push(this.getData(nodes.get(i)))
			}
			return data;
		},
		setData: function(data,node){
			node=node || this.el
			var nodes;
			if(!data)
				nodes=$(this.option.template).tmpl(this.option.empty)
			else if(!('name' in data) && ('children' in data))
				nodes=$(this.option.template).tmpl(data.children)
			else 
				nodes=$(this.option.template).tmpl(data)
					
			nodes && nodes.appendTo($(node).empty())
		
			this.current($(">li:first",this.el))
				
			$("li",this.el).each(function(){
				var $item=$(this).data("tmplItem")
				$(this).data("data",$item.data)
			})
			$("ul",this.el)
				.parent("li")
				.addClass("folder")
			this.trigger('init change', node)
		},
		current: function(li){
			if(li){
				$('.current',this.el).removeClass('current')
				$(li).addClass('current')
				this.trigger('current')
				return
			}
			return $(".current",this.el)
		},
		name: function(value){
			if(value==undefined)
				return $(">div>span>span",this.current()).text()
			$(">div>span>span",this.current()).html(value)
		},
		isEmpty: function(){
			return $.trim(this.current().text())==this.option.empty.name
		},
		set: function(name,value){
			var current=this.current(),
				node=current.data("data")
			if(!node)
				current.data("data",(node={}))
			var oldValue=node[name]
			node[name]=value	
			this.trigger("set",{type:name,from:oldValue, to: value, data:node})
		},
		get: function(name){
			var current=this.current()
				node=current.data("data")
			return name ? node[name] : node;
		},
		up: function(){
			var $current=this.current()
			$current.after($current.prev())
			this.trigger('change')
		},
		down: function(){
			var $current=this.current()
			$current.before($current.next())
			this.trigger('change')
		},
		promote: function(){
			var $current=this.current()
			var $parent=$current.parent("ul").parent("li")
			$parent.after($current)
			$(">ul:empty",$parent).remove()
			this.trigger('change')
		},
		demote:function(){
			var $current=this.current()
			var $prev=$current.prev()
			if($(">ul",$prev).length==0)
				$prev.append("<ul></ul>")
			$(">ul",$prev).append($current)
			if(!$prev.hasClass("folder"))
				$prev.addClass("folder")
			this.trigger('change')
		}
	}
	
	$.extend($.fn,{
		tree:function(option){
			return this.each(function(){
				new $.tree(this,option)
			})
		}
	})
} 
	
{
	
	var NodeTypes=["path","dinner","bed","view","culture","shopping","fun","charity","business","region","route"]
	gm.NodeMarker.icons=['location','cafe','home','cemetery-grave','civic-building','shoppingcart','bowling','bank-intl','computer','floral','landslide']
	
	var TransTypes=["drive","train","airplane","bycicle","foot","boat","bus","taxi"]
	var NodeType={}, TransType={}
	for(var i in NodeTypes)
		NodeType[NodeTypes[i]]=i
	NodeType["other"]=99
	for(var i in TransTypes)
		TransType[TransTypes[i]]=i
	TransType["other"]=99
}

//application module
var module,database,vacationID
jQuery(function($){
	module={
		radius: 10000,//10km
		find: function(address,handler){
			address= address||$("#s").val()
			if(!address) return;
			var geo=new gm.Geocoder(),
				map=this.map,
				request=(address.lat ? {location:address} : {address:address})
			geo.geocode(request,function(result, status) {
				if (status != gm.GeocoderStatus.OK) 
					return;
				if($.isFunction(handler) && handler(result))
					return;
				for(var i=0;i<result.length;i++)
					new gm.Marker({
						  map:map,
						  animation: gm.Animation.DROP,
						  position: result[i].geometry.location
						})
					
			});
		},
		track: function(){
			$("#trackupload").click();
		},
		insertByName: function(node){
			var self=this, gp=new gm.LatLng(node.latlng.lat, node.latlng.lng)
			self.find(gp,function(result){
					node.name=result[0].formatted_address
					self.tree.insert(node)
					return true
				})
		},
		trackPath: function(){
			var self=this
			$.getJSON("/track/1/1",
				function(locations){
					if(locations.length<2)
						return;
						
					new gm.TrackLayer(self.map).setPath(locations);
				}
			)
		},
		photos: function(){
			var self=this
			$.getJSON("/p/1/1",
				function(photos){
					$.each(photos,function(){
						new gm.PhotoMarker(self.map,this.url,new gm.LatLng(this.loc.latitude, this.loc.longitude))
					})
				}
			)
		},
		submitLocation: function(){
			var name=$('#location').val(),self=this
			new gm.Geocoder().geocode({address:name},function(result,status){
				if (status != gm.GeocoderStatus.OK) 
					return;
				if(self.tree.add({name:name,latlng:result[0].geometry.location.latlng(), type: NodeType.path})){
					self.listAttractions(result[0].geometry.location)
					self.showNode()
				}
			})
			$('#location').get(0).select()
			//$("#plan").show()
			return false;
		},
		listAttractions: function(location){
			if(location.charAt){
				var geo=new gm.Geocoder(),self=this
				geo.geocode({address: location},
					function(result, status) {
						if (status != gm.GeocoderStatus.OK) 
							return;
						self.listAttractions(result[0].geometry.location)
					});
			}else{
				var map=this.map, self=this
				var layer=new gm.AttractionLayer()
				var service = new gm.places.PlacesService(map);
				
				layer.add(new gm.FocusMarker(location,map));
				//@TODO: here should search against native site's places, 	
				/*
				service.search({location:location,radius:this.radius, types:$("#types input[types]:checkbox:checked").val()},function(results,status){
					if (status != gm.places.PlacesServiceStatus.OK) 
						return;
					var points=[], spot, loc
					
					for (var i = 0; i < results.length; i++) {
						spot=results[i]
						loc = spot.geometry.location;
						layer.add(new gm.CheckableMarker({
								map:map,
								position: (points[i]=new gm.LatLng(loc.lat(), loc.lng())),
								title: spot.name,
								oncheck: function(checked){
									checked ? self.tree.insert({name:this.title,type:NodeType.ATTRACTION, latlng:this.getPosition().latlng()}) : 
										self.tree.remove({name:this.title,latlng:this.getPosition().latlng()})
								}
							}))
					}
					
					map.fitBounds(calBounds(points));
					
					map.setCenter(location);
				})
				*/
			}
		},
		refreshMap: function(){
			var map=this.map
			gm.OverlayManager.clear()
			this.tree.trigger("init change", this.tree.el)
			//map.fitBounds(calBounds(path))
		},
		drawRoute: function(){
			var map=this.map,self=this
			var drawing=new gm.DrawingLayer(map),first=false,counter=0
			gm.event.addListener(drawing,"destination_add",function(latlng){
				self.find(latlng,function(result){
					if(false===first)
						first=self.tree.insert({name:result[0].formatted_address,type:NodeType.path,latlng:latlng.latlng()})
					else
						self.tree.insert({name:result[0].formatted_address,type:NodeType.path,latlng:latlng.latlng()})
					counter++
					return true
				})
			})
			gm.event.addListener(drawing,"route_end",function(latlng){
				drawing.end()
			})
			
			drawing.start()
		},
		insertRoute: function(id, title){
			var self=this
			$.ajax({
				url:'/route/copy/'+id,
				dataType:'json',
				success: function(data){
					data.name=title
					data.type=NodeType.route
					data.id=id
					self.tree.add(data)
				}
			})
		},
		setCenter: function(center){
			center=center||$("#s").val()
			if(!center)
				return;
			if(center.lat){
				if(center.toUrlValue)
					this.map.setCenter(center);
				else
					this.map.setCenter(new gm.LatLng(center.lat,center.lng))
				var c=this.map.getCenter();
				gm.FocusMarker(c,this.map)
				return c
			}

			var geo=new gm.Geocoder(), self=this
			geo.geocode({address: center},
				function(result, status) {
					if (status === gm.GeocoderStatus.OK) {
						var center=result[0].geometry.location;
						var map=self.map
						map && map.setCenter(center) && gm.FocusMarker(center,map)
					}
				});
		},
		getData: function(){
			var data=this.tree.getData()
			data.version=this.version
			return data;
		},
		showNode: function(){
			editDialog.reset()
			var node=this.tree.get()
			if(!node)
				return;
			$("#editDialog :input").each(function(){
				$(this).val(node[this.name])
				if(this.name=="desc")
					$(this).trigger('set')
			})
		},
		doOpen: function(data){
			this.tree.setData(data.children)
			$("#plan").show()
			this.showNode()
			this.refreshMap()
		},
		calsum: function(node){
			module._budget+=(node.budget||0)
			//module._days
		},
		start:function(){
			var self=this,map
        	map=this.map=$("#map")
				.gmap({center: "beijing"})
				.data("map")
			
			gm.FocusMarker.onMove=function(event){
				self.tree.set("latlng",{lat:event.latLng.lat(), lng:event.latLng.lng()})
				self.showNode()
			}

			var routeLayer=new gm.RouteLayer(map)
			var activityLayer=new gm.ActivityLayer(map);
			this.tree=$("#plan").tree()
				.bind("init add insert", function(e,node){//remove marker
					e.type=='init' && activityLayer.clear()
					self.tree.traverse(function(data){
						if(data && [NodeType.region, NodeType.path].indexOf(data.type)==-1 && data.latlng){
							activityLayer.add(data)
						}
					},node)
				})
				.bind("trash", function(e,node){//remove marker
					self.tree.traverse(function(data){
						if(data && data.latlng)
							activityLayer.remove(data)
					},node)
				})
				.bind("change",function(event, node){//redraw route
					if($('li',node).length==0){
						var data=$(node).data('data')
						if(data && data.latlng && data.type!=NodeType.path)
							return;
					}
					var path=[], seg={trans:TransType.drive, points:[]}, 
						segs=[seg]
					self.tree.traverse(function(data){
						if(data && data.latlng && data.type==NodeType.path){
							var p=new gm.LatLng(data.latlng.lat, data.latlng.lng)
							!('trans' in data) && (data.trans=TransType.drive)
							if(data.trans!=seg.trans){
								if(seg.points.length==0){
									seg.trans=data.trans
									seg.points.push(p)
								}else{
									seg.points.push(p)
									seg={trans:data.trans,points:[p]}
									segs.push(seg)
								}
							}else
								seg.points.push(p)
							path.push(p)
						}
					})
					routeLayer.path(segs)
					
					if(path && path.length>1){
						var p=[], url=[];
						for(var i=0; i<path.length;i++) 
							p.push(path[i].toUrlValue());
						url.push(p.join('|'));
						url.push("markers=color:green|size:mid|label:|"+path[0].toUrlValue());
						$('#outline img').attr('src',"http://maps.google.com/maps/api/staticmap?size=150x150&maptype=mobile&sensor=true&path=weight:3|"+url.join('&'))
					}else
						$('#outline img').attr('src',"http://maps.gstatic.com/intl/zh_cn/mapfiles/transparent.png")
				})
				.bind("current",function(event){
					self.showNode();
					var data=$(self.tree.current()).data("data"),location
					if(data){
						location=(('latlng' in data) && data.latlng && gm.LatLng.parse(data.latlng))||data.name
						if(location)
							gm.FocusMarker(location,map)
					}
				})
				.bind("set", function(e,changing){
					switch(changing.type){
					case "trans":
					case "latlng":
							$(this).trigger('change')
						break
					}
				})
				.data("tree")
			
			if(database)
				self.tree.setData(database)
			self.tree.trigger('current')
			routeLayer.fit()
			
			$("#editDialog :input").change(function(){
				var value
				if(this.type=="checkbox") 
					value=$("#editDialog :checkbox[name='"+this.name+"']:checked").val()
				else
					value=$(this).val()
				self.tree.set(this.name,value)
				return false
			})
			
			$("#layers :checkbox").click(function(e){
				var layer=gm.OverlayManager.get(this.value)
				if(typeof(layer)!='undefined'){
					if(this.checked)
						layer.show()
					else
						layer.hide()
				}
			})
			
			
			this.context=new gm.Context({map:this.map})			
		}		
	}
})

/*
database:
{
name:"",
trans:[train,airplane,drive,bycicle,walk,boat,bus,taxi]
type:[dinner,bed,view,culture,drive,shopping,fun,charity,business],
date:
time:
desc:""
latlng:{lat,lng}
}
*/