package org.finos.vuu.util

import java.nio.charset.StandardCharsets.UTF_8
import java.util.Base64
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import scala.util.Try
import scala.util.Success
import scala.util.Failure

object HMACUtils {

  private final val ALGORITHM = "HmacSHA512"

  def sign(data: String, secret: Array[Byte]): String = {
    val signature = getSignature(data, secret)
    val base64Data = Base64.getUrlEncoder.withoutPadding.encodeToString(data.getBytes(UTF_8))
    s"$base64Data.$signature"
  }

  def verifyAndRemoveSignature(signed: String, secret: Array[Byte]): Either[String, String] = {
    val parts = signed.split("\\.")
    if (parts.length != 2)
      return Left("Invalid number of parts")

    val data = safeDecodeBase64(parts(0)) match  {
      case Success(value) => value
      case Failure(_) => return Left("Invalid data input")
    }
    val receivedSig = parts(1)

    val encodedExpectedSig = getSignature(data, secret)
    if (encodedExpectedSig != receivedSig)
      return Left("Invalid signature")

    Right(data)
  }

  private def safeDecodeBase64(input: String): Try[String] = {
    Try {
      String(Base64.getUrlDecoder.decode(input), UTF_8)
    }
  }

  private def getSignature(data: String, secret: Array[Byte]): String = {
    val mac = Mac.getInstance(ALGORITHM)
    mac.init(SecretKeySpec(secret, ALGORITHM))
    val raw = mac.doFinal(data.getBytes(UTF_8))
    Base64.getUrlEncoder.withoutPadding.encodeToString(raw)
  }

}
