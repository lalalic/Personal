(function($){
	Date.prototype.dateString=function(){
		return this.getFullYear()+"-"+(this.getMonth()+1)+"-"+this.getDate()
	}
	Date.prototype.timeString=function(){
		var minutes=this.getMinutes()
		return this.getHours()+":"+((minutes<10&&'0'||'')+minutes)
	}
	Date.prototype.datetimeString=function(){
		return this.dateString()+" "+ this.timeString()
	}
	Date.prototype.trimDate=function(){
		this.setMilliseconds(0)
		this.setSeconds(0)
		this.setMinutes(0)
		this.setHours(0)
		return this
	}
	Date.prototype.smart=function(){
		var now=new Date()
		if(this.getFullYear()==now.getFullYear()){
			if(this.getMonth()==now.getMonth()){
				switch(Math.abs(now.getDate()-this.getDate())){
				case 0:
					var delta=parseInt((now.getTime()-this.getTime())/1000)
					if(delta<60)
						return delta+'秒以前'
					else if(delta<60*60)
						return parseInt(delta/60)+'分以前'
					return this.timeString()
				case 1:
					return '昨天 '+this.timeString()
				case 2:
					return '前天 '+this.timeString()
				}
			}
		}
		return this.dateString()
	}

	Date.parse=function(d){//parse UTC time to local
		return new Date(d+(new Date(2000,1,1)-Date.UTC(2000,1,1)))
	}
	
	Date.trimDate=function(d){
		return Date.parse(d).dateString()
	}
	
	Date.trimTime=function(d){
		return Date.parse(d).timeString()
		return d.replace(/\d+\-\d+\-\d+/i,'').replace(/[TZ]/g,'')
	}
	
	String.prototype.formatExp=/\$(\w[\w\d_]+)*/gm
	String.prototype.format=function(o){
		var replaced=this.replace(this.formatExp,function(replaced,name){
			try{return new Function("o","return o."+name)(o)}
			catch(e){return ''}
		})
		return replaced;
	}
	String.prototype.toCamelCase=function(){
		return this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) { 
				if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces 
				return index == 0 ? match.toLowerCase() : match.toUpperCase(); 
			})
	}
	String.prototype.deCamelCase=function(){
		return this.replace(/([A-Z])/g,function(match,index){
				return ' '+match.toLowerCase()
			}).trim().replace(/\s+/g," ")
	}
	String.prototype.i10n=function(){
		return 'i10n' in window &&i10n[this.deCamelCase().toLowerCase()]||this.toString()
	}
	String.prototype.escapeJQSelector=function(){
		return this.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g,'\\\\$1') 
	}
	window.thename=function(d){return d.name||d.title||''}
	
	$.ajaxSetup({
		beforeSend: $.mobile.showPageLoadingMsg,
		complete: $.mobile.hidePageLoadingMsg
	})
	//never native select UI
	$.mobile.selectmenu.prototype.options.nativeMenu = false;
	
	//any option change will try keyChange function
	var oldOptionFunction=$.Widget.prototype.option
	$.Widget.prototype.option=function(key,value){
		oldOptionFunction.apply(this,arguments),
			changeHandler=key+'Change'
		if($.isFunction(this[changeHandler]))
			this[changeHandler](value)
		return this
	}
	
	{//smart footer
	function resetActivePageHeight(){
		if( $.support.touchOverflow && $.mobile.touchOverflowEnabled ){
			return;
		}
		var activePage=$.mobile.activePage,
			headerHeight=$( ':jqmData(role="header")',activePage ).height(),
			footerHeight=$( ':jqmData(role="footer")',activePage ).height(),
			pageMinHeight=$.mobile.getScreenHeight()
		$( ':jqmData(role="content")',activePage )
			.css( "min-height", pageMinHeight-headerHeight-footerHeight-35 );
	}
	
	$( document ).bind( "pageshow", resetActivePageHeight );
	$( window ).bind( "throttledresize", resetActivePageHeight );
	}
	
	//reset active button
	$(document).bind('dialogclose pagechange',function(){
		var url=$.mobile.activePage.jqmData('url').split('?')[0],
			navs=$(':jqmData(role="header") :jqmData(role="navbar") a', $.mobile.activePage)
			current=navs.filter('[href*="'+url+'"]')
		if(current.length)
			current.addClass($.mobile.activeBtnClass)
		else
			navs.filter(':last').addClass($.mobile.activeBtnClass)
	})
	
})(jQuery);

//make dialog normal, no page change event
(function($){
window.dialogNum=0
$(document).bind('pagebeforechange', function(e,data){
	if(data.options.role=='dialog'||(data.toPage.is && data.toPage.is(':jqmData(role=dialog)'))){
		if ( typeof data.toPage == "string" )
			$.mobile.loadPage( data.toPage, data.options )
				.done(function( url, options, newPage, dupCachedPage ) {
					$.mobile.activePage.addClass('ui-page-active-with-dialog')
					newPage.refresh().show($.mobile.defaultDialogTransition)
				})
		else{
			$.mobile.activePage.addClass('ui-page-active-with-dialog')
			data.toPage.page().refresh().show($.mobile.defaultDialogTransition)
		}
		dialogNum++
		e.preventDefault();
	}
})

$.mobile.dialog.prototype.close=function(){
	$.mobile.activePage.trigger('dialogclose')
	--dialogNum==0 &&
		$.mobile.activePage.removeClass('ui-page-active-with-dialog')
	this.element.trigger('close').remove();
}
})(jQuery);



