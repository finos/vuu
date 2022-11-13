package org.finos.toolbox.text

object CodeGenUtil {

  private def valToString(a: Any): String = {
    a match {
      case x: String => "\""+ x + "\""
      case x: Long => x.toString + "l"
      case x: Double => x.toString + "d"
      case null => "null"
      case x => x.toString
    }
  }

  def mapToString(map:Map[String,Any]): String = {
    val entries = map.map({case(key, value) =>
      "\"" + key + "\" -> " + valToString(value)
    }).mkString(",")

    s"Map($entries)"
  }

}
