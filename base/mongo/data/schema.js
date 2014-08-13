module.exports={
	users:[{username:1, $option:{unique:true}},{email:1, $option:{unique:true, sparse:true}}],
	roles:[{name:1, $option:{unique:true}}],
	apps:[{'author._id':1,'name':1, $option:{unique:true}}],
	logs:[{level:1}, {'message.path':1, $option:{name:'accesspath', spare:true}}]
}