/*make mobile widget data-wgtopt-xxx="", data-xx="js: xxx", or data-xxx="on:xxxx"*/
(function($){
	
	var reValue=/^\s*js\s*\:(.*)/, 
		reHandler=/^\s*on\s*\((.*)\)\s*:(.*)/,
		oldData=$.data
		
	$.data=function(elem, name, data,a,b,c){
		var matches=false
		if(arguments.length>=3){
			if(typeof(data)=='string'){
				if((matches=reValue.exec(data))) 
					data=new Function("",matches[1])()
				else if ((matches=reHandler.exec(data)))
					data=new Function(matches[1],matches[2])
			}
		}
		return oldData(elem,name,data,a,b,c)
	}
	
	var _getCreateOptions=$.mobile.widget.prototype._getCreateOptions
	$.mobile.widget.prototype._getCreateOptions=function(){
		var o=_getCreateOptions.apply(this,arguments), 
			resolved={},
			matches
		for(var v in o){
			if(typeof(o[v])!=='string')
				continue;
			try{
				if((matches=reValue.exec(o[v]))) 
					resolved[v]=new Function("",matches[1])()
				else if ((matches=reHandler.exec(o[v])))
					resolved[v]=new Function(matches[1],matches[2])
			}catch(e){
				resolved[v]=''
			}
		}
		o=$.extend(o,resolved)
		return o
	}
})(jQuery);

/**
1. refresh dynamic html content, init all mobile widget
2. execute script in ajax html
*/
(function($){
	var UUID=new Date().getTime()
	$.fn.refresh=function(){
		//create html content
		$.mobile.auth.prototype.enhanceWithin( this );
		$.mobile.admin.prototype.enhanceWithin( this );
		$.mobile.comment.prototype.enhanceWithin( this );
		
		$.mobile.fieldex.prototype.enhanceWithin(this);
		$.mobile.formbutton.prototype.enhanceWithin(this);
		$.mobile.autoload.prototype.enhanceWithin( this );
		
		//change default behaviours and values
		$.mobile.linkTarget.prototype.enhanceWithin( this );
		$.mobile.ajaxform.prototype.enhanceWithin( this );		
		
		//render html content
		$.mobile.collapsible.prototype.enhanceWithin(this);
		$( ":jqmData(role='fieldcontain')", this ).fieldcontain();
		$.mobile.navbar.prototype.enhanceWithin(this);
		$.mobile.listview.prototype.enhanceWithin(this);
		$( ":jqmData(role='nojs')", this ).addClass( "ui-nojs" );
		$.mobile.checkboxradio.prototype.enhanceWithin( this );
		$.mobile.button.prototype.enhanceWithin( this );
		$.mobile.slider.prototype.enhanceWithin( this );
		$.mobile.textinput.prototype.enhanceWithin( this );
		$.mobile.selectmenu.prototype.enhanceWithin( this );
		
		
		$( ":jqmData(role='button'), .ui-bar > a, .ui-header > a, .ui-footer > a, .ui-bar > :jqmData(role='controlgroup') > a", this )
			.not( ".ui-btn, :jqmData(role='none'), :jqmData(role='nojs')" )
			.buttonMarkup();
			
		$( ":jqmData(role='controlgroup')", this ).controlgroup({ excludeInvisible: false });
		
		$( this )
			.find( "a" )
			.not( ".ui-btn, .ui-link-inherit, :jqmData(role='none'), :jqmData(role='nojs')" )
			.addClass( "ui-link" );
			
		$.mobile.UIInit.prototype.enhanceWithin( this );
		
		$.i10n(this)
		try{
			var role=$(this).jqmData('role')
			role && typeof(role)=="string" && $(this)[role] && $(this)[role]("refresh")
		}catch(e){}
		return this;
	}
})(jQuery);

/**show message*/
(function($){
	$.mobile.message=function(m){$('#msg').text(m.i10n())}
	$.mobile.error=function(m){$('#msg').html("<div class='error'>"+m.i10n()+"</div>")}
})(jQuery);

/**link target plugin to load content to a container*/
(function($){
	$.widget("mobile.linkTarget",$.mobile.widget, {
		options:{
			target:false,
			success: false,
			error: false,
			initSelector:"a:jqmData(target)"
		},
		_create: function(){
			var o=this.options, self=this
			$(this.element).click(function(e){
				var url=$(this).attr('href')
				if(o.success){
					$.ajax({
						url:url,
						dataType:'json',
						context: $(o.target),
						success: function(){
							o.success && o.success.apply(this,arguments)
						},
						error: function(){
							o.success && o.success.apply(this,arguments)
						}
					})
				}else{
					$(o.target).load(url,function(){
						$.mobile.hidePageLoadingMsg()
					})	
				}
				return false
			})
		}
	})
	//auto self-init widgets
	$( document ).bind( "pagecreate create", function( e ){
		$.mobile.linkTarget.prototype.enhanceWithin( e.target );
	});
})(jQuery);

