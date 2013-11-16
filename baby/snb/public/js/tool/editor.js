define(['tool/uploader'],function(uploader){
	HTMLImageElement.prototype.isData=function(){return this.src.isImageData()}
	var TRIM_TAG=/<\/?\s*(\w*?)\s*\/?>/g,TRIM_LINE=/\n{3,}/gm
		
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
		
		el.insertImage=function(f,reader){
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
		}
		
		el.getThumb=function(){
			if(el['thumb'])
				return el.thumb;
			var thumb=this.querySelector('img');
			if(!thumb)
				return null;
			return new Parse.File('thumb',{base64:thumb.src.toImageData(96)});
		}

		el.getContent=function(imageSaver){
			return this.innerHTML.replace(TRIM_TAG,"\n").replace(TRIM_LINE,'\n\n');
		}
		return el
	}
})