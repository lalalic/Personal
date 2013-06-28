package com.supernaiba.ui;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;

import com.supernaiba.R;

public class UserAccount extends Activity {
	public enum Type {
		Signin, Signup, ForgetPassword
	}

	private Type type = Type.Signin;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		String theType = this.getIntent().getStringExtra("type");
		if (theType != null)
			type = Type.valueOf(theType);

		switch (type) {
		case Signin:
			this.setContentView(R.layout.signin);
			break;
		case Signup:
			this.setContentView(R.layout.signup);
			break;
		case ForgetPassword:
			this.setContentView(R.layout.forget_password);
			break;
		}
	}

	public void signin(View view) {
		
	}

	public void signup(View view) {

	}

	public void forgetPassword(View view) {
		
	}

	public void switch2Signin(View view) {
		this.setContentView(R.layout.signin);
	}

	public void switch2Signup(View view) {
		this.setContentView(R.layout.signup);
	}

	public void switch2ForgetPassword(View view) {
		this.setContentView(R.layout.forget_password);
	}

}
