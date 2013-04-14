package com.yy.app.site;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.test.Test;

@Path("")

public class Site extends AModel.View{
	public final static String CAT_META="site";	
	
	@GET
	@Produces({ MediaType.TEXT_HTML})
	@Test
	public Viewable home(){
		return viewable("/home.html",viewDataModel("Welcome","content"));
	}
	
	@Path("itsnotexisting")
	public Object sub(){
		return new Object();
	}
	
	@GET
	@Path("manifest")
	@Produces({ "text/cache-manifest"})
	public Viewable manifest(){
		return viewable("/manifest.html",viewDataModel("","content"));
	}
}
