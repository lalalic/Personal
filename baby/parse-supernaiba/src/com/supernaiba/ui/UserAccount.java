package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBarItem;
import greendroid.widget.SegmentedAdapter;
import greendroid.widget.SegmentedBar.OnSegmentChangeListener;
import greendroid.widget.SegmentedHost;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;

import com.parse.LogInCallback;
import com.parse.ParseException;
import com.parse.ParseUser;
import com.parse.RequestPasswordResetCallback;
import com.parse.SignUpCallback;
import com.supernaiba.R;

public class UserAccount extends GDActivity {
	public enum Type{
		Signin, Signup, ForgetPassword;
	}
	private static final int Signin=0, Signup=1, ForgetPassword=2, ResetPassword=3; 
	private SegmentedHost segments;
	private int focusSegment;
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		addActionBarItem(ActionBarItem.Type.Export);
		setActionBarContentView(R.layout.segmented_controls);
		segments = (SegmentedHost) findViewById(R.id.segmented_host);
		segments.setAdapter(new SegmentedAdapter(){

			@Override
			public int getCount() {
				return 4;
			}

			@Override
			public View getView(int position, ViewGroup parent) {
				switch(position){
				case Signup:
					return getLayoutInflater().inflate(R.layout.signup,null);
				case ForgetPassword:
					return getLayoutInflater().inflate(R.layout.forget_password,null);
				case ResetPassword:
					return getLayoutInflater().inflate(R.layout.reset_password,null);
				case Signin:
				default:
					return getLayoutInflater().inflate(R.layout.signin,null);
				}
			}

			@Override
			public String getSegmentTitle(int position) {
				switch(position){
				case Signup:
					return getString(R.string.signup);
				case ForgetPassword:
					return getString(R.string.forgetpassword);
				case ResetPassword:
					return getString(R.string.resetPassword);
					
				case Signin:
				default:
					return getString(R.string.signin);
				}
			}
			
		});
		
		segments.getSegmentedBar().setOnSegmentChangeListener(new OnSegmentChangeListener(){
			@Override
			public void onSegmentChange(int i, boolean flag) {
				focusSegment=i;
			}
			
		});
	}
	
	

	@Override
	public boolean onHandleActionBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_export:
			switch(focusSegment){
			case Signup:
				signup(null);
				break;
			case ForgetPassword:
				forgetPassword(null);
				break;
			case ResetPassword:
				resetPassword(null);
				break;
				
			case Signin:
			default:
				signin(null);
			}
			break;
		default:
			this.onBackPressed();
		}
		return true;
	}



	private void resetPassword(View view) {
		final String oldPassword=this.getEditText(R.id.oldpassword);
		String password=this.getEditText(R.id.password);
		String passwordAgain=this.getEditText(R.id.passwordAgain);
		if(password.equals(passwordAgain)){
			msg("Reset Password doesn't match. Please fix it!");
			return;
		}
		ParseUser user=ParseUser.getCurrentUser();
		ParseUser.logInInBackground(user.getUsername(), password, new LogInCallback(){
			@Override
			public void done(ParseUser user, ParseException ex) {
				if(user!=null){
					user.setPassword(oldPassword);
					user.saveInBackground();
				}else if(ex!=null){
					switch(ex.getCode()){
					case ParseException.USERNAME_MISSING:
					case ParseException.PASSWORD_MISSING:
					default:
						msg(ex.getMessage());
						break;
					}
				}
			}
			
		});
	}



	private void signin(View view) {
		String username=this.getEditText(R.id.account);
		String password=this.getEditText(R.id.password);
		
		ParseUser.logInInBackground(username, password, new LogInCallback(){
			@Override
			public void done(ParseUser user, ParseException ex) {
				if(user!=null){
					setResult(RESULT_OK,new Intent()); 
					UserAccount.this.finish();
				}else if(ex!=null){
					switch(ex.getCode()){
					case ParseException.USERNAME_MISSING:
					case ParseException.PASSWORD_MISSING:
					default:
						msg(ex.getMessage());
						break;
					}
				}
			}
			
		});
	}

	private void signup(View view) {
		String username=this.getEditText(R.id.account);
		String password=this.getEditText(R.id.password);
		String passwordAgain=this.getEditText(R.id.passwordAgain);
		if(password.equals(passwordAgain)){
			msg("Password doesn't match. Please fix it!");
			return;
		}
		String email=this.getEditText(R.id.email);
		ParseUser user=new ParseUser();
		user.setUsername(username);
		user.setPassword(password);
		if(email.length()>0)
			user.setEmail(email);
		user.signUpInBackground(new SignUpCallback(){

			@Override
			public void done(ParseException ex) {
				if(ex==null){
					setResult(RESULT_OK,new Intent()); 
					UserAccount.this.finish();
				}else {
					switch(ex.getCode()){
					case ParseException.USERNAME_MISSING:
					case ParseException.PASSWORD_MISSING:
					default:
						msg(ex.getMessage());
						break;
					}
				}
			}
			
		});
	}

	private void forgetPassword(View view) {
		ParseUser.requestPasswordResetInBackground(this.getEditText(R.id.email), new RequestPasswordResetCallback(){
			@Override
			public void done(ParseException ex) {
				if(ex==null){
					ParseUser.logOut();
					setResult(RESULT_OK,new Intent()); 
					UserAccount.this.finish();
				}else{
					switch(ex.getCode()){
					case ParseException.EMAIL_MISSING:
					case ParseException.EMAIL_NOT_FOUND:
					default:
						msg(ex.getMessage());
						break;
					}
				}
			}
			
		});
	}

	protected void msg(CharSequence m){
		Toast.makeText(this, m, Toast.LENGTH_SHORT).show();
	}
	
	protected String getEditText(int rid){
		return ((EditText)segments.getSegmentedBar().getChildSegmentAt(focusSegment).findViewById(rid)).getText().toString();
	}
}
