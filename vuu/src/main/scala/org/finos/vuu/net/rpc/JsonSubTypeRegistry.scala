package org.finos.vuu.net.rpc

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo.Id
import com.fasterxml.jackson.databind.`type`.TypeFactory
import com.fasterxml.jackson.databind.jsontype.TypeIdResolver
import com.fasterxml.jackson.databind.{DatabindContext, JavaType}
import com.typesafe.scalalogging.StrictLogging

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters.*

class VsJsonTypeResolver extends TypeIdResolver with StrictLogging {

  var mBaseType: JavaType = _


  override def getDescForKnownTypeIds: String = {
    ""
  }

  def typeFromId(id: String): JavaType = {
    logger.trace(s"typeFromId ${id}")

    val clazz = JsonSubTypeRegistry.getClassForType(mBaseType.getRawClass, id)

    TypeFactory.defaultInstance().constructSpecializedType(mBaseType, clazz);
  }

  override def typeFromId(context: DatabindContext, id: String): JavaType = {
    logger.trace(s"typeFromId ${context} ${id}")
    typeFromId(id)
  }

  override def init(baseType: JavaType): Unit = {
    mBaseType = baseType
  }

  override def idFromValue(value: scala.Any): String = {
    logger.trace(s"idFromValue $value")
    idFromValueAndType(value, value.getClass)
  }

  override def getMechanism: Id = Id.NAME

  override def idFromBaseType(): String = {
    logger.trace("idFromBaseType")
    idFromValueAndType(null, mBaseType.getRawClass())
  }

  override def idFromValueAndType(value: scala.Any, suggestedType: Class[_]): String = {
    JsonSubTypeRegistry.getTypeForClass(mBaseType.getRawClass, suggestedType)
  }
}

object JsonSubTypeRegistry extends StrictLogging {

  private val genericsToConcreteTypes: java.util.Map[Class[_], java.util.Map[String, Class[_]]] =
    new ConcurrentHashMap[Class[_], java.util.Map[String, Class[_]]]()

  def register(genericType: Class[_], mixinWithAnnotations: Class[_]): Unit = {

    genericsToConcreteTypes.computeIfAbsent(genericType, f => new ConcurrentHashMap[String, Class[_]]())

    val subtypes = mixinWithAnnotations.getAnnotation(classOf[JsonSubTypes])

    subtypes.value().foreach(subType => {

      val existing = genericsToConcreteTypes.get(genericType).putIfAbsent(subType.name(), subType.value())
      if (existing != null && existing != subType.value()) {
        logger.warn(s"Tried to register ${subType.name()} mapping to ${subType.value()} but already registered to $existing")
      }

    })

  }

  def getTypeForClass(genericType: Class[_], specificType: Class[_]): String = {

    val entrySet = SetHasAsScala(genericsToConcreteTypes.getOrDefault(genericType, java.util.Map.of()).entrySet()).asScala

    entrySet.find(entry => entry.getValue.equals(specificType)) match {
      case Some(theMatch) =>
        theMatch.getKey
      case None =>
        throw new Exception(s"no mapping found for ${specificType} to generic ${genericType}")
    }

  }

  def getClassForType(genericType: Class[_], typeStr: String): Class[_] = {

    val entrySet = SetHasAsScala(genericsToConcreteTypes.getOrDefault(genericType, java.util.Map.of()).entrySet()).asScala

    entrySet.find(entry => entry.getKey.equals(typeStr)) match {
      case Some(theMatch) => theMatch.getValue
      case None =>
        throw new Exception(s"no mapping found for ${typeStr} to generic ${genericType}")
    }

  }

}
