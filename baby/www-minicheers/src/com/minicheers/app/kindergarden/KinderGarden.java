package com.minicheers.app.kindergarden;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.minicheers.app.account.Child;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.app.cms.Post;
import com.yy.app.cms.SlavablePost;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;
import com.yy.rs.Required;

@Unindexed
@Required("title")
public class KinderGarden extends SlavablePost {
	public String alias;

	@Indexed
	public String city;
	@Indexed
	public String area;
	public String address;

	public String landmarkers;
	public String latlng;
	public String bus;
	public String stopInfo;

	public String tel;
	public String web;
	public String weibo;

	public String officeTime;
	public boolean freeTry;
	public boolean wifi;
	public boolean cardPay;
	public boolean feedingRoom;
	public boolean disableFacility;

	public List<String> classTypes;
	public List<String> ageTypes;
	public Set<String> instructors;

	@Indexed
	public int affinityRating;
	public int attractiveRating;
	public int expressiveRating;
	public int bridingRating;
	public int chineseRating;
	public int englishRating;

	public int affinityRatingSum;
	public int attractiveRatingSum;
	public int expressiveRatingSum;
	public int bridingRatingSum;
	public int chineseRatingSum;
	public int englishRatingSum;

	public KinderGarden() {
		parent = 0l;
	}
	

	@Override
	public Post.View getSlaveView() {
		return new Share.View();
	}
	
	public void addClassType(String ct){
		if(this.classTypes==null)
			classTypes=new ArrayList<String>();
		classTypes.add(ct);
	}
	
	public void addInstructor(String name){
		if(this.instructors==null)
			instructors=new TreeSet<String>();
		instructors.add(name);
	}

	@Path("zaojiao")
	public static class View extends SlavablePost.View {
		
		@GET
		@Path("create.html")
		@Caps
		@Override
		@Test
		public Viewable createUI(
				@DefaultValue("0") @QueryParam("parent") long parent)
				throws InstantiationException, IllegalAccessException {
			Viewable view = super.createUI(parent);
			@SuppressWarnings("unchecked")
			Map<String, Object> data = (Map<String, Object>) view.getModel();
			data.put("titleContent", "创建早教机构");
			return view;
		}

		@GET
		@Path("edit/{ID:(\\d+)}.shtml")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests(@Test(value={".ID"}, model=EnclosingModel.class))
		public Viewable editUI(@PathParam("ID") long ID) {
			Viewable view = super.editUI(ID);
			@SuppressWarnings("unchecked")
			Map<String, Object> data = (Map<String, Object>) view.getModel();
			data.put("titleContent", "修改早教机构");
			return view;
		}