/**autoload plugin to load content to a container:<div data-content="" ... data-success="" data-error="">*/
(function($){
	$.widget("mobile.autoload",$.mobile.widget, {
		options:{
			content:null,
			success: false,
			error: false,
			initSelector:":jqmData(content)"
		},
		_create: function(){
			if(!this.options.success && !this.options.error)//html
				return $(this.element).load(this.options.content,function(){$(this).refresh()})
			//json
			var o=this.options
			$.ajax({
				url:o.content,
				dataType:'json',
				context: this.element,
				success: function(){
					o.success && o.success.apply(this,arguments)
				},
				error: function(){
					o.success && o.success.apply(this,arguments)
				}
			})
		}
	})
	//auto self-init widgets
	$( document ).bind( "pagechange", function( e ){
		$.mobile.autoload.prototype.enhanceWithin( e.target );
	});
})(jQuery);


/**"ajax form plugin"*/
(function($){
	window.entity=function(url){
		var _entity;
		$.ajax({
			url: url,
			dataType: "json",
			success: function(data){
				_entity=data
			},
			async: false
		})
		return _entity;
	}
	function array(a){
		return $.isArray(a)&&a||[a]
	}
	$.widget("mobile.ajaxform", $.mobile.widget, {
		options:{
			success:false,
			error:false,
			action:false,
			entity:false,
			initSelector:":jqmData(role='ajaxform')"
		},
		typeHandlers:[
			{selector:"input[type='checkbox'],input[type='radio']",widget:'checkboxradio', valH:array},
			{selector:"select",widget:'selectmenu', valH:function(v,el){return el.multiple&&array(v)||v}},
			{selector:"input[type=date]",widget:'trigger', valH:Date.trimDate},
			{selector:"input[type=time]",widget:'trigger', valH:Date.trimTime},
			{selector:"input[type='range']",widget:'slider'}
		],
		_create: function(){
			var self=this,
				options=this.options
			if(options.action)
				this.element.get(0).action=options.action
			$(this.element)
				.attr('data-'+$.mobile.ns+'ajax','false')
				.submit(function(e){
					if(!self.validate())
						return false;
					var $this=$(this)
					var url=$this.attr('action'),
						method=$this.attr('method')||'get',
						settings = options,
						data
						
					if ( settings.showLoadMsg )
						$.mobile.showPageLoadingMsg()
					
					$.ajax({
						url: url,
						data: $this.serialize(),
						type: method,
						dataType:"json",
						context: $this,
						success: function(){
							settings.success && settings.success.apply(this,arguments)
							$.mobile.message(settings.successMessage||"Updated!");
						},
						error: function(xhr){
							settings.error && settings.error.call(this,xhr.responseText)
							$.mobile.error(settings.errorMessage||xhr.responseText);
						}
					})
					e.preventDefault()
				})
			
			this.options.entity&&this.entityChange(this.options.entity)
		},
		reset: function(){
			this.element.get(0).reset()
			$.each(this.typeHandlers,function(i,a){$(a.selector)[a.widget]('refresh')})
		},
		entityChange:function(_entity){
			var el=this.element
			this.reset()
			if(!_entity) return;
			for(var i in _entity){
				var f=$(":input[name="+i+"]",el),handler=false
				if(f.length==0) continue;
				for(var j in this.typeHandlers){
					if(f.is(this.typeHandlers[j].selector)){
						handler=this.typeHandlers[j]
						break
					}
				}
				handler?f.val(handler.valH(_entity[i],f.get(0)))[handler.widget]('refresh'):f.val(_entity[i])
			}
		},
		validate: function(){
			var form=this.element, focusEl=false
			form.find('.ui-missing').removeClass('ui-missing')
			this.element.find(':input[name][required]')
				.filter('[type=radio],[type=checkbox]').each(function(){
					if($('[name='+this.name+']:checked',form).length==0){
						$(this).closest('.ui-field-contain').addClass('ui-missing')
						!focusEl && (focusEl=this)
					}
				}).end()
				.not('[type=radio],[type=checkbox]').each(function(){
					if(!this.value.trim().length){
						$(this).closest('.ui-field-contain').addClass('ui-missing')
						!focusEl && (focusEl=this)
					}
				})
			focusEl && $(focusEl).focus() && $.mobile.message("some required fields are empty.")
			return !focusEl
		}
	})
		//auto self-init widgets
	$( document ).bind( "pagechange", function( e ){
		$.mobile.ajaxform.prototype.enhanceWithin( e.target );
	});
})(jQuery);

