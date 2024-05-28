package org.finos.vuu.util.types

object TypeUtils {
  def toWrapperType(t: Class[_]): Class[_] = if (t.isPrimitive) primitiveToWrapperType(t) else t

  private val primitiveToWrapperType: Map[Class[_], Class[_]] = Map(
    classOf[Boolean] -> classOf[java.lang.Boolean],
    classOf[Char]    -> classOf[java.lang.Character],
    classOf[Byte]    -> classOf[java.lang.Byte],
    classOf[Short]   -> classOf[java.lang.Short],
    classOf[Int]     -> classOf[java.lang.Integer],
    classOf[Long]    -> classOf[java.lang.Long],
    classOf[Float]   -> classOf[java.lang.Float],
    classOf[Double]  -> classOf[java.lang.Double],
  )

  def areTypesEqual(fromClass: Class[_], toClass: Class[_]): Boolean = {
    toWrapperType(fromClass).equals(toWrapperType(toClass))
  }

}
