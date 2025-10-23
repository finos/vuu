package org.finos.vuu.util

import java.nio.charset.StandardCharsets
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import scala.util.Try

object HMACUtils {

  private final val ALGORITHM = "HmacSHA512"

  def sign(data: String, secret: String): String = {    
    val signature = getSignature(data, secret)
    val base64Data = Base64.getUrlEncoder.withoutPadding.encodeToString(data.getBytes(StandardCharsets.UTF_8))
    s"$base64Data.$signature"
  }

  def verifyAndRemoveSignature(signed: String, secret: String): Either[String, String] = {
    val parts = signed.split("\\.")
    if (parts.length != 2) 
      return Left("Invalid number of parts")

    val data = new String(Base64.getUrlDecoder.decode(parts(0)), StandardCharsets.UTF_8)
    val receivedSig = parts(1)
    
    val encodedExpectedSig = getSignature(data, secret)
    if (encodedExpectedSig != receivedSig) 
      return Left("Invalid signature")
      
    Right(data)
  }

  private def getSignature(data: String, secret: String): String = {
    val mac = Mac.getInstance(ALGORITHM)
    mac.init(SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITHM))
    val raw = mac.doFinal(data.getBytes("UTF-8"))
    Base64.getUrlEncoder.withoutPadding.encodeToString(raw)
  }

}
