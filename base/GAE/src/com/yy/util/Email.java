package com.yy.util;

import java.util.Properties;

import javax.mail.Message;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import com.yy.app.site.Profile;

public class Email {
	public static void send(String to, String subject, String body){
		send(Profile.I.getAdmin().email,to,subject,body);
	}
	public static void send(String from, String to, String subject, String body){
		Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        try {
            Message msg = new MimeMessage(session);
            msg.setFrom(new InternetAddress(from));
            msg.addRecipient(Message.RecipientType.TO,new InternetAddress(to));
            msg.setSubject(subject);
            msg.setText(body);
            Transport.send(msg);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
	}
}
