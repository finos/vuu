package org.finos.vuu.net.rest

import org.finos.toolbox.json.JsonUtil

trait JacksonSupport {

  // We use a single, pre-configured ObjectMapper for efficiency
  private val mapper = JsonUtil.createMapper()

  // --- Implicit Encoder ---
  // This tells Scala: "If you need an EntityEncoder[T], I can make one using Jackson"
  implicit def jacksonEncoder[T]: EntityEncoder[T] = new EntityEncoder[T] {
    override def encode(value: T): Array[Byte] = {
      if (value == null) Array.emptyByteArray
      else mapper.writeValueAsBytes(value)
    }
    override def contentType: String = "application/json"
  }

  // --- Implicit Decoder ---
  // This allows 'bodyAs[T]' to work for any type T
  implicit def jacksonDecoder[T](implicit m: Manifest[T]): EntityDecoder[T] = new EntityDecoder[T] {
    override def decode(is: java.io.InputStream): T = {
      // Jackson needs a bit of help with Scala types via Manifest or TypeReference
      mapper.readValue(is, m.runtimeClass).asInstanceOf[T]
    }
  }
}
