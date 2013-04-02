package com.yy.photo;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;


public class Jpeg {
	public static final int M_SOI = 216;
	public static final int M_EOI = 217;
	public static final int M_SOS = 218;
	public static final int M_APP1 = 225;
	public static final int M_EXIF = M_APP1;
	
	public static final String EXIF_TAKEN="Taken";
	public static final String EXIF_CAMERA_MODEL="Camera";
	

	public static final int M_MAX_COM_LENGTH = 65500;
	
	private InputStream in;
	private Exif exif;

	public Jpeg(InputStream in) {
		this.in = in;
	}
	
	public Jpeg(byte[] data){
		this.in=new ByteArrayInputStream(data);
	}

	private int firstMarker() throws Exception{
		int c1, c2;
		c1 = in.read();
		c2 = in.read();
		if (c1 != 0xFF || c2 != M_SOI)
			throw new Exception("Not a JPEG file");
		return c2;
	}

	private int nextMarker() throws IOException {
		int c = in.read();
		while (c != 0xFF)
			c = in.read();
		do {
			c = in.read();
		} while (c == 0xFF);

		return c;
	}

	private void skipVariable() throws Exception {
		long len = (long) read2bytes() - 2;
		if (len < 0)
			throw new Exception("Erroneous JPEG marker length");
		while (len > 0) {
			long saved = in.skip(len);
			if (saved < 0)
				throw new Exception("Error while reading jpeg stream");
			len -= saved;
		}
	}

	private byte[] readMarkerData() throws Exception {
		int length = read2bytes();
		if (length < 2)
			throw new Exception("Erroneous JPEG marker length");
		length -= 2;

		byte data[] = new byte[length];
		int got, pos;
		pos = 0;
		while (length > 0) {
			got = in.read(data, pos, length);
			if (got < 0)
				throw new Exception("EOF while reading jpeg comment");
			pos += got;
			length -= got;
		}
		return data;
	}

	private int read2bytes() throws Exception {
		int c1, c2;
		c1 = in.read();
		if (c1 == -1)
			throw new Exception("Premature EOF in JPEG file");
		c2 = in.read();
		if (c2 == -1)
			throw new Exception("Premature EOF in JPEG file");
		return (((int) c1) << 8) + ((int) c2);
	}

	private Exif getExif() throws Exception {
		if(exif!=null)
			return exif;
		int marker;
		if (firstMarker() != M_SOI)
			throw new Exception("Expected SOI marker first");

		while (true) {
			marker = nextMarker();
			switch (marker) {
			case M_SOS: /* stop before hitting compressed data */
			case M_EOI: /* in case it's a tables-only JPEG stream */
				return exif=new Exif();
			case M_EXIF:
				return exif=new Exif(readMarkerData());
			default:
				skipVariable();
				break;
			}
		}
	}
	
	public String getTag(String tag) throws Exception{
		return getExif().getTag(tag);
	}

}