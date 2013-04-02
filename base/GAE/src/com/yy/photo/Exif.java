package com.yy.photo;

import java.util.Hashtable;

public class Exif {
	private static final int TAG_EXIF_OFFSET = 0x8769;
	private static final int TAG_INTEROP_OFFSET = 0xa005;

	private Hashtable<Integer, String> tags = new Hashtable<Integer, String>();
	private Hashtable<String, String> exif = new Hashtable<String, String>();
	private ExifData data = null;
	
	private int resolving;
	public Exif(){
		tags.put(0x9003, Jpeg.EXIF_TAKEN);
		tags.put(0x110, Jpeg.EXIF_CAMERA_MODEL);
		resolving=2;
	}
	
	public Exif(byte[] raw){
		this();
		parseExif(raw);
	}

	public void parseExif(byte[] exifData) {
		data = new ExifData(exifData);
		if (!data.isExifData()) {
			return;
		}

		int firstOffset = data.get32u(10);
		processExifDir(6 + firstOffset, 6);
	}

	public void addTag(int tag, String tagName) {
		tags.put(tag, tagName);
	}

	public String getTag(String key) {
		return exif.get(key);
	}

	protected void processExifDir(int dirStart, int offsetBase) {

		int numEntries = data.get16u(dirStart);

		for (int de = 0; de < numEntries; de++) {
			int dirOffset = dirStart + 2 + (12 * de);

			int tag = data.get16u(dirOffset);
			int format = data.get16u(dirOffset + 2);
			int components = data.get32u(dirOffset + 4);

			if (format < 0 || format > ExifData.NUM_FORMATS) {
				System.err.println("Bad number of formats in EXIF dir: "
						+ format);
				return;
			}

			int byteCount = components * ExifData.bytesPerFormat[format];
			int valueOffset = dirOffset + 8;

			if (byteCount > 4) {
				int offsetVal = data.get32u(dirOffset + 8);
				valueOffset = offsetBase + offsetVal;
			}

			if (tag == TAG_EXIF_OFFSET || tag == TAG_INTEROP_OFFSET) {
				int subdirOffset = data.get32u(valueOffset);
				processExifDir(offsetBase + subdirOffset, offsetBase);
			} else {
				if (tags.containsKey(tag)) {
					String result="";
					switch (format) {
					case ExifData.FMT_UNDEFINED:
						result=data.getUndefined(valueOffset, byteCount);
						break;
					case ExifData.FMT_STRING:
						result=data.getString(valueOffset, byteCount);
						break;
					case ExifData.FMT_SBYTE:
					case ExifData.FMT_BYTE:
					case ExifData.FMT_USHORT:
					case ExifData.FMT_SSHORT:
					case ExifData.FMT_ULONG:
					case ExifData.FMT_SLONG:
						result=""+(int) data.convertAnyValue(format, valueOffset);
						break;
					case ExifData.FMT_URATIONAL:
					case ExifData.FMT_SRATIONAL:
						result=getRational(valueOffset);
						break;
					}
					if(!result.isEmpty())
						this.exif.put(tags.get(tag), result);
					resolving--;//only resolve known tags
					if(resolving==0)
						return;
				}
			}
		}
	}

	protected String getRational(int offset) {
		int num = data.get32s(offset);
		int den = data.get32s(offset + 4);
		String result = "";

		if (num % 10 == 0 && den % 10 == 0) {
			num = num / 10;
			den = den / 10;
		}

		if (num % 5 == 0 && den % 5 == 0) {
			num = num / 5;
			den = den / 5;
		}

		if (num % 3 == 0 && den % 3 == 0) {
			num = num / 3;
			den = den / 3;
		}

		if (num % 2 == 0 && den % 2 == 0) {
			num = num / 2;
			den = den / 2;
		}

		if (den == 0) {
			result = "0";
		} else if (den == 1) {
			result = "" + num;
		} else {
			result = "" + num + "/" + den;
		}
		return "" + result;
	}
}