/*execute on pagebeforecreate <div data-onload="on():js code"/>*/
(function($){
	$.widget("mobile.UIInit",$.mobile.widget,{
		options:{
			onload:false,
			initSelector:":jqmData(onload)"
		},
		_create: function(){
			this.options.onload && this.options.onload.apply(this.element);
		}
	})
	$( document ).bind( "pagebeforecreate", function( e ){
		$.mobile.UIInit.prototype.enhanceWithin( e.target );
	})
})(jQuery);

/*form button plugin, to create cancel and sumit buttons
<div data-role="submit"></div>
*/
(function($){	
	$.widget("mobile.formbutton", $.mobile.widget,{
		options:{
			remove:false,
			submit: 'Save',
			reset:false,
			shouldShow: true,
			submitTheme:'a',
			initSelector:":jqmData(role='submit')"
		},
		_create: function(){
			if(!this.options.shouldShow){
				return;
			}
			var html=[''], o=this.options, a='a'.charCodeAt(0), grid=0
			!o.remove&&!o.reset&&(o.reset=true)
			o.reset && ++grid && html.push('<div class="ui-block-'+String.fromCharCode(a+grid-1)
				+'"><button type="reset"><s>Reset</s></button></div>')
			o.remove && ++grid && html.push('<div class="ui-block-'+String.fromCharCode(a+grid-1)
				+'"><button type="button" class="ui-remove"><s>Remove</s></button></div>')
			o.submit && ++grid && html.push('<div class="ui-block-'+String.fromCharCode(a+grid-1)
				+'"><button type="submit" data-theme="'+this.options.submitTheme+'"><s>'+o.submit+'</s></button></div>')
			
			html[0]='<fieldset class="ui-grid-'+String.fromCharCode(a+grid-2)+'">'
			html.push('</fieldset>')
			
			this.element.html(html.join(''))

			o.remove && $.isFunction(o.remove) &&
				this.element.find('button.ui-remove').click(o.remove)
			this.element.i10n()
		}
	})
	
	//auto self-init widgets
	$( document ).bind( "pagebeforecreate", function( e ){
		$.mobile.formbutton.prototype.enhanceWithin( e.target )
	})
})(jQuery);


