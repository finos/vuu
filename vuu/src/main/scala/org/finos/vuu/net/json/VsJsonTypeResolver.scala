package org.finos.vuu.net.json

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeInfo.Id
import tools.jackson.databind.jsontype.impl.TypeIdResolverBase
import tools.jackson.databind.{DatabindContext, JavaType}

import java.util.concurrent.ConcurrentHashMap

object VsJsonTypeResolverRegistry {
  private val idToClass = new ConcurrentHashMap[String, Class[_]]()
  private val classToId = new ConcurrentHashMap[Class[_], String]()
  private val assignableCache = new ConcurrentHashMap[Class[_], String]()
  private val noMatchSentinel = "\u0000"

  def register(id: String, clazz: Class[_]): Unit = {
    idToClass.putIfAbsent(id, clazz)
    classToId.putIfAbsent(clazz, id)
  }

  def get(id: String): Class[_] = idToClass.get(id)

  def getId(clazz: Class[_]): String = {
    val exact = classToId.get(clazz)
    if (exact != null) return exact

    val cached = assignableCache.get(clazz)
    if (cached != null) {
      return if (cached eq noMatchSentinel) null else cached
    }

    val it = classToId.entrySet().iterator()
    while (it.hasNext) {
      val entry = it.next()
      val registeredClass = entry.getKey
      if (registeredClass.isAssignableFrom(clazz)) {
        val id = entry.getValue
        assignableCache.put(clazz, id)
        return id
      }
    }

    assignableCache.put(clazz, noMatchSentinel)
    null
  }
}

class VsJsonTypeResolver extends TypeIdResolverBase {

  override def typeFromId(context: DatabindContext, id: String): JavaType = {
    val clazz = VsJsonTypeResolverRegistry.get(id)
    if (clazz == null) {
      throw new IllegalArgumentException(s"Unknown type id: $id")
    }
    context.constructType(clazz)
  }

  override def idFromValue(ctxt: DatabindContext, value: Any): String = {
    val id = VsJsonTypeResolverRegistry.getId(value.getClass)
    if (id == null) {
      throw new IllegalArgumentException(s"No type id registered for class: ${value.getClass.getName}")
    }
    id
  }

  override def idFromValueAndType(ctxt: DatabindContext, value: Any, suggestedType: Class[_]): String =
    idFromValue(ctxt, value)

  override def getMechanism: Id = JsonTypeInfo.Id.CUSTOM
}
