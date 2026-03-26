package org.finos.vuu.net.rest

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.module.scala.ClassTagExtensions
import org.finos.toolbox.json.JsonUtil

import java.io.InputStream
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

  private val classRegistry = new ConcurrentHashMap[Class[_], EntityEncoder[_]]()
  private val typeRegistry = new ConcurrentHashMap[TypeReference[_], EntityEncoder[_]]()
  private val mapper = JsonUtil.createMapper()
  
  def forClass[T](clazz: Class[T]): EntityEncoder[T] = {
    val encoder = classRegistry.computeIfAbsent(clazz, (c: Class[_]) => {
      new JsonEntityEncoder[T](is => mapper.readValue(is, clazz))
    })
    encoder.asInstanceOf[EntityEncoder[T]]
  }

  def forType[T](reference: TypeReference[T]): EntityEncoder[T] = {
    val encoder = typeRegistry.computeIfAbsent(reference, (c: TypeReference[_]) => {
      new JsonEntityEncoder[T](is => mapper.readValue(is, reference))
    })
    encoder.asInstanceOf[EntityEncoder[T]]
  }

}

private case class JsonEntityEncoder[T](decodeFunc: InputStream => T) extends EntityEncoder[T] {

  private val mapper = JsonUtil.createMapper()

  override def encode(value: T): Array[Byte] = {
    if (value == null) {
      Array.emptyByteArray
    } else {
      mapper.writeValueAsBytes(value)
    }
  }

  override def decode(is: InputStream): T = {
    try {
      decodeFunc.apply(is)
    } finally {
      if (is != null) is.close()
    }
  }

  override def contentType: String = "application/json"
}
