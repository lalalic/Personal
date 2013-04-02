package com.yy.util;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;

public class CellLocation {
	private static final String CONNECTION_MODE = "Web";
	private static final String VERSION = "1.0";
	private static final String DEVICE = "Android";
	private static final String COUNTRY = "zh";
	private final static String URL_SERVICE = "http://www.google.com/glm/mmap";

	public static float[] convertCell2Latlng(int lac, int cellID)
			throws Exception {
		// ---open a connection to Google Maps API---
		URL url = new URL(URL_SERVICE);
		URLConnection conn = url.openConnection();
		HttpURLConnection httpConn = (HttpURLConnection) conn;

		httpConn.setRequestMethod("POST");
		httpConn.setDoOutput(true);
		httpConn.setDoInput(true);
		httpConn.connect();

		// ---write some custom data to Google Maps API---
		OutputStream outputStream = httpConn.getOutputStream();
		WriteData(outputStream, cellID, lac);

		// ---get the response---
		InputStream inputStream = httpConn.getInputStream();
		DataInputStream dataInputStream = new DataInputStream(inputStream);

		// ---interpret the response obtained---
		dataInputStream.readShort();
		dataInputStream.readByte();
		int code = dataInputStream.readInt();
		float lat = 31;
		float lng = 32;
		if (code == 0) {
			lat = (float) dataInputStream.readInt() / 1000000f;
			lng = (float) dataInputStream.readInt() / 1000000f;
			dataInputStream.readInt();
			dataInputStream.readInt();
			dataInputStream.readUTF();
		}
		httpConn.disconnect();
		if(code!=0)
			throw new Exception();
		return new float[] { lat, lng };
	}

	private static void WriteData(OutputStream out, int cellID, int lac)
			throws IOException {
		DataOutputStream dataOutputStream = new DataOutputStream(out);
		dataOutputStream.writeShort(21);
		dataOutputStream.writeLong(0);
		dataOutputStream.writeUTF(COUNTRY);
		dataOutputStream.writeUTF(DEVICE);
		dataOutputStream.writeUTF(VERSION);
		dataOutputStream.writeUTF(CONNECTION_MODE);
		dataOutputStream.writeByte(27);
		dataOutputStream.writeInt(0);
		dataOutputStream.writeInt(0);
		dataOutputStream.writeInt(3);
		dataOutputStream.writeUTF("");

		dataOutputStream.writeInt(cellID);
		dataOutputStream.writeInt(lac);

		dataOutputStream.writeInt(0);
		dataOutputStream.writeInt(0);
		dataOutputStream.writeInt(0);
		dataOutputStream.writeInt(0);
		dataOutputStream.flush();
	}

}
