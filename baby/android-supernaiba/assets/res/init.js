ontemplate=function(key,data){
	switch(key){
	"signin":
	"signup":
		//save user/password
		$('.active form').on('submit',function(){
			service.set('account',this.account.value)
			service.set('password',this.password.vale)
		})
		break;
	"showList":
		//online: save data
		var sql
		service.saveData(sql)
		//offline: load data
		service.loadData(sql)
		break;
	"show1":
		var sql
		//online: save detailed data
		service.saveData(sql)
		//offline: load detailed data
		service.loadData(sql)
		break;
	"favorites":
		//online: save favorites data
		service.saveData(sql)
		//offline: load data
		service.loadData(sql)
		break;
	"create":
		//offline: create
		service.saveData()
		break;
	}
}