		@POST
		@Path("post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({@Test(note="create"),@Test(note="edit")})
		public Response save(
				@TestValues({
					@TestValue,
					@TestValue(field="ID", value=".ID", model=EnclosingModel.class)})
				@DefaultValue("0") @FormParam("ID") long ID,
				
				@DefaultValue("0") @FormParam("parent") long parent,
				@TestValue(field="title", value=Runner.TEST_TITLE) @FormParam("title") String title,
				@TestValue(field="content", value=Runner.TEST_CONTENT)@FormParam("content") String content,
				@FormParam("alias") String alias,
				@FormParam("tel") String tel, @FormParam("web") String web,
				@FormParam("weibo") String weibo,
				@FormParam("classTypes") List<String> classTypes,
				@FormParam("ageTypes") List<String> ageTypes,
				@FormParam("instructors") String instructors,
				@FormParam("officeTime") String officeTime,
				@FormParam("latlng") String latlng,
				@FormParam("city") String city,
				@FormParam("area") String area,
				@FormParam("address") String address,
				@FormParam("landmarkers") String landmarkers,
				@FormParam("bus") String bus, 
				@FormParam("subs") String subs,
				@FormParam("freeTry") boolean freeTry,
				@FormParam("wifi") boolean wifi,
				@FormParam("cardPay") boolean cardPay,
				@FormParam("feedingRoom") boolean feedingRoom,
				@FormParam("disableFacility") boolean disableFacility)
				throws URISyntaxException {
			Objectify store = ObjectifyService.begin();
			KinderGarden kg = (KinderGarden) this.get(store, ID);
			kg.title = title;
			kg.setContent(content);
			kg.parent = parent;
			kg.alias = alias;

			kg.city=city;
			kg.area=area;
			kg.address = address;
			kg.landmarkers = landmarkers;
			kg.latlng = latlng;
			kg.tel = tel;
			kg.officeTime = officeTime;
			kg.bus = bus;
			kg.classTypes = classTypes;
			kg.ageTypes=ageTypes;
			kg.instructors= parseSet(instructors);
			kg.web = web;
			kg.weibo = weibo;
			kg.freeTry=freeTry;
			kg.wifi = wifi;
			kg.cardPay = cardPay;
			kg.feedingRoom = feedingRoom;
			kg.disableFacility = disableFacility;
			

			store.put(kg);
			kg.postPersist();

			if (subs != null && (subs = subs.trim()).length() > 0) {
				List<KinderGarden> subKGs = new ArrayList<KinderGarden>();
				for (String sub : subs.split("\n|,")) {
					sub = sub.trim();
					if (sub.length() == 0)
						continue;
					KinderGarden subKG = store.query(KinderGarden.class)
							.filter("parent", kg.ID).filter("title", sub).get();
					if (subKG == null) {
						subKG = new KinderGarden();
						subKG.parent = kg.ID;
						subKG.title = sub;
						subKG.alias = alias;
						subKG.officeTime = kg.officeTime;
						subKG.classTypes = kg.classTypes;
						subKG.ageTypes=kg.ageTypes;
						subKG.web = kg.web;
						subKG.weibo = kg.weibo;
						subKG.freeTry=freeTry;
						subKG.wifi = kg.wifi;
						subKG.cardPay = kg.cardPay;
						subKG.feedingRoom = kg.feedingRoom;
						subKG.disableFacility = kg.disableFacility;

						subKG.setContent(kg.getContent());
						subKGs.add(subKG);
					}
				}
				if (subKGs.size() > 0)
					store.put(subKGs);
			}

			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + kg.ID + ".shtml"))
					.build();
		}
		
		@SuppressWarnings("unused")
		private List<Long> saveClassType(String classTypes, Long parent){
			Objectify store = ObjectifyService.begin();
			List<Long> types=new ArrayList<Long>();
			for(String classType : classTypes.split("\n|,")){
				if((classType=classType.trim()).length()==0)
					continue;
				ClassType type=store.query(ClassType.class).filter("name", classType).get();
				if(type==null){
					type=new ClassType();
					type.parent=parent;
					type.name=classType;
					store.put(type);
				}
				types.add(type.ID);
			}
			return types;
		}

