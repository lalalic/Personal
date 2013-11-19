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
		it('File Reader',function(){
			expect(FileReader).toBeTruthy()
		})
		
		xit('Resize Selected Image',function(){
			var p=new Promise()
			uploader.bind({onSave: function(f,resizedData,rawReadEvent){
					if(rawReadEvent.target.result.match(/^data:/ 
						&& resizedData.match(/^data:/)))
						p.resolve()
					else
						p.reject()
					return false
				},
				size:512
				})
			uploader.click()
			asyncIt(p)
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
})