/*Field plugin, to create label and field input
<input class="fieldex" data-values, data-captions, data-checkeds>
*/
(function($){
	$.widget("mobile.fieldex",$.mobile.widget,{
		options:{
			initSelector:".fieldex"
		},
		refresh: function(){},
		_create:function(){
			this.element.data()//why?
			var element=this.element,			
				node=element.get(0),
				id=node.id=node.id||node.name,
				fieldcontain=$('<div>',{'data-role':'fieldcontain'}),
				possibleValue=this.element.jqmData('value')
			this.element.after(fieldcontain)
			fieldcontain.append(this.element)
			possibleValue!=undefined && (node.value=possibleValue)
			this.UIType=node.tagName.toLowerCase()
			
			if(node.hasAttribute('required'))
				fieldcontain.addClass('ui-required')
			
			
			var values=this.element.jqmData('values'),
				captions=this.element.jqmData('captions')||values,
				checkeds=this.element.jqmData('checkeds')||[]
			
			switch(values&&node.tagName){
				case 'INPUT':
					var fieldset=$('<fieldset>',{'data-role':'controlgroup'})
							.appendTo(fieldcontain),
						legend=$('<legend>').text((node.title||node.name).i10n())
							.appendTo(fieldset)

					this.element
						.appendTo(fieldset)
						.attr({value:values[0],id:id})
						.attr($.inArray(values[0],checkeds)!=-1&&'checked'||'unchecked','1')
						.after($('<label>',{'for':id}).text(captions[0].i10n()))

					$.each(values,function(i,v){
						if(i==0) return;
						$('<input>',{type:node.type,name:node.name,value:v,id:id+"-"+i})
							.appendTo(fieldset)
							.attr($.inArray(values[i],checkeds)!=-1&&'checked'||'unchecked','1')
							.after($('<label>',{'for':id+"-"+i}).text(captions[i].i10n()))
					})

				break
				case 'SELECT':
					$.each(values,function(i,v){
						$('<option>',{value:v})
							.appendTo(node)
							.attr($.inArray(values[i],checkeds)!=-1&&'selected'||'unselected','1')
							.text(captions[i].i10n())
					})
					this.element.before($('<label>',{'for':id}).text((node.title||node.name).i10n()))
				break;
				default:
					switch(this.element.attr('type')){
					case 'date':
						var fieldset=$('<fieldset>',{'data-role':'controlgroup', 'data-type':'horizontal'})
								.appendTo(fieldcontain),
							legend=$('<legend>').text((node.title||node.name).i10n())
								.appendTo(fieldset),
							year=new Date().getFullYear(),
							minY=node.min||(year-10),
							maxY=node.max||(year+5)
						
						$.each([{t:'Year',i0:minY,i1:maxY},
							{t:'Month',i0:1,i1:12},
							{t:'Day',i0:1,i1:31}],function(i,f){
								var select=$('<select>',{"data-native-menu":"true"})
									.appendTo(fieldset)
									.append($('<option>').text(f.t.i10n()))
								for(var i=f.i0;i<=f.i1;i++)
									select.append($('<option>').text(i))
						})
						var selects=fieldset.find('select').change(function(){
							var value=[]
							selects.each(function(){value.push($(this).val())})
							element.val(value.join('-'))
						})
						this.element.hide()
							.bind('refresh',function(){
								var value=this.value
								if(value.length==0)
									return selects.attr('selectedIndex',0).selectmenu('refresh')
								$.each(value.split(/-|\s|\:/),function(i,v){
									$(selects.get(i)).val(v).selectmenu('refresh')
								})
							})
					break
					default:
						this.element.before($('<label>',{'for':id}).text((node.title||node.name).i10n()))
					}
			}
			this.element.removeAttr('title')
		},
		entitiesChange: function(entities){
			switch(this.UIType){
			case 'select':
				var select=this.element
				select.find('option').not('.unremovable').remove()
				$.each(entities,function(){
					$('<option/>',{value:this.ID})
						.text(thename(this).i10n())
						.appendTo(select)
						.data('entity',this)
				})
				select.selectmenu("refresh")
			break
			}
		},
		add: function(entity,notSet){
			switch(this.UIType){
			case 'select':
				var el=$('[value='+entity.ID+']',this.element)
				if(el.length==0)
					el=$('<option/>',{value:entity.ID}).appendTo(this.element)
				el.text(thename(entity).i10n()).data('entity',entity)
				if(!notSet)
					this.element.val(entity.ID).selectmenu("refresh")
			break;
			}
		},
		remove: function(url){
			var el=this.element
			switch(this.UIType){
			case 'select':
				if($(':selected',this.element).is('.unremovable'))
					return;
				$.when(url&&$.post(url,{ID:el.val()}))
					.done(function(){
						el.find(':selected').remove().end()
						el.change()
					})
			break
			}
		}
	})
	$.widget("mobile.editor",$.mobile.widget,{
		options:{
			dialogID:'htmleditor',
			initSelector:":jqmData(role='editor')"
		},
		_create: function(){
			var offset=this.element.offset(),
				left=offset.left+this.element.width()
			$('<span class="ui-icon ui-icon-mini ui-icon-star"></span>')
				.css({position:'absolute',left:left-12,top:offset.top-9})
				.bind('vclick',this,function(e){e.data.showEditor()})
				.appendTo('body')
		},
		showEditor:function(){
			var dialog=$('#'+this.options.dialogID)
			if(dialog.length==0){
				dialog = $( "<div data-role='dialog' id='"+this.options.dialogID+"'></div>")
					.appendTo( $.mobile.pageContainer )
					.append($("<div data-role='header'><h1 class='ui-editor-toolbar'></h1></div>")	)
					.append($("<div data-role='content'><div class='ui-editor-content'></div></div>"))
				new $.editor({content:dialog.find('.ui-editor-content'),toolbar:dialog.find('.ui-editor-toolbar')})
						
				dialog.bind('close',this,function(e){
					e.data.element.val(content.html())
				})
				
				content.height($(dialog).height()*0.8)
			}
			dialog.find('.ui-editor-content').html(this.element.val())
			$.mobile.changePage(dialog)
		}
	})
	$( document ).bind( "pagebeforecreate", function(e){$.mobile.fieldex.prototype.enhanceWithin(e.target)})
	$( document ).bind( "pagechange", function(e){$.mobile.editor.prototype.enhanceWithin(e.target)})
})(jQuery);

//i10n, <s>xxx</s>
(function($){
	$.i10n=function(context){
		if(!window.i10n) return;
		i10n['no i10n']={}
		$('s',context||'body').not('i10n').each(function(){
			var key=$(this).text().toLowerCase()
			if(!i10n[key]){
				i10n['no i10n'][key]=0
				return
			}
			$(this).addClass('i10n').text(i10n[key])
		})
	}
	$.fn.i10n=function(){return this.each(function(){$.i10n(this)})}
})(jQuery);

//page template plugin
(function($){
	$.mobile.page.prototype.options.pagetemplate="/template/default.html"
	var oldhandler=$.mobile.page.prototype._create
	$.mobile.page.prototype._create=function(){
		if('page'==this.element.jqmData('role') && this.options.pagetemplate)
			$(this.element).pagetemplate(this.options.pagetemplate)
		
		return oldhandler.apply(this,arguments)
	}
	$.pagetemplate=function(el,pagetemplate){
		$.ajax({
			url:pagetemplate,
			async:false,
			complete: function(jqXHR, status, responseText){
				responseText = jqXHR.responseText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
				if ( jqXHR.isResolved() ) {
					el=$(el)
					var template=$('<div style="display:none"></div>').append(responseText),
						header=el.find( ":jqmData(role='header')" )
					if(header.length==0){
						el.prepend(template.find( ":jqmData(role='header')" ))
					}
					var footer=el.find( ":jqmData(role='footer')" )
					if(footer.length==0){
						el.append(template.find( ":jqmData(role='footer')" ))
					}
					template.remove()
				}
			}
		})
	}
	$.fn.pagetemplate=function(template){
		//return this.each(function(){$.pagetemplate(this,template)})
	}
})(jQuery);

