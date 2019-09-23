/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.
  *
  * Created by chris on 18/10/2016.
  *
  */
package io.venuu.vuu.client.headless

import io.venuu.toolbox.time.TimeProvider
import io.venuu.vuu.client.swing.messages.RequestId
import io.venuu.vuu.net.{FilterSpec, SortDef, SortSpec, ViewServerClient}
import io.venuu.vuu.viewport.{DefaultRange, ViewPortRange}

import scala.reflect.ClassTag
import scala.reflect.runtime.universe.TypeTag

case class CreateViewPortRequestBlock(ctx: HeadlessContext,
                                      table: String,
                                      headless: HeadlessClient,
                                      private val columns: Array[String] = Array(),
                                      private val sort: SortSpec = SortSpec(List()),
                                      private val range: ViewPortRange = DefaultRange,
                                      private val groupBy: Array[String] = Array(),
                                      private val filter: FilterSpec = FilterSpec("")
                                     )(implicit val vsClient: ViewServerClient, time: TimeProvider){
  import io.venuu.vuu.client.ClientHelperFns._


  def withColumns(columns: String*): CreateViewPortRequestBlock = this.copy(columns = columns.toArray)
  def withSort(spec: SortSpec) : CreateViewPortRequestBlock = this.copy(sort = spec)
  def withSort(column: String, direction: Char) : CreateViewPortRequestBlock = this.copy(sort = SortSpec(this.sort.sortDefs ++ List(SortDef(column, direction))))
  def withGroupBy(groupBy: String) : CreateViewPortRequestBlock = this.copy(groupBy = this.groupBy ++ Array(groupBy))
  def withRange(range: Range) : CreateViewPortRequestBlock = this.copy(range = ViewPortRange(range.start, range.end))
  def go(): CreateViewPortRequestBlock = {
    createVpAsync(ctx.sessionId, ctx.token, ctx.user, RequestId.oneNew(), this.table, this.columns, this.sort, this.groupBy, this.range, this.filter)
    this
  }



  def expect[T : TypeTag]: T = {
    headless.await[T].body.asInstanceOf[T]
  }

  def expectOr[T : TypeTag, O : TypeTag](implicit t: ClassTag[T], o: ClassTag[O]): Either[T, O] = {
    val x = headless.awaitOr[T, O]

    if(x.getClass == t.getClass)
      Left(x.body.asInstanceOf[T])
    else
      Right(x.body.asInstanceOf[O])
  }
}

case class ChangeViewPortRangeRequestBlock(ctx: HeadlessContext,
                               vpId: String,
                               headless: HeadlessClient,
                               private val range: ViewPortRange = new ViewPortRange(1, 100)
                              )
                              (implicit val vsClient: ViewServerClient, time: TimeProvider){

  import io.venuu.vuu.client.ClientHelperFns.changeVpRangeAsync;

  def withRange(range: Range) : ChangeViewPortRangeRequestBlock = this.copy(range = ViewPortRange(range.start, range.end))
  def go(): ChangeViewPortRangeRequestBlock = {
    changeVpRangeAsync(ctx.sessionId, ctx.token, ctx.user, vpId, range)
    this
  }

  def expect[T : TypeTag](implicit t: ClassTag[T]): T = {
    headless.await[T].body.asInstanceOf[T]
  }

}

case class ChangeViewPortRequestBlock(ctx: HeadlessContext,
                                      vpId: String,
                                      headless: HeadlessClient,
                                      private val columns: Array[String] = Array(),
                                      private val sort: SortSpec = SortSpec(List()),
                                      private val range: ViewPortRange = DefaultRange,
                                      private val groupBy: Array[String] = Array(),
                                      private val filter: FilterSpec = FilterSpec("")
                                    )(implicit val vsClient: ViewServerClient, time: TimeProvider){
  import io.venuu.vuu.client.ClientHelperFns._


  def withColumns(columns: String*): ChangeViewPortRequestBlock = this.copy(columns = columns.toArray)
  def withSort(spec: SortSpec) : ChangeViewPortRequestBlock = this.copy(sort = spec)
  def withSort(column: String, direction: Char) : ChangeViewPortRequestBlock = this.copy(sort = SortSpec(this.sort.sortDefs ++ List(SortDef(column, direction))))
  def withGroupBy(groupBy: String) : ChangeViewPortRequestBlock = this.copy(groupBy = this.groupBy ++ Array(groupBy))
  def withRange(range: Range) : ChangeViewPortRequestBlock = this.copy(range = ViewPortRange(range.start, range.end))
  def go(): ChangeViewPortRequestBlock = {
    changeVpAsync(ctx.sessionId, ctx.token, ctx.user, RequestId.oneNew(), this.vpId, this.columns, this.sort, this.groupBy, this.filter)
    this
  }

  def expect[T <: AnyRef](implicit t: ClassTag[T]): T = {
    awaitMsgBody[T].get
  }
}
