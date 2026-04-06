package org.finos.vuu.net.rest

import tools.jackson.core.`type`.TypeReference
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.scala.DefaultScalaModule

import java.io.InputStream
import java.lang.reflect.Type
import java.nio.charset.StandardCharsets
import java.util.concurrent.ConcurrentHashMap
import scala.io.Source

trait EntityEncoder[T] {

  def encode(value: T): Array[Byte]

  def decode(is: java.io.InputStream): T

  def contentType: String

}

object StringEncoder extends EntityEncoder[String] {

  def encode(value: String): Array[Byte] = {
    if (value == null) Array.emptyByteArray
    else value.getBytes(StandardCharsets.UTF_8)
  }

  override def decode(is: InputStream): String = {
    try {
      Source.fromInputStream(is)(StandardCharsets.UTF_8).mkString
    } finally {
      if (is != null) is.close()
    }
  }

  override def contentType: String = "text/plain"
}

object EmptyEncoder extends EntityEncoder[Null] {

  override def encode(value: Null): Array[Byte] = Array.emptyByteArray

  override def decode(is: InputStream): Null = null

  override def contentType: String = "text/plain"
}

object JsonEntityEncoder {

  private val defaultMapper = JsonMapper.builder().addModule(DefaultScalaModule()).build()
  private val classRegistry = new ConcurrentHashMap[Class[_], EntityEncoder[_]]()
  private val typeRegistry = new ConcurrentHashMap[Type, EntityEncoder[_]]()
  
  def forClass[T](clazz: Class[T], mapper: JsonMapper = defaultMapper): EntityEncoder[T] = {
    val encoder = classRegistry.computeIfAbsent(clazz, (c: Class[_]) => {
      new JsonEntityEncoder[T](mapper, (mapper, is) => mapper.readValue(is, clazz))
    })
    encoder.asInstanceOf[EntityEncoder[T]]
  }
  
  def forType[T](reference: TypeReference[T], mapper: JsonMapper = defaultMapper): EntityEncoder[T] = {
    val encoder = typeRegistry.computeIfAbsent(reference.getType, (c: Type) => {
      new JsonEntityEncoder[T](mapper, (mapper, is) => mapper.readValue(is, reference))
    })
    encoder.asInstanceOf[EntityEncoder[T]]
  }

}

private case class JsonEntityEncoder[T](mapper: JsonMapper, decodeFunc: (JsonMapper, InputStream) => T) extends EntityEncoder[T] {

  override def encode(value: T): Array[Byte] = {
    if (value == null) {
      Array.emptyByteArray
    } else {
      mapper.writeValueAsBytes(value)
    }
  }

  override def decode(is: InputStream): T = {
    try {
      decodeFunc.apply(mapper, is)
    } finally {
      if (is != null) is.close()
    }
  }

  override def contentType: String = "application/json"
}
