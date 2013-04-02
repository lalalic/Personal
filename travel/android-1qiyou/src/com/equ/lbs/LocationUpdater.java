package com.equ.lbs;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.BufferOverflowException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

import org.apache.http.HttpEntity;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.util.EntityUtils;

import android.os.Environment;

import com.equ.R;
import com.equ.service.Updater;
import com.yy.m.data.Configuration;
import com.yy.m.service.AService;

public class LocationUpdater extends Updater {
	private static final int BUFFER_SIZE = 1024;

	FileChannel out;
	private ByteBuffer buffer;
	private int counter = 0;
	private String lastLacCID;

	public LocationUpdater(AService service) {
		super(service);
	}

	public void add(Object location) {
		Configuration conf = Configuration.getInstance(service);
		if (conf.getInt("whentrack") == 1
				&& conf.get("vacationID").length() == 0)
			return;

		if (location == null)
			return;

		if (location.toString().equalsIgnoreCase(lastLacCID))
			return;

		lastLacCID = location.toString();

		if (lastLacCID.equalsIgnoreCase("[-1,-1]"))
			return;

		service.notify(counter + ":" + lastLacCID);
		save(lastLacCID);
	}

	private void save(String location) {
		try {
			if (buffer == null)
				buffer = ByteBuffer.allocate(BUFFER_SIZE);

			buffer.put((",[" + System.currentTimeMillis() + "," + location + "]")
					.getBytes());

			counter++;
			if (isUpdatable)
				flush();
		} catch (BufferOverflowException bofEx) {
			try {
				flush();
				save(location);
			} catch (Exception e) {
				service.notify(e.getMessage());
			}
		}
	}

	private void flush() {
		try {
			if (!Environment.MEDIA_MOUNTED.equals(Environment
					.getExternalStorageState())) {
				service.notify("External storage not ready");
				return;
			}

			if (out == null || !out.isOpen()) {
				File f = new File(Environment.getExternalStorageDirectory(),
						service.getString(R.string.DB));
				if (!f.exists()) {
					if (!f.getParentFile().exists())
						f.getParentFile().mkdirs();
					f.createNewFile();
				}
				out = new FileOutputStream(f, true).getChannel();
			}
			buffer.flip();
			out.write(buffer);
			buffer.clear();
			out.force(true);
			out.close();
			out = null;

			if (isUpdatable)
				upload();
		} catch (Exception e) {
			service.notify(e.getMessage());
		}
	}

	protected boolean doUpload() {
		Configuration conf = Configuration.getInstance(service);
		String vacationID = conf.get("vacationID");
		if (conf.getInt("whentrack") == 1 && vacationID.length() == 0)
			return false;

		File dbFile = new File(Environment.getExternalStorageDirectory(),
				service.getString(R.string.DB));
		if (!dbFile.exists() || dbFile.length() == 0) {
			service.notify("upload: no content");
			return false;
		}

		MultipartEntity data = new MultipartEntity();
		data.addPart("trackupload", new FileBody(dbFile,
				"text/plain; charset=\"UTF-8\""));
		String url = service.getString(R.string.url_home)
				+ service.getString(R.string.url_upload_track) + "/upload";

		boolean uploaded = false;
		try {
			HttpEntity entity = post(url, data);
			if (entity != null)
				uploaded = EntityUtils.toString(entity)
						.equalsIgnoreCase("true");

			if (uploaded) {
				dbFile.delete();
				service.notify("uploaded");
			}
		} catch (Exception e) {
			service.notify(e.getMessage());
		}
		return uploaded;

	}

	@Override
	public void release() {
		if (Environment.MEDIA_MOUNTED.equals(Environment
				.getExternalStorageState())) {
			try {
				flush();
				if (out != null && out.isOpen())
					out.close();
			} catch (IOException e) {
				service.notify(e.getMessage());
			}
		}

		service.notify("Stopped", true);
	}
}
