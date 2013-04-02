package com.yy.app.auth;

import java.net.URI;
import java.net.URISyntaxException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import javax.persistence.Transient;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import net.tanesha.recaptcha.ReCaptchaFactory;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.googlecode.objectify.condition.IfNotNull;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.site.Profile;
import com.yy.app.test.Test;
import com.yy.provider.oauth.Weibo;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;
import com.yy.rs.Required;
import com.yy.rs.Uniques;
import com.yy.util.Email;

@Entity
@Uniques({ "account" })
@Required({ "account" })
@Unindexed
public class User extends AModel {
	public static final String SESSION_CURRENT_USERID = "u";
	@Indexed(IfNotNull.class)
	public String email;
	@Indexed(IfNotNull.class)
	public String account;

	public String name;

	@Indexed(IfNotNull.class)
	public String activationKey;
	public String status;
	public Boolean spam;
	public Boolean deleted;
	public Date birthday = null;
	public String gender;

	private String password;

	public String conf;

	public int type = 0;

	@Indexed(IfNotNull.class)
	public Long role;

	@Indexed(IfNotNull.class)
	public String sinaID;
	public Boolean sinaConnected;

	@Indexed(IfNotNull.class)
	public String ip;

	// contact information
	public String tel;
	public String qq;
	public String msn;

	public String getName() {
		String name = this.name;
		if (name == null || name.length() == 0)
			name = this.account;
		return name;
	}

	public void setPassword(String password, String confirm) {
		if (password == null || !password.equals(confirm))
			throw new RuntimeException("twice inputs do not equal");
		MessageDigest digest;
		try {
			digest = java.security.MessageDigest.getInstance("MD5");
			digest.update(password.getBytes());
			this.password = new String(digest.digest());
		} catch (NoSuchAlgorithmException e) {
			this.password = password;
		}
	}

	public long checkPassword(String password) {
		MessageDigest digest;
		try {
			digest = java.security.MessageDigest.getInstance("MD5");
			digest.update(password.getBytes());
			if (this.password.equals(new String(digest.digest())))
				return this.ID;
		} catch (NoSuchAlgorithmException e) {
			if (password.equals(this.password))
				return this.ID;
		}
		throw new RuntimeException("Email or Password is not correct.");
	}

	public String newPassword() {
		byte[] pwd = new byte[8];
		new Random().nextBytes(pwd);
		String temp = new String(pwd);
		this.setPassword(temp, temp);
		return temp;
	}

	public boolean hasCapabilities(String... caps) {
		Set<String> roleCaps;
		User currentUser = this;
		if (currentUser.role == null) {
			roleCaps = new HashSet<String>();
		} else {
			Role role = ObjectifyService.begin().get(Role.class,
					currentUser.role);
			roleCaps = role.getCapabilities();
		}

		for (String cap : caps)
			if (!roleCaps.contains(cap))
				return false;
		return true;
	}

	public Set<String> getCapabilities() {
		User currentUser = this;
		Set<String> caps;
		if (currentUser.role == null) {
			caps = new HashSet<String>();
			return caps;
		}
		Role role = ObjectifyService.begin().get(Role.class, currentUser.role);
		caps = role.getCapabilities();
		return caps;
	}

	public boolean isLoggedIn() {
		return this.ID != 0;
	}

	protected static void checkEmail(String email) {
		if (!email.matches(".*@.*"))
			throw new RuntimeException(email + " is not correct email address");
	}

	public void notify(String title, String message) {
		Email.send(email, title, message);
	}

	public boolean isAdmin() {
		User currentUser = this;
		if (currentUser.role == null)
			return false;

		Role admin = ObjectifyService.begin().query(Role.class)
				.filter("name", Role.ADMIN).get();
		if (admin == null)
			return false;
		return admin.ID == currentUser.role;
	}

	public Map<String, List<ManagedUI>> getManagedUI() {
		Set<String> caps = this.getCapabilities();
		Map<String, List<ManagedUI>> resList = new HashMap<String, List<ManagedUI>>();
		for (ManagedUI res : ManagedUI.managedUIs) {
			if (!caps.containsAll(res.capSet))
				continue;
			List<ManagedUI> uis = resList.get(res.category);
			if (uis == null) {
				uis = new ArrayList<ManagedUI>();
				resList.put(res.category, uis);
			}
			uis.add(res);

		}
		return resList;
	}

