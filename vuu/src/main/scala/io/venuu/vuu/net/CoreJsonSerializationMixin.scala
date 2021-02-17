/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 15/02/2016.

  */
package io.venuu.vuu.net

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

/**
  * Mixing represents the mapping for all core functionality in VS.
  */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes(Array(
  new Type(value = classOf[AuthenticateRequest], name = "AUTH"),
  new Type(value = classOf[CreateViewPortRequest], name = "CREATE_VP"),
  new Type(value = classOf[CreateViewPortSuccess], name = "CREATE_VP_SUCCESS"),
  new Type(value = classOf[CreateViewPortReject], name = "CREATE_VP_REJECT"),
  new Type(value = classOf[ChangeViewPortRange], name = "CHANGE_VP_RANGE"),
  new Type(value = classOf[ChangeViewPortRangeSuccess], name = "CHANGE_VP_RANGE_SUCCESS"),
  new Type(value = classOf[ChangeViewPortRequest], name = "CHANGE_VP"),
  new Type(value = classOf[ChangeViewPortSuccess], name = "CHANGE_VP_SUCCESS"),
  new Type(value = classOf[ChangeViewPortReject], name = "CHANGE_VP_REJECT"),
  new Type(value = classOf[AuthenticateSuccess], name = "AUTH_SUCCESS"),
  new Type(value = classOf[AuthenticateFailure], name = "AUTH_FAIL"),
  new Type(value = classOf[LoginRequest], name = "LOGIN"),
  new Type(value = classOf[LoginSuccess], name = "LOGIN_SUCCESS"),
  new Type(value = classOf[LoginFailure], name = "LOGIN_FAIL"),
  new Type(value = classOf[TableRowUpdates], name = "TABLE_ROW"),
  new Type(value = classOf[OpenTreeNodeRequest], name = "OPEN_TREE_NODE"),
  new Type(value = classOf[CloseTreeNodeRequest], name = "CLOSE_TREE_NODE"),
  new Type(value = classOf[GetTableMetaRequest], name = "GET_TABLE_META"),
  new Type(value = classOf[GetTableMetaResponse], name = "TABLE_META_RESP"),
  new Type(value = classOf[GetTableList], name = "GET_TABLE_LIST"),
  new Type(value = classOf[GetTableListResponse], name = "TABLE_LIST_RESP"),
  new Type(value = classOf[HeartBeat], name = "HB"),
  new Type(value = classOf[RpcUpdate], name = "RPC_UP"),
  new Type(value = classOf[RpcSuccess], name = "RPC_SUCCESS"),
  new Type(value = classOf[RpcReject], name = "RPC_REJECT"),
  new Type(value = classOf[HeartBeatResponse], name = "HB_RESP"),
  new Type(value = classOf[RpcCall], name = "RPC_CALL"),
  new Type(value = classOf[RpcResponse], name = "RPC_RESP"),
  new Type(value = classOf[OpenTreeNodeSuccess], name = "OPEN_TREE_SUCCESS"),
  new Type(value = classOf[OpenTreeNodeReject], name = "OPEN_TREE_REJECT"),
  new Type(value = classOf[CloseTreeNodeSuccess], name = "CLOSE_TREE_SUCCESS"),
  new Type(value = classOf[CloseTreeNodeReject], name = "CLOSE_TREE_REJECT"),
  new Type(value = classOf[SetSelectionRequest], name = "SET_SELECTION"),
  new Type(value = classOf[SetSelectionSuccess], name = "SET_SELECTION_SUCCESS"),
  new Type(value = classOf[ErrorResponse], name = "ERROR"),
  new Type(value = classOf[GetViewPortVisualLinksRequest], name = "GET_VP_VISUAL_LINKS"),
  new Type(value = classOf[GetViewPortVisualLinksResponse], name = "VP_VISUAL_LINKS_RESP"),
  new Type(value = classOf[CreateVisualLinkRequest], name = "CREATE_VISUAL_LINK"),
  new Type(value = classOf[CreateVisualLinkSuccess], name = "CREATE_VISUAL_LINK_SUCCESS"),
))
trait CoreJsonSerializationMixin {}
