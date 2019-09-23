package io.venuu.vuu.net

trait ServerApi{
  def process(msg: ChangeViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: CreateViewPortRequest)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: ChangeViewPortRange)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: OpenTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: CloseTreeNodeRequest)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: GetTableList)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: GetTableMetaRequest)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: HeartBeatResponse)(ctx: RequestContext): Option[ViewServerMessage]
  def process(msg: RpcUpdate)(ctx: RequestContext): Option[ViewServerMessage]
  def disconnect(session: ClientSessionId): Unit
}
