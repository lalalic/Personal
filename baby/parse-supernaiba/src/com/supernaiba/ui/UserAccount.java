package com.supernaiba.ui;

import greendroid.app.GDActivity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

import com.parse.LogInCallback;
import com.parse.ParseException;
import com.parse.ParseUser;
import com.parse.RequestPasswordResetCallback;
import com.parse.SignUpCallback;
import com.supernaiba.R;

public class UserAccount extends GDActivity {
	public enum Type {
		Signin, Signup, ForgetPassword 
	}

	private Type type = Type.Signin;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.setTitle(R.string.app_name);		

		String theType = this.getIntent().getStringExtra("type");
		if (theType != null)
			type = Type.valueOf(theType);

		switch (type) {
		case Signin:
			this.setActionBarContentView(R.layout.signin);
			break;
		case Signup:
			this.setActionBarContentView(R.layout.signup);
			break;
		case ForgetPassword:
			this.setActionBarContentView(R.layout.forget_password);
			break;
		}
	}

	public void signin(View view) {
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

	public void signup(View view) {
		String username=this.getEditText(R.id.account);
		String password=this.getEditText(R.id.password);
		String passwordAgain=this.getEditText(R.id.passwordAgain);
		if(password.equals(passwordAgain))
			;
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

	public void forgetPassword(View view) {
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

	public void switch2Signin(View view) {
		this.setActionBarContentView(R.layout.signin);
	}

	public void switch2Signup(View view) {
		this.setActionBarContentView(R.layout.signup);
	}

	public void switch2ForgetPassword(View view) {
		this.setActionBarContentView(R.layout.forget_password);
	}

	protected void msg(CharSequence m){
		Toast.makeText(this, m, Toast.LENGTH_SHORT).show();
	}
	
	protected String getEditText(int rid){
		return ((EditText)this.findViewById(rid)).getText().toString();
	}
}
