define(['view/base','tool/offline'],function(View,offline){
	var ListPage=View.ListPage
	return new (ListPage.extend({
		itemTemplate:'#tmplSyncItem',
		collection: new Parse.Collection,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			offline.on('sync',function(rs){
				for(var i=0,len=rs.rows.length;i<len;i++){
					this.addOne(rs.rows.item(i))
				}
			},this)
			
			offline.on('syncingOne',this.syncingOne,this)
			offline.on('syncedOne',this.syncedOne,this)
		},
		show: function(){
			ListPage.prototype.show.apply(this,arguments)
			var me=this, promise=new Promise
			offline.sync()
				.then(function(){
					me.hide()
					promise.resolve()
				},function(e){
					promise.reject(e)
				})
			return promise
		},
		syncingOne: function(row){
			this.$el.find('#sync_'+row.createdAt).css('background-color','yellow')
		},
		syncedOne: function(row,object){
			this.$el.find('#sync_'+row.createdAt).css('background-color','green')
		}
	}));
})