(function ($){
	$.fn.upload = function (options){
		options = $.extend({}, $.fn.upload.defaults, options)
		
		if (!$('#' + options.iframeID).length)
			$('body').append('<iframe id="' + options.iframeID + '" name="' + options.iframeID + '" style="display:none" />')		
		
		return $(this).each(function (){
			$(this).attr('target', options.iframeID)
				.submit(function ()	{
					if(false===options.onsubmit.apply(this))
						return;
					var iframe = $('#' + options.iframeID).load(function (){
						var response = iframe.contents().find('body'),
							returnReponse=options.json?$.parseJSON(response.html()):response.html()
						options.complete.apply(this, [returnReponse])
						iframe.unbind('load')
						setTimeout(function (){response.html('')}, 1)
					})
				})
		})
	};
	
	
	$.fn.upload.defaults ={
		iframeID : 'uploadframe', 
		json : true, 
		onsubmit: $.noop,
		complete : $.noop
	}
})(jQuery);

//editor
(function($){
	$.editor=function(options){
		this.options=$.extend({},$.editor.default,options)
		var o=this.options,
			self=this,
			icons=o.icons
			commands=o.commands,
			toolbar=$(o.toolbar)
			content=$(o.content).attr('contenteditable',true),
			defaultCommand={
				type:'button',
				execute: function(args,rng){
					self.document.execCommand(this.command,false,args)
				},
				onCreate:function(form){
				}
			}
		this.document=content.get(0).ownerDocument
		this.window=window
		$.each(commands,function(){
			var cmd=$.extend({},defaultCommand,this.substr&&{command:this}||this),
				name=cmd.command||cmd.name,
				title=cmd.title||name,
				bgPos='-'+(o.icons[name.toLowerCase()]-1)*18+'px'
				
			switch(cmd.type){
			case 'button':
				$('<button data-role="none"/>')
					.attr('title',title)
					.css('background-position',bgPos)
					.appendTo(toolbar)
					.click(function(){cmd.execute()	})
			break
			case 'select':					
				var select=$('<select data-role="none"/>').attr('title',title)
					.appendTo(toolbar)
					.change(function(){cmd.execute($(this).val())})
				$.each(cmd.options,function(){
					var opt=$.isPlainObject(this)?opt:{value:this,title:this},
						titleFunc=cmd.formatOpt||function(opt){return opt.title}
					$('<option>'+titleFunc(opt)+'</option>').appendTo(select).attr(opt)
				})
			break
			case 'dialog':
				$('<button data-role="none"/>')
					.attr('title',title)
					.css('background-position',bgPos)
					.appendTo(toolbar)
					.click(function(){
						self.saveRng()
						var form,
							dialog=$('<div data-role="dialog"/>').appendTo($.mobile.pageContainer)
							.append($('<div data-role="header"/>').append($('<h1/>').text(title)))
							.append($('<div data-role="content"/>').append((form=$('<form/>'))))
							
						$.each(cmd.settings,function(){
							$('<'+(this.tag||'input')+'/>',this).addClass('fieldex').appendTo(form)
						})
						form.attr('method','post').refresh()
						cmd.onCreate(self,form)
						form.append($('<fieldset class="ui-grid-a"/>')
							.append('<div class="ui-block-a"><button type="reset">reset</button></div>')
							.append('<div class="ui-block-b"><button type="submit">apply</button></div>'))	
							
						form.submit(function(e){
							e.preventDefault()		
							var args={}
							$.each($(this).serializeArray(),function(){args[this.name]=this.value})
							self.restoreRng()
							cmd.execute(self,args)
							dialog.dialog('close')
							return false
						})
						
						$.mobile.changePage(dialog)
					})
			break
			}
		})
	}
	$.editor.default={
		icons : {"bgcolor":1,"forecolor":2,"bold":3,"justifycenter":4,"inserthorizontalrule":5,"indent":6,"italic":7,
			"justifyfull":8,"justifyleft":9,"insertorderedlist":10,"outdent":11,"removeformat":12,
			"justifyright":13,"save":14,
			"strikethrough":15,"subscript":16,"superscript":17,"insertunorderedlist":18,"underline":19,"image":20,
			"link":21,"unlink":22,"close":23,"arrow":24,"upload":25},
		commands:[
			"bold",'Italic','Underline','strikeThrough',
			'justifyleft','justifycenter','justifyright','justifyfull',
			'insertorderedlist', 'insertunorderedlist',
			'subscript','superscript','removeformat','indent', 
			'outdent','insertHorizontalRule',
			{type:'select',command:"fontsize", options:['8pt','12pt','24pt'], 
				formatOpt:function (opt){return '<font size="'+opt.value+'">'+opt.title+'</font>'}},
			{type:'select',command:"fontname", options:['Arial','Comic Sans','Courier New','??'], 
				formatOpt:function (opt){return '<font face="'+opt.value+'">'+opt.title+'</font>'}},
			{type:'select',command:"formatBlock", options:['p','pre','h1','h2','h3','h4','h5','h6'],
				formatOpt:function formatOpt(opt){return '<'+opt.value+'>'+opt.title+'</'+opt.value+'>'}},
			{type:'dialog',name:'image', settings:[{name:'src'},{name:'alt'},{name:'width',value:150},{name:'height',value:150}],
				onCreate: function(editor,form){
					$(form).parent().parent().attr('id','imageDialgInEditor')
					var img=editor.findInSel('img')
					if(img && img.length){
						img=img.get(0)
						src.value=img.src
						alt.value=img.alt||img.title
						width.value=img.width||$(img).css('width')
						height.value=img.height||$(img).css('height')
					}
					form.append($('<iframe/>',{id:'imgUploader',src:"/res/uploader",frameBorder:0,width:'100%'}))
					imgUploader.selectImage=function(url, title){
						src.value=url
						alt.value=title
					}
				},
				execute: function(editor,args){
					var img=editor.findInSel('img')
					if(img)
						$(img).attr(args)	
					else{
						editor.document.execCommand('insertImage',false,args.src)
						$('img[src="'+args.src+'"]').attr(args)
					}
				}
			}
		]
	}
	$.editor.prototype={
		getSel : function() {
			return (this.window.getSelection) ? this.window.getSelection() : this.document.selection;	
		},
		
		getRng : function() {
			var s = this.getSel();
			if(!s) { return null; }
			return (s.rangeCount > 0) ? s.getRangeAt(0) : s.createRange();
		},
		
		selectRng : function(rng,s) {
			if(this.window.getSelection) {
				s.removeAllRanges();
				s.addRange(rng);
			} else {
				rng.select();
			}
		},
		saveRng : function() {
			this.savedRange = this.getRng();
			this.savedSel = this.getSel();
		},
		
		restoreRng : function() {
			if(this.savedRange) {
				this.selectRng(this.savedRange,this.savedSel);
			}
		},
		selElement: function(){
			var r=this.getRng()
			if(r.startContainer) {
				var contain = r.startContainer;
				if(r.cloneContents().childNodes.length == 1) {
					for(var i=0;i<contain.childNodes.length;i++) {
						var rng = contain.childNodes[i].ownerDocument.createRange();
						rng.selectNode(contain.childNodes[i]);					
						if(r.compareBoundaryPoints(Range.START_TO_START,rng) != 1 && 
							r.compareBoundaryPoints(Range.END_TO_END,rng) != -1) {
							return contain.childNodes[i]
						}
					}
				}
				return contain
			} else {
				return (this.getSel().type == "Control") ? r.item(0) : r.parentElement()
			}
		},
		findInSel: function(selector){
			var el=$(this.selElement())
			if(el.is(selector))
				return $(el)
			var els=el.find(selector)
			if(els.length)
				return $(els.get(0))
			return null
		}
	}
})(jQuery);


