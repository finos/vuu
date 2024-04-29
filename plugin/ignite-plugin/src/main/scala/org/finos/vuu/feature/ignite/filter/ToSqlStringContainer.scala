package org.finos.vuu.feature.ignite.filter

import org.finos.vuu.util.types.{TypeConverter, TypeConverterContainer, TypeConverterContainerBuilder}

trait ToSqlStringContainer {
  def toString[T](value: T, dataType: Class[T]): Option[String]
}

private class ToSqlStringContainerImpl(private val tcContainer: TypeConverterContainer) extends ToSqlStringContainer {
  override def toString[T](value: T, dataType: Class[T]): Option[String] =
    tcContainer.convert[T, String](value, dataType, classOf[String])
}

object ToSqlStringContainerBuilder {
  def apply(): ToSqlStringContainerBuilder =
    new ToSqlStringContainerBuilder(TypeConverterContainerBuilder().withoutDefaults())
}

case class ToSqlStringContainerBuilder private (tcContainerBuilder: TypeConverterContainerBuilder) {
  def withToString[T](fromClass: Class[T], converter: T => String): ToSqlStringContainerBuilder =
    this.copy(tcContainerBuilder.withConverter(TypeConverter[T, String](fromClass, classOf[String], converter)))

  def build(): ToSqlStringContainer = new ToSqlStringContainerImpl(tcContainerBuilder.build())
}
