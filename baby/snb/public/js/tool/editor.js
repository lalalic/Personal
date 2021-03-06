define(['tool/uploader'],function(uploader){
	HTMLImageElement.prototype.isData=function(){return this.src.isImageData()}
	var TRIM_TAG=/<\/?\s*(\w*?)\s*\/?>/g,TRIM_LINE=/\n{3,}/gm
	
	$('body').append('<style>\
		.editor{background-color:white;height:100%;padding:10px;-webkit-user-select:text;-moz-user-select:text;user-select:text}\
		.editor img{clear:both;max-width:150px;margin:5px auto;display:block;cursor:default;border:2px solid transparent}\
		.editor img:hover{border-color:blue}\
		.editor:empty:before{content:attr(placeholder); color:lightgray}\
		</style>')
		
	return function(el){
		if(el['insertImage'])
			return el;
		var savedRange,isInFocus=false;
		function saveSelection(){
			savedRange=getSelection ? getSelection().getRangeAt(0) : document.selection.createRange()
		}

		function restoreSelection(){
			isInFocus = true;
			if (savedRange != null) {
				if (window.getSelection){//non IE and there is already a selection
					var s = window.getSelection();
					if (s.rangeCount > 0) 
						s.removeAllRanges();
					s.addRange(savedRange);
				} else if (document.selection)//IE
					savedRange.select();
			}
		}
		
		function cancelEvent(e){
			if (isInFocus == false && savedRange != null) {
				if (e && e.preventDefault) {
					e.stopPropagation(); // DOM style (return false doesn't always work in FF)
					e.preventDefault();
				}else 
					window.event.cancelBubble = true;//IE stopPropagation
				restoreSelection();
				return false; // false = IE style
			}
		}
		
		el.addEventListener('blur',function(){isInFocus=false})
		el.addEventListener('mouseup',saveSelection)
		el.addEventListener('keyup',saveSelection)
		el.addEventListener('focus',restoreSelection)
		el.addEventListener('paste',function(e){
			document.execCommand('insertText',false,e.clipboardData.getData('text/plain').replace(/\r/g,''))
			e.preventDefault()
			return false
		})
		
		return _.extend(el,{
			insertImage:function(f,reader){
				uploader.bind(el,{
					success:function(f){f._img.src=f.url()},
					size:1024,
					onSave: function(f,data){
							el.focus()
							restoreSelection();
							document.execCommand("insertHTML", false, "<br><img id='_editorImg'><br>");
							(f._img=_editorImg).src=data
							_editorImg.removeAttribute('id')
							saveSelection()
						}
				}).click()
			},
			linkImage: function(url){
				if((url=prompt(text("input image url")))){
					el.focus()
					restoreSelection();
					document.execCommand("insertHTML", false, "<br><img src='"+url+"'><br>");
				}
			},
			pickUser: function(){},
			bold: function(){
			},
			getThumb:function(){
				if(el['thumb'])
					return el.thumb;
				var thumb=this.querySelector('img');
				if(!thumb)
					return null;
				return thumb.src;
			},
			getContent:function(){
				return this.innerHTML.replace(TRIM_TAG,"\n").replace(TRIM_LINE,'\n\n');
			},
			setContent: function(content){
				this.innerHTML=content
			}
		})
	}
})