package com.yy.app.auth;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.site.Profile;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;
import com.yy.rs.Uniques;

@Entity
@Uniques({ "name" })
@Unindexed
public class Role extends AModel {
	public final static String ADMIN = "admin";
	public static Set<String> CAPS = new HashSet<String>();
	@Indexed
	public String name;

	private Set<String> capabilities;

	public Set<Long> members = new HashSet<Long>();

	public Set<String> getCapabilities() {
		return capabilities;
	}

	public void setCapabilities(Set<String> capabilities) {
		this.capabilities = capabilities;
	}

	public static void requestLogin(String targetUrl) {
		if (User.getCurrentUserID() == 0)
			throw new NotLoginException(targetUrl);
	}

	public static void requestCapabilities(String... caps) {
		User current = User.getCurrentUser();
		if (current.isAdmin())
			return;
		if (!current.hasCapabilities(caps))
			throw new RuntimeException("You don't have enough right!");
	}

	public static void requestAdmin() {
		if (!User.getCurrentUser().isAdmin())
			throw new RuntimeException("You don't have enough right!");
	}

	public static void request(boolean condition) {
		if (!condition)
			reject();
	}

	public static void reject() {
		throw new RuntimeException("You don't have enough right!");
	}

	public static User initAdminRole(String account, String email,
			String password, String name) {
		User.View userView = Profile.I.userView;
		Role adminRole;
		Objectify store = ObjectifyService.begin();

		User admin = (User) store
				.query(userView.getClass().getEnclosingClass())
				.filter("account", account).get();

		if (admin == null)
			admin = userView.doSignup(account, email, password,
					password, name, true, null, null);

		adminRole = store.query(Role.class).filter("name", Role.ADMIN).get();
		if (adminRole == null) {
			adminRole = new Role();
			adminRole.name = Role.ADMIN;
			adminRole.author=admin.ID;
		}
		adminRole.setCapabilities(CAPS);
		adminRole.members.add(admin.ID);
		store.put(adminRole);

		if (admin.role != adminRole.ID) {
			admin.role = adminRole.ID;
			store.put(admin);
		}

		return admin;
	}

	@Path("role")
	public static class View extends AModel.View {

		@POST
		@Path("/save")
		@Caps("Create Roles")
		public Role save(@FormParam("ID") long ID,
				@FormParam("name") String name,
				@FormParam("capabilities") Set<String> capabilities,
				@FormParam("members") Set<Long> members) {
			Objectify store = ObjectifyService.begin();
			ArrayList<AModel> entities = new ArrayList<AModel>();

			Role role = (Role) this.get(store, ID);

			/**
			 * can't change admin name and capabilities
			 */
			if (!Role.ADMIN.equalsIgnoreCase(role.name)) {
				role.name = name;
				role.setCapabilities(capabilities);
				store.put(role);
				if (ID == 0)
					ID = role.ID;
			}

			if (role.members == null)
				role.members = new HashSet<Long>();
			if (members == null)
				members = new HashSet<Long>();

			if (!role.members.equals(members))
				Role.requestCapabilities("Assign Roles");

			if (role.members != null) {
				for (long personID : role.members) {// remove
					if (members.contains(personID))
						continue;
					User person = store.get(User.class, personID);
					person.role = null;
					entities.add(person);
				}
			}

			if (members != null) {
				for (long personID : members) {// add
					if (role.members.contains(personID))
						continue;
					User person = store.get(User.class, personID);
					person.role = ID;
					entities.add(person);
				}
			}

			role.members = members;
			entities.add(role);

			// no admin, then reject
			if (Role.ADMIN.equalsIgnoreCase(role.name)
					&& role.members.size() == 0)
				Role.reject();

			store.put(entities);
			return role;
		}

		@POST
		@Path("/assign")
		@Caps("Assign Roles")
		public static void assign(@FormParam("role") long roleID,
				@FormParam("user") long personID) {
			Objectify store = ObjectifyService.begin();
			User person = store.get(User.class, personID);
			person.role = roleID;
			Role role = store.get(Role.class, roleID);
			role.members.add(personID);
			store.put(person, role);
		}

		@POST
		@Path("/revoke")
		@Caps("Assign Roles")
		public static void revoke(@FormParam("role") long roleID,
				@FormParam("user") long personID) {
			Objectify store = ObjectifyService.begin();
			User person = store.get(User.class, personID);
			Role role = store.get(Role.class, roleID);
			if (roleID == person.role)
				person.role = null;

			role.members.remove(personID);

			// no admin, then reject
			if (Role.ADMIN.equals(role.name) && role.members.size() == 0)
				Role.reject();

			store.put(person, role);
		}

		@GET
		@Path("/allcaps")
		@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
		public static Set<String> getAllCapabilities() {
			return CAPS;
		}

		@GET
		@Path("/admin.html")
		@Produces(MediaType.TEXT_HTML)
		@Caps({ "Create Roles", "Assign Roles" })
		@AdminUI({ "Configuration", "Role" })
		public Viewable adminUI(@Context HttpServletRequest req) {
			Role.requestLogin(req.getRequestURI());
			return viewable(viewDataModel("Role Management", "role"));
		}
	}
}
