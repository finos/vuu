package org.finos.vuu.feature.ignite

case class TestOrderEntity(
                      parentId: Int,
                      id: Int,
                      ric: String,
                      price: Double,
                      quantity: Int){

}

object TestOrderEntity{
  def createFrom(cols: java.util.List[_]): TestOrderEntity = {
    TestOrderEntity(
      parentId = cols.get(0).asInstanceOf[Int],
      id = cols.get(1).asInstanceOf[Int],
      ric = cols.get(2).asInstanceOf[String],
      price = cols.get(3).asInstanceOf[Double],
      quantity = cols.get(4).asInstanceOf[Int],
    )
  }
}