	@Transient
	public static final ThreadLocal<Long> currentUserID = new ThreadLocal<Long>() {
		@Override
		protected Long initialValue() {
			return 0l;
		}

	};

	public static long getCurrentUserID() {
		return currentUserID.get();
	}

	public static User getCurrentUser() {
		long userID = getCurrentUserID();
		if (userID == 0) {
			User anonymouse = new User();
			anonymouse.ID = 0L;
			anonymouse.name = "anonymouse";
			return anonymouse;
		}
		return (User) ObjectifyService.begin().get(
				Profile.I.userView.getClass().getEnclosingClass(),
				getCurrentUserID());
	}

	@Path("user")
	public static class View extends AModel.View {
		@GET
		@Path("weibo/signin.html")
		public Response weibo() {
			return Response.seeOther(new Weibo().authURI(null)).build();
		}
		
		@GET
		@Path("weibo/oauthed")
		public Response oauthed(@QueryParam("code") String code,
				@DefaultValue("/")@QueryParam("targetURL") String targetURL,
				@Context HttpServletRequest request) throws Exception {
			
			Objectify store = ObjectifyService.begin();
			Weibo wb = new Weibo();
			Map<String, Object> tokenInfo = wb.getAccessToken(code);
			String uid = tokenInfo.get("uid").toString();

			@SuppressWarnings("unchecked")
			List<User> users=(List<User>)store.query(this.getClass().getEnclosingClass())
					.filter("sinaID", uid).limit(2).list();
			User user;
			
			if (users.isEmpty()) {
				/**
				 * create new temp account
				 * it will be deleted if connected
				 */
				user=(User)this.newInstance();
				user.account="weibo_" + uid;
				user.newPassword();
				user.sinaID = uid;
				store.put(user);
			}else{
				user=users.get(0);
				if(users.size()==2 && (user.sinaConnected==null || !user.sinaConnected))
					user=users.get(1);
			}
			
			if (request != null) 
				makeSession(request, user);
			
			if(user.sinaConnected==null || !user.sinaConnected)
				return Response.seeOther(new URI("/user/signin.html")).build();
			
			if (user.isAdmin()) {
				Profile.I.weibo.put("token", tokenInfo.get("access_token").toString());
				Profile.I.weibo.put("expires_in", tokenInfo.get("expires_in").toString());
			}

			return Response.seeOther(new URI(targetURL)).build();
		}

		private void makeSession(HttpServletRequest request, User user) {
			request.getSession().setAttribute(
					User.SESSION_CURRENT_USERID, user.ID);
			User.currentUserID.set(user.ID);
		}

		@POST
		@Path("profile.html")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		public boolean save(@FormParam("name") String name,
				@FormParam("email") String email,
				@FormParam("gender") String gender,
				@FormParam("birthday") String birthday,
				@Context HttpServletRequest req) {
			User current = User.getCurrentUser();
			current.name = name;
			current.email = email;
			current.gender = gender;
			current.birthday = parseDate(birthday);
			beforeSave(current, req);
			ObjectifyService.begin().put(current);
			return true;
		}

		protected void beforeSave(User user, HttpServletRequest req) {

		}

		@POST
		@Path("signin.html")
		@Produces(MediaType.TEXT_HTML)
		public Response signin(@FormParam("account") String account,
				@FormParam("password") String password,
				@FormParam("targetURL") @DefaultValue("/") String targetURL,
				@Context HttpServletRequest req) throws URISyntaxException {
			try {
				signin(account, password, req);
			} catch (Exception e) {
				Viewable view = this.signinUI(targetURL, req);
				@SuppressWarnings("unchecked")
				Map<String, Object> data = (Map<String, Object>) view
						.getModel();
				data.put("accountName", account);
				data.put("error", e.getMessage());
				return Response.ok(view).build();
			}
			return Response.seeOther(new URI(targetURL)).build();
		}

		private User signin(String account, String password,
				HttpServletRequest req) {
			Objectify store =ObjectifyService.begin();
			User user = (User) store
					.query(this.getClass().getEnclosingClass())
					.filter("account", account).get();

			if (user != null && user.checkPassword(password) != 0) {
				if (req != null) {
					User current=User.getCurrentUser();
					if(user.ID!=current.ID 
							&& (current.sinaID!=null && !current.sinaID.isEmpty())
							&& (current.sinaConnected==null || !current.sinaConnected)){
						user.sinaID=current.sinaID;
						user.sinaConnected=true;
						store.put(user);
					}
					makeSession(req, user);
				}
				return user;
			}
			throw new RuntimeException(
					"name or password is not correct, please try again.");
		}

