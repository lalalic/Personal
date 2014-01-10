define(['doc/openxml/docx/editor/base'],function(Editor){
	$('body').append("<style>\
		div.workspace{position:relative;min-height:1000px;width:100%;margin-top:20px}\
		div.workspace *{padding:0;margin:0;border:0}\
		div.workspace table{width:100%;border-collapse:collapse}\
		</style>")
	
	return Editor.extend({
		className:"workspace",
		attributes:{contenteditable:true, spellcheck:false},
		changePattern:{
			"add:p,add:span,add:br":	"onAddP",
			"remove:br,remove:p":		"onRemoveP",
			"remove:span,add:br":		"onRemoveLastR",
			"add:text,remove:br,text":	"onAddContentToEmptyR",
			"text":						"onChangeContent"},
		initialize:function(){
			this.el.id=this.model.cid
			Editor.prototype.initialize.apply(this,arguments)
			this.editor.observer=new MutationObserver(_.bind(function(changes){
				var action=this.getChangePattern(changes)
				var editor=changes[0].target.editor
					
				switch(action){
				case 'removeP':
					editor=changes[1].target.editor
					break;
				default:
					
				}
				editor && editor[action] && editor[action](changes)
			},this))
			
			var me=this
			this.editor.avoidObserve=function(f){
				this.observer.disconnect()
				f()
				this.observer.observe(me.el,{childList:true,subtree:true,characterData:true})
			}
		},
		render:function(){
			Editor.prototype.render.apply(this,arguments)
			this.editor.observer.observe(this.el,{childList:true,subtree:true,characterData:true})
		},
		getChangePattern:function(changes){
			var actions=_.map(changes,function(change){
				if(change.type=='characterData')
					return 'text';
				if(change.addedNodes.length)
					return 'add:'+(change.addedNodes[0].localName||'text')
				if(change.removedNodes.length)
					return 'remove:'+(change.removedNodes[0].localName||'text')
			})
			console.log(actions.join(','))
			return this.changePattern[actions.join(',')]
		}
	})
})