package org.finos.vuu.net.rpc

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo.Id
import com.fasterxml.jackson.databind.`type`.TypeFactory
import com.fasterxml.jackson.databind.jsontype.TypeIdResolver
import com.fasterxml.jackson.databind.{DatabindContext, JavaType}
import com.typesafe.scalalogging.StrictLogging

import java.util.concurrent.ConcurrentHashMap
import scala.jdk.CollectionConverters._

class VsJsonTypeResolver extends TypeIdResolver with StrictLogging {

  var mBaseType: JavaType = _


  override def getDescForKnownTypeIds: String = {
    ""
  }

  def typeFromId(id: String): JavaType = {
    logger.debug(s"typeFromId ${id}")

    val clazz = JsonSubTypeRegistry.getClassForType(mBaseType.getRawClass, id)

    TypeFactory.defaultInstance().constructSpecializedType(mBaseType, clazz);
  }

  override def typeFromId(context: DatabindContext, id: String): JavaType = {
    logger.debug(s"typeFromId ${context} ${id}")
    typeFromId(id)
  }

  override def init(baseType: JavaType): Unit = {
    mBaseType = baseType
  }

  override def idFromValue(value: scala.Any): String = {
    logger.debug(s"idFromValue $value")
    idFromValueAndType(value, value.getClass)
  }

  override def getMechanism: Id = Id.NAME

  override def idFromBaseType(): String = {
    logger.debug("idFromBaseType")
    idFromValueAndType(null, mBaseType.getRawClass())
  }

  override def idFromValueAndType(value: scala.Any, suggestedType: Class[_]): String = {
    JsonSubTypeRegistry.getTypeForClass(mBaseType.getRawClass, suggestedType)
  }
}

object JsonSubTypeRegistry extends StrictLogging {

  private val genericsToConcreteTypes = new ConcurrentHashMap[Class[_], ConcurrentHashMap[String, Class[_]]]()

  def register(genericType: Class[_], mixinWithAnnotations: Class[_]): Unit = {

    if (!genericsToConcreteTypes.containsKey(genericType))
      genericsToConcreteTypes.put(genericType, new ConcurrentHashMap[String, Class[_]]())

    val subtypes = mixinWithAnnotations.getAnnotation(classOf[JsonSubTypes])

    subtypes.value().foreach(subType => {

      if (genericsToConcreteTypes.get(genericType).containsKey(subType.name()))
        logger.warn(s"Tried to register ${subType.name()} mapping to ${subType.value()} but already registered to ${genericsToConcreteTypes.get(genericType).get(subType.name())}")
      else
        genericsToConcreteTypes.get(genericType).put(subType.name(), subType.value())
    })

  }

  def getTypeForClass(genericType: Class[_], specificType: Class[_]): String = {

    if (genericsToConcreteTypes.get(genericType).containsValue(specificType)) {

      val entrySet = SetHasAsScala(genericsToConcreteTypes.get(genericType).entrySet()).asScala

      entrySet.find(entry => entry.getValue.equals(specificType)) match {
        case Some(theMatch) =>
          theMatch.getKey
        case None =>
          throw new Exception(s"no mapping found for ${specificType} to generic ${genericType}")
      }

    } else {
      throw new Exception(s"no mapping registered for ${genericType}")
    }

  }

  def getClassForType(genericType: Class[_], typeStr: String): Class[_] = {

    if (genericsToConcreteTypes.get(genericType).containsKey(typeStr)) {

      SetHasAsScala(genericsToConcreteTypes.get(genericType).entrySet()).asScala.find(entry => entry.getKey.equals(typeStr)) match {
        case Some(theMatch) => theMatch.getValue
        case None =>
          throw new Exception(s"no mapping found for ${typeStr} to generic ${genericType}")
      }

    } else {
      throw new Exception(s"no mapping registered for ${genericType}")
    }

  }

}