		public User signinFromHttpHeader(HttpServletRequest request) {
			String account = request.getHeader("user");
			String password = request.getHeader("password");
			return signin(account, password, request);
		}

		@GET
		@Path("signup.html")
		@Produces(MediaType.TEXT_HTML)
		@Test
		public Viewable signupUI() {
			return viewable(viewDataModel(
					"sign up",
					"signup",
					"captchaHTML",
					ReCaptchaFactory.newReCaptcha(
							"6LfjUNMSAAAAAP2zyt8Wr8kziObpN-g6K6Btj6jY",
							"6LfjUNMSAAAAAC39TmKRTZ7IVex5sxYwWi82QTaW", false)
							.createRecaptchaHtml(null, null)));
		}

		@POST
		@Path("signup.html")
		@Produces(MediaType.TEXT_HTML)
		public Viewable signup(
				@FormParam("account") String account,
				@FormParam("email") String email,
				@FormParam("password") String password,
				@FormParam("passwordAgain") String passwordAgain,
				@FormParam("name") String name,
				@DefaultValue("false") @FormParam("policy") boolean agreePolicy,
				@FormParam("thumbnail") String thumbnail,
				@Context HttpServletRequest req) {
			User user = null;
			try {
				user = doSignup(account, email, password, passwordAgain, name,
						agreePolicy, thumbnail,req);
			} catch (Exception e) {
				Viewable view = signupUI();
				@SuppressWarnings("unchecked")
				Map<String, Object> data = (Map<String, Object>) view
						.getModel();
				data.put("input", this.getParameters(req));
				data.put("error", e.getMessage());
				return view;
			}
			if (email != null && email.length() > 0) {
				Email.send(email, "Registration",
						"thank you for registration on " + Profile.I.name
								+ ", Please click <a href='/user/activate/"
								+ user.activationKey
								+ "'>here</a> to finish registration.");
				return viewable(viewDataModel("Registrate Successfully",
						"activation_email"));
			}
			return viewable(viewDataModel("Registrate Successfully",
					"registration_complete"));
		}

		public User doSignup(String account, String email, String password,
				String passwordAgain, String name, boolean agreePolicy,
				String thumbnail,	HttpServletRequest req) {
			User user;

			if (account == null || account.length() == 0)
				throw new RuntimeException("account can't be empty.");

			if (!agreePolicy)
				throw new RuntimeException(
						"we can't signup for you if you don't agree the Terms of Use and Privacy Statement.");

			if (password == null || password.length() == 0)
				throw new RuntimeException("password can't be empty.");

			if (!password.equals(passwordAgain))
				throw new RuntimeException("two passwords don't equal.");

			/*
			 * if (req != null) { ReCaptcha captcha =
			 * ReCaptchaFactory.newReCaptcha
			 * ("6LfjUNMSAAAAAP2zyt8Wr8kziObpN-g6K6Btj6jY",
			 * "6LfjUNMSAAAAAC39TmKRTZ7IVex5sxYwWi82QTaW", false);
			 * ReCaptchaResponse response =
			 * captcha.checkAnswer(req.getRemoteAddr(),
			 * req.getParameter("recaptcha_challenge_field"),
			 * req.getParameter("recaptcha_response_field"));
			 * 
			 * if (!response.isValid()) throw new
			 * RuntimeException("verification code is not correct."); }
			 */

			Objectify store = ObjectifyService.begin();

			if (email != null && email.length() > 0) {
				User.checkEmail(email);
				user = (User) store.query(this.getClass().getEnclosingClass())
						.filter("email", email).get();
				if (user != null)
					throw new RuntimeException(
							"the email has already been registered.");
			}

			user = (User) store.query(this.getClass().getEnclosingClass())
					.filter("account", account).get();
			if (user != null)
				throw new RuntimeException(
						"the account has already been registered.");

			try {
				user = (User) this.getClass().getEnclosingClass().newInstance();
			} catch (Exception e) {
				throw new RuntimeException("Can't create "
						+ this.getClass().getSimpleName());
			}
			user.account = account;
			user.email = email;
			user.name = name;
			user.setPassword(password, password);
			if(thumbnail!=null)
				user.thumbnail=thumbnail;
			beforeSignup(user, req);
			
			User current=User.getCurrentUser();
			if(current.ID>0 
					&& (current.sinaID!=null && !current.sinaID.isEmpty())
					&& (current.sinaConnected==null || !current.sinaConnected)){
				user.sinaID=current.sinaID;
				user.sinaConnected=true;
			}

			store.put(user);
			if (req != null) {
				makeSession(req, user);
			}
			return user;
		}

