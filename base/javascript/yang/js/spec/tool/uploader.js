define(['tool/uploader'],function(uploader){
	function expectUrl(url,pattern){
		if(Promise.is(url)){
			asyncIt(url,function(url){
				expect(url).toMatch(pattern)
			})
		}else
			expect(url).toMatch(pattern)
	}
	describe('Uploader features',function(){
		it('Typed Uploader',function(){
			expect(uploader.type).toBeTruthy()
		})
		
		switch(uploader.type){
		case 'phonegap':
			describe('phonegap uploader features',function(){
				it('camera setup',function(){
					expect(navigator.camera).toBeTruthy()
				})
				
				it('Picture Selection Window',function(){
					var p=new Promise,p1=new Promise
					uploader.bind(null,{
						onSave:function(f,dataURL){
							p.resolve(dataURL)
						},
						onSaved:function(f){
							p1.resolve(f.url())
						}
					}).click()
					asyncIt(Promise.when([p,p1]),null,null,30000)
				})
			})
		break
		default:
			describe('web uploader features',function(){
				it('File Reader Support',function(){
					expect(FileReader).toBeTruthy()
				})
				
				it('Resize Data Image',function(){
					var _imgSizer=document.getElementById('_imgSizer'),
						ctx=_imgSizer.getContext('2d'),
						style=_imgSizer.style
					_imgSizer.width=_imgSizer.height=150;
					style.width=style.height="150px";
					ctx.clearRect(0,0,150,150)
					ctx.fillStyle="red"
					ctx.fillRect(0,0,150,150)
					var dataURL=_imgSizer.toDataURL()
					expectUrl(dataURL.toImageDataURL(50),/^data:/)
				})
			})	
		}
	})
})