		@POST
		@Path("slave/post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({@Test(note="create"), @Test(note="edit")})
		public Response save(
				@TestValues({
					@TestValue,
					@TestValue(field="ID", value=".ID", model=Share.class)}) 
				@DefaultValue("0") @FormParam("ID") long ID,
				
				@TestValue(field="parent", value=".ID", model=EnclosingModel.class) 
				@DefaultValue("0") @FormParam("parent") long parent,
				
				@TestValue(field="title", value=Runner.TEST_TITLE) @FormParam("title") String title,
				@TestValue(field="content", value=Runner.TEST_CONTENT)@FormParam("content") String content,
				
				@FormParam("instructor") String instructor,
				@TestValue(field="newInstructor", value=Runner.TEST_TITLE) @FormParam("newInstructor") String newInstructor,

				@FormParam("child") long child,
				@TestValue(field="nick", value=Runner.TEST_TITLE) @FormParam("nick") String childname,
				@TestValue(field="childbod", value="2001-1-1") @FormParam("childbod") String childbod,
				
				@TestValue(field="coursetime", value="2004-1-1-12-30") @FormParam("coursetime") String coursetime,
				
				@FormParam("classType") String classType,
				@TestValue(field="newClassType", value=Runner.TEST_TITLE)@FormParam("newClassType") String newClassType,
				
				@FormParam("generalRating") int generalRating,
				@FormParam("affinityRating") int affinityRating,
				@FormParam("attractiveRating") int attractiveRating,
				@FormParam("expressiveRating") int expressiveRating,
				@FormParam("bridingRating") int bridingRating,
				@FormParam("chineseRating") int chineseRating,
				@FormParam("englishRating") int englishRating)
				throws URISyntaxException {
			Objectify store = ObjectifyService.begin();
			List<AModel> models = new ArrayList<AModel>();
			Share share = (Share) (new Share.View().get(store, ID));
			KinderGarden kg = (KinderGarden) this.get(store, parent);
			models.add(share);

			share.parent = parent;
			
			share.title = title;
			share.setContent(content);
			Child theChild=getChild(child, childname, childbod);
			if(theChild!=null){
				share.child=theChild.ID;
				share.ageMonthes=theChild.getMonthes();
			}
			
			share.coursetime=parseDate(coursetime);
			if(newClassType!=null && newClassType.length()>0){
				share.classType=newClassType;
				kg.addClassType(newClassType);
			}else{
				share.classType=classType;
			}
			
			if(newInstructor!=null && newInstructor.length()>0){
				share.instructor=newInstructor;
				kg.addInstructor(newInstructor);
			}else
				share.instructor=instructor;

			// rating
			share.generalRating = generalRating;
			share.affinityRating = affinityRating;
			share.attractiveRating = attractiveRating;
			share.expressiveRating = expressiveRating;
			share.bridingRating = bridingRating;
			share.chineseRating = chineseRating;
			share.englishRating = englishRating;

			synchronized (getClass()) {
				models.add(kg);
				if(ID==0)
					kg.slaveCount++;
				kg.ratingCount++;
				kg.generalRatingSum += share.generalRating;
				kg.affinityRatingSum += share.affinityRating;
				kg.attractiveRatingSum += share.attractiveRating;
				kg.expressiveRatingSum += share.expressiveRating;
				kg.bridingRatingSum += share.bridingRating;
				kg.chineseRatingSum += share.chineseRating;
				kg.englishRatingSum += share.englishRating;

				kg.generalRating = kg.generalRatingSum / kg.ratingCount;
				kg.affinityRating = kg.affinityRatingSum / kg.ratingCount;
				kg.attractiveRating = kg.attractiveRatingSum / kg.ratingCount;
				kg.expressiveRating = kg.expressiveRatingSum / kg.ratingCount;
				kg.bridingRating = kg.bridingRatingSum / kg.ratingCount;
				kg.chineseRating = kg.chineseRatingSum / kg.ratingCount;
				kg.englishRating = kg.englishRatingSum / kg.ratingCount;

				if (kg.parent != null && kg.parent > 0) {
					KinderGarden kgParent = (KinderGarden) this.get(store,
							kg.parent);
					models.add(kgParent);
					kgParent.ratingCount++;
					kgParent.generalRatingSum += kg.generalRating;
					kgParent.affinityRatingSum += kg.affinityRating;
					kgParent.attractiveRatingSum += kg.attractiveRating;
					kgParent.expressiveRatingSum += kg.expressiveRating;
					kgParent.bridingRatingSum += kg.bridingRating;
					kgParent.chineseRatingSum += kg.chineseRating;
					kgParent.englishRatingSum += kg.englishRating;

					kgParent.generalRating = kgParent.generalRatingSum
							/ kgParent.ratingCount;
					kgParent.affinityRating = kgParent.affinityRatingSum
							/ kgParent.ratingCount;
					kgParent.attractiveRating = kgParent.attractiveRatingSum
							/ kgParent.ratingCount;
					kgParent.expressiveRating = kgParent.expressiveRatingSum
							/ kgParent.ratingCount;
					kgParent.bridingRating = kgParent.bridingRatingSum
							/ kgParent.ratingCount;
					kgParent.chineseRating = kgParent.chineseRatingSum
							/ kgParent.ratingCount;
					kgParent.englishRating = kgParent.englishRatingSum
							/ kgParent.ratingCount;
				}
				store.put(models);
			}

			
			share.postPersist();

			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + parent + ".shtml"))
					.build();
		}

		private Child getChild(long childID, String childName,
				String childBOD) {
			Child child = null;
			if (childID > 0)
				child = ObjectifyService.begin().get(Child.class, childID);
			else if (childName.length() > 1) {
				child = new Child();
				child.parent = User.getCurrentUserID();
				child.nick = childName;
				child.birthday = this.parseDate(childBOD);
				ObjectifyService.begin().put(child);
			}
			return child;
		}
	}
}