		protected void beforeSignup(User user, HttpServletRequest req) {
			if (req == null)
				return;
			// same IP can't have more than 1 account
			int sameIPCount = ObjectifyService.begin()
					.query(this.getClass().getEnclosingClass())
					.filter("ip", req.getRemoteAddr()).count();
			if (sameIPCount > 0)
				throw new RuntimeException("same IP can't signup two accounts.");
			user.ip = req.getRemoteAddr();
		}

		@GET
		@Path("forgetpassword")
		@Produces(MediaType.TEXT_HTML)
		@Test
		public Viewable resetpasswordUI() {
			return viewable(viewDataModel("Reset Password", "forgetpassword"));
		}

		@POST
		@Path("forgetpassword")
		public String forgetPassword(@FormParam("email") String email) {
			User user = (User) ObjectifyService.begin()
					.query(this.getClass().getEnclosingClass())
					.filter("email", email).get();

			if (user == null)
				throw new RuntimeException(
						"email is not correct, please try again.");

			String newPassword = user.newPassword();

			user.notify("reset password",
					"Your password has already been changed to " + newPassword
							+ ". Please signin and change your password.");
			return "Your password has been reset, please get your new password from your email "
					+ email + ".";
		}

		@GET
		@Path("signout")
		public Response signout(@Context HttpServletRequest req)
				throws URISyntaxException {
			if (req != null) {
				req.getSession().removeAttribute("currentUserID");
				req.getSession().invalidate();
			}
			return Response.seeOther(new URI("/")).build();
		}

		@GET
		@Path("profile.html")
		@Produces(MediaType.TEXT_HTML)
		@AdminUI({ "Profile", "Setting" })
		@Test
		public Viewable profileUI() {
			return viewable(viewDataModel("setting", "profile"));
		}

		@GET
		@Path("signin.html")
		@Produces(MediaType.TEXT_HTML)
		@Test
		public Viewable signinUI(@QueryParam("targetURL") String targetURL,
				@Context HttpServletRequest request) {
			if (targetURL == null && request != null)
				targetURL = request.getHeader("Referer");
			if (targetURL == null || targetURL.indexOf("signin.html") != -1)
				targetURL = "/";
			return viewable(viewDataModel("sign in", "signin", "targetURL",
					targetURL));
		}

		@GET
		@Path("changepassword.html")
		@Produces(MediaType.TEXT_HTML)
		@AdminUI({ "Profile", "Change Password" })
		@Test
		public Viewable changepasswordUI() {
			return viewable(viewDataModel("Change Password", "changepassword"));
		}

		@POST
		@Path("changepassword")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_PLAIN)
		@Caps
		public boolean changepassword(@FormParam("old") String oldPassword,
				@FormParam("new") String newPassword,
				@FormParam("again") String newPassword1) {
			User user = User.getCurrentUser();
			user.checkPassword(oldPassword);
			user.setPassword(newPassword, newPassword1);
			ObjectifyService.begin().put(user);
			return true;
		}

		@GET
		@Path("activate/{key}")
		@Produces(MediaType.TEXT_HTML)
		public Viewable activate(@PathParam("key") String key) {
			Objectify store = ObjectifyService.begin();
			User user = (User) store.query(this.getClass().getEnclosingClass())
					.filter("activationKey", key).get();
			if (user == null) {
				return viewable(viewDataModel("Activation Failed",
						"activation_failed"));
			} else {
				user.activationKey = null;
				store.put(user);
				return viewable(viewDataModel("Activation Success",
						"activation_complete"));
			}
		}

		@GET
		@Path("existing/{account}")
		@Produces(MediaType.APPLICATION_JSON)
		@Test(value = "__tester__", patterns = "True")
		public boolean existing(String account) {
			return ObjectifyService.begin()
					.query(getClass().getEnclosingClass())
					.filter("account", account).count() > 0;
		}
	}
}