/*show a serial of post*/
(function($){
	$.widget("mobile.serial",$.mobile.widget,{
		options:{
			initSelector:":jqmData(role='serial')"
		},
		_create: function(){
			var articles=this.element.find('.article')
			$(this.element.find('.serialnav li').click(function(){
				var articleID=$(this).jqmData('id')
				articles.filter('.activeArticle').hide()
				$('#'+articleID).addClass('activeArticle').show()
				$(this).siblings().removeClass('activeArticle')
				$(this).addClass('activeArticle')
			}).get(0)).click()
		}
	})
	$( document ).bind( "pagebeforecreate", function(e){
		$.mobile.serial.prototype.enhanceWithin( e.target )})
})(jQuery);

/**"auth" plugin -- create signin/signup/forgot password buttons*/
(function( $ ) {
	$.widget("mobile.auth", $.mobile.widget, {
		options:{
			signin:'/widget/auth.html',
			signup:'/widget/auth.html',
			weibo:'/guardian/weibo/signin',
			signout:"/user/signout",
			profile:profileUrl,
			initSelector:":jqmData(role='auth')"
		},
		_create: function(){
			var ul=$('<ul/>').appendTo(this.element),
				o=this.options,
				buttons=!currentUser.isAuthed()?
					[{'data-rel':'dialog',title:'Sign In',id:'signin',href:o.signin, 'data-icon':"info"},
					{title:'Weibo',href:o.weibo, 'data-icon':"info"},
					{'data-rel':'dialog',title:'Sign Up',id:'signup',href:o.signup, 
						'data-icon':"gear",'data-iconpos':"right"}]
					:
					[{href:o.signout,'data-ajax':'false','data-icon':"info",title:'Sign Out'},
					{href:o.profile,'data-ajax':'false','data-icon':"gear",'data-iconpos':"right",
						title:currentUser.isAdmin()&&'Admin'||'Setting'}]
			
			$.each(buttons,function(){
				$('<li/>')
					.append($('<a/>',this)
						.append($('<s/>').text(this.title)))
					.appendTo(ul)})
			this.element.attr('data-role','navbar').parent().controlgroup('refresh')
				.find('a').click(function(){
					$.mobile.auth.action=this.id||'signin'
				})
		}
	})
	
	//auto self-init widgets
	$( document ).bind( "pagebeforecreate", function( e ){
		$.mobile.auth.prototype.enhanceWithin( e.target );
	})
})(jQuery);

