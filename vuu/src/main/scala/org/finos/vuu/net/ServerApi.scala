package org.finos.vuu.net

trait ServerApi {
  def process(msg: RemoveViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: DisableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: EnableViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: FreezeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: UnfreezeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ChangeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: CreateViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ChangeViewPortRange)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: OpenTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: CloseTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: GetTableList)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: GetTableMetaRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: GetViewPortMenusRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: HeartBeatResponse)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: RpcUpdate)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: SetSelectionRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: GetViewPortVisualLinksRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: CreateVisualLinkRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: RemoveVisualLinkRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortMenuCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortMenuRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortMenuTableRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortMenuSelectionRpcCall)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: ViewPortRpcCall)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: ViewPortEditCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortEditRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortEditSubmitFormRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortDeleteCellRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortDeleteRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: ViewPortAddRowRpcCall)(ctx: RequestContext): Option[ViewServerMessage]

  def process(msg: RpcRequest)(ctx: RequestContext): Option[ViewServerMessage]

  def disconnect(session: ClientSessionId): Unit
}
