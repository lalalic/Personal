package com.supernaiba.entity;

import com.google.api.client.json.GenericJson;
import com.google.api.client.util.Key;
import com.kinvey.java.model.KinveyMetaData;


public class Entity extends GenericJson {
	@Key("_id")
	public String id;
	@Key("_kmd")
    public KinveyMetaData meta;
    @Key("_acl")
    public KinveyMetaData.AccessControlList acl;
}
