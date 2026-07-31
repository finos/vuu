package org.finos.vuu.plugin.clickhouse.provider.filter

import com.typesafe.scalalogging.StrictLogging
import org.finos.vuu.core.filter.FilterSpecParser
import org.finos.vuu.net.FilterSpec
import org.finos.vuu.plugin.virtualized.api.VirtualizedSessionTableDef
import org.finos.vuu.viewport.ViewPort

import java.lang
import scala.util.control.NonFatal

object ClickHouseFilterFactory {
  private val ParseError = -1
  private val EmptyCondition = 0

  private val NoFilter = ""
  private val NoResults = "WHERE 1 = 0"

  private val WherePrefix = "WHERE "
  private val WherePrefixLen = WherePrefix.length

  private val CombinedPrefix = "WHERE ("
  private val CombinedSeparator = ") AND ("
  private val CombinedSuffix = ")"

  private val CombinedFramingLen = CombinedPrefix.length + CombinedSeparator.length + CombinedSuffix.length
}

class ClickHouseFilterFactory(tableDef: VirtualizedSessionTableDef) extends StrictLogging {
  import ClickHouseFilterFactory.*

  private val remoteMapping: Map[String, String] = tableDef
    .getRemoteColumns.map(f => f.name -> f.remoteName)
    .toMap

  def build(viewPort: ViewPort): String = {
    val filterSpec = viewPort.filterSpec
    val userBuf = new StringBuilder()
    val userLen = parseToBuffer(filterSpec, userBuf)
    if (userLen == ParseError) return NoResults

    val permissionSpec = tableDef.getRemotePermissionFilterSpecFunction.apply(viewPort)
    val permBuf = new StringBuilder()
    val permLen = parseToBuffer(permissionSpec, permBuf)
    if (permLen == ParseError) return NoResults

    if (userLen == EmptyCondition && permLen == EmptyCondition) {
      NoFilter
    } else if (userLen > EmptyCondition && permLen == EmptyCondition) {
      val sb = new StringBuilder(WherePrefixLen + userLen)
      sb.append(WherePrefix).append(userBuf).toString
    } else if (userLen == EmptyCondition && permLen > EmptyCondition) {
      val sb = new StringBuilder(WherePrefixLen + permLen)
      sb.append(WherePrefix).append(permBuf).toString
    } else {
      val totalCapacity = CombinedFramingLen + userLen + permLen
      val sb = new StringBuilder(totalCapacity)
      sb.append(CombinedPrefix)
        .append(userBuf)
        .append(CombinedSeparator)
        .append(permBuf)
        .append(CombinedSuffix)
        .toString
    }
  }

  private def parseToBuffer(spec: FilterSpec, target: StringBuilder): Int = {
    if (spec == null || spec.filter == null || isBlank(spec.filter)) return EmptyCondition

    val filterVisitor = new ClickHouseFilterVisitor(remoteMapping)
    try {
      FilterSpecParser.parse(spec.filter, filterVisitor)
      val parsedBuf = filterVisitor.getBuffer

      if (parsedBuf == null || parsedBuf.length == 0) {
        EmptyCondition
      } else {
        target.append(parsedBuf)
        target.length
      }
    } catch {
      case NonFatal(err) =>
        logger.error(s"Could not parse filter ${spec.filter}", err)
        ParseError
    }
  }

  private def isBlank(s: String): Boolean = {
    var i = 0
    val len = s.length
    while (i < len) {
      if (!Character.isWhitespace(s.charAt(i))) return false
      i += 1
    }
    true
  }
}
