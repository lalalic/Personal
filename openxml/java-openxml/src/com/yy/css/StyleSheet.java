package com.yy.css;

import org.w3c.dom.DOMException;
import org.w3c.dom.Document;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.UserDataHandler;
import org.w3c.dom.css.CSSRule;
import org.w3c.dom.css.CSSRuleList;
import org.w3c.dom.css.CSSStyleSheet;
import org.w3c.dom.stylesheets.MediaList;

public class StyleSheet extends NodeAdapter implements CSSStyleSheet {
	private RuleList rules=new RuleList();
	@Override
	public boolean getDisabled() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String getHref() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public MediaList getMedia() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node getOwnerNode() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public org.w3c.dom.stylesheets.StyleSheet getParentStyleSheet() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getTitle() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getType() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void setDisabled(boolean flag) {
		// TODO Auto-generated method stub

	}

	@Override
	public void deleteRule(int i) throws DOMException {
		rules.remove(i);
	}

	@Override
	public CSSRuleList getCssRules() {
		return rules;
	}

	@Override
	public CSSRule getOwnerRule() {
		return null;
	}

	@Override
	public int insertRule(String s, int i) throws DOMException {
		return 0;
	}
	
	@Override
	public String toString(){
		StringBuilder builder=new StringBuilder();
		for(CSSRule r: rules)
			builder.append(r.getCssText()).append("\r\n");
		return builder.toString();
	}

	
	
}

class NodeAdapter implements Node{

	@Override
	public String getNodeName() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getNodeValue() throws DOMException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void setNodeValue(String s) throws DOMException {
		// TODO Auto-generated method stub
		
	}

	@Override
	public short getNodeType() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public Node getParentNode() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public NodeList getChildNodes() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node getFirstChild() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node getLastChild() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node getPreviousSibling() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node getNextSibling() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public NamedNodeMap getAttributes() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Document getOwnerDocument() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node insertBefore(Node node, Node node1) throws DOMException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node replaceChild(Node node, Node node1) throws DOMException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node removeChild(Node node) throws DOMException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Node appendChild(Node node) throws DOMException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean hasChildNodes() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public Node cloneNode(boolean flag) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void normalize() {
		// TODO Auto-generated method stub
		
	}

	@Override
	public boolean isSupported(String s, String s1) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String getNamespaceURI() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getPrefix() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void setPrefix(String s) throws DOMException {
		// TODO Auto-generated method stub
		
	}

	@Override
	public String getLocalName() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean hasAttributes() {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String getBaseURI() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public short compareDocumentPosition(Node node) throws DOMException {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public String getTextContent() throws DOMException {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void setTextContent(String s) throws DOMException {
		// TODO Auto-generated method stub
		
	}

	@Override
	public boolean isSameNode(Node node) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String lookupPrefix(String s) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean isDefaultNamespace(String s) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String lookupNamespaceURI(String s) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean isEqualNode(Node node) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public Object getFeature(String s, String s1) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Object setUserData(String s, Object obj,
			UserDataHandler userdatahandler) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Object getUserData(String s) {
		// TODO Auto-generated method stub
		return null;
	}
	
}
