package org.finos.vuu.example.ignite.utils

object getListToObjectConverter {
  def apply[ReturnType](obj: Object): List[_] => ReturnType = {
    val converter = obj.getClass.getMethods.find(x => x.getName == "apply" && x.isBridge).get
    values => converter.invoke(obj, values.map(_.asInstanceOf[AnyRef]): _*).asInstanceOf[ReturnType]
  }
}