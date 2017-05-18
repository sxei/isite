<%@page import="com.lutongnet.base.util.JsonUtil"%>
<%@page import="java.util.Map"%>
<%@page import="com.lutongnet.base.util.UploadUtil"%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
	UploadUtil util = new UploadUtil(request, response);
	util.setCrossDomain(true);
	util.setRootType(UploadUtil.RootType.SERVLET_ROOT.value);
	util.setSavePath("upload");
	util.upload();
%>