(function($){
	function aComment(c){
		return $('<li/>').html('<b>'+c.ownerName+'</b>在<i>'+Date.parse(c.created).smart()+'</i>说: <br/><p>'+c.message+'</p>')
	}
	$.widget("mobile.comment",$.mobile.widget,{
		options:{
			post:0,
			initSelector:":jqmData(role=comment)"
		},
		_create:function(){
			this.element.before('<hr/>')
			var $comments=$('<ol/>')
					.appendTo(this.element)
			
			$.ajax({
				url:"/post/"+this.options.post+"/comments",
				dataType:"json",
				success:function(comments){
					$.each(comments,function(){
						$comments.append(aComment(this))
					})
				}
			})
			
			if(!currentUser.isAuthed()){
				this.element.prepend($('<strong>必须先登录才能留言</strong>'))
			}else{
				$('<form action="/post/comment" data-role="ajaxform" method="post"/>')
					.appendTo(this.element)
					.append($('<textarea class="fieldex" name="comment"/>'))
					.append($('<input type="hidden" name="ID" value="'+this.options.post+'">'))
					.append('<div data-role="submit" data-submit="保存"></div>')
					.jqmData('success',function(c){
						$comments.append(aComment(c))
					})
			}
			
			this.element.refresh()
		}
	})
		//auto self-init widgets
	$( document ).bind( "pagechange", function( e ){
		$.mobile.comment.prototype.enhanceWithin( e.target );
	})
})(jQuery);

/**admin plugin -- show admin tree*/
(function($){		
	$.widget("mobile.admin",$.mobile.widget, {
		options:{
			titleTheme:'e',
			initSelector:":jqmData(role='admin')"
		},
		_create: function(){
			if(!currentUser.isAuthed()){
				$(":jqmData(role='content')").html("You have to first sign-in".i10n())
				return;
			}
			var titleTheme=this.options.titleTheme
			$.ajax({
				url:"/user/admin",
				dataType:"json",
				context: this.element,
				success: function(managedUIs){
					if(!managedUIs)//no any acl
						document.location=errorPage
						
					$('#auth-admin').addClass($.mobile.activeBtnClass)
					var exp=new RegExp($.mobile.path.parseUrl($.mobile.activePage.data('url')).filename,'i')
					
					if(managedUIs.length==1){//only profile
						var info=managedUIs[0].split(","), url=info[3]
						if(!exp.test(url))
							document.location=errorPage
						this.remove()
						$('.ui-secondary').css({width:'100%','float':'auto'})
						return
					}
					
					var html=[], adminUI={}, catLen=0;
					$.each(managedUIs,function(i,managedUI){
						var info=managedUI.split(",")
						var category=info[1], name=info[2], url=info[3]
						if(adminUI[category]===undefined){
							adminUI[category]=[]
							catLen++;
						}
						adminUI[category].push({name:name,url:url})
					})
					
					var current=null,
						icon=false
						ul=$('<ul/>',{'data-role':"listview", 'data-dividertheme':titleTheme, 'data-inset':"true"})
							.appendTo(this)

					for(var cat in adminUI){
						$('<li data-role="list-divider"><s>'+cat+'</s></li>').appendTo(ul)
						$.each(adminUI[cat],function(){
							!current&&exp.test(this.url)&&
								(current=this.name.toCamelCase())&&(icon='grid')
							var li=$('<li/>')
								.attr('data-icon',icon)
								.append($('<a/>',{id:'admin'+this.name.toCamelCase(),href:this.url+'?'+v})
									.attr({'data-ajax':'false'})
									.append($('<s/>').text(this.name)))
								.appendTo(ul)
							if(icon)
								li.addClass($.mobile.activeBtnClass)
							
							icon=false
						})
					}
					
					if(current==null){
						$(":jqmData(role='content')").html("<s>You don't have right.</s>")
						return;
					}
					
					this.refresh()
				}
			})
		}
	})
	//auto self-init widgets
	$( document ).bind( "pagebeforecreate", function( e ){
		$.mobile.admin.prototype.enhanceWithin( e.target );
	})
})(jQuery);

/*a utility to manage resource, to provide list/remove/onselect utility functions*/
(function($){
	$.mobile.resource={
		listview: function($this,data,type){
			$this=$($this)
			var entities=data||[]
			$this.empty()
			if(!entities){
				$.mobile.message("<s>oops! empty.</s>")
				return
			}
			var format=type&&$.mobile.resource.template[type]
			if(!format){
				format=function(entity){
					return '<li><h3>'+thename(entities[i])+'</h3></li>'
				}
			}
			for(var i=0;i<entities.length;i++)
				$this.append('<li>'+format(entities[i])+'</li>')
				
			$this.listview().listview('refresh')
		}
	}
	$.rsliv=$.mobile.resource.listview
})(jQuery);

