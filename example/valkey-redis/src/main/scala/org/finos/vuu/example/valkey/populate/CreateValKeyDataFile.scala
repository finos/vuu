package org.finos.vuu.example.valkey.populate

import java.io.File
import java.nio.file.{Files, Paths}
import java.nio.file.attribute.FileAttribute
import scala.util.Random


object CreateValKeyDataFile {

  private val RICS = Array("BT.L", "BP.L", "VOD.L", "LAND.L")

  private val SIDES = Array("B", "S", "SS")

  private val STRATEGIES = Array("BLK", "LIT", "VWAP")

  private val CURRENCY = Array("GBP", "EUR", "USD")


  def nextRic(): String = {
    val index = Random.between(0, RICS.length)
    RICS(index)
  }

  def nextSide(): String = {
    val index = Random.between(0, SIDES.length)
    SIDES(index)
  }

  def nextCCY(): String = {
    val index = Random.between(0, CURRENCY.length)
    CURRENCY(index)
  }

  def nextStrategy(): String = {
    val index = Random.between(0, STRATEGIES.length)
    STRATEGIES(index)
  }

  def nextQuantity(): Int = {
    Random.between(1, 100_000)
  }


  def nextPrice(): Double = {
    val intPrice = Random.between(1, 10000)
    val price: Double = intPrice >> 2
    price
  }

  def nextParentId(): Int = {
    Random.between(1, 100_000)
  }

  def main(args: Array[String]): Unit = {

    val MAX_LINES = 25_000_000 //this is a function of RAM, 25m on Macbook Pro m2 with 16Gb RAM is quite toppy
    val location = "./target/valkey-sample-data.txt"
    val file = new File(location)
    file.getParentFile.mkdir()
    file.delete()
    val success = file.createNewFile()
    var orderId = 0

    assert(success)

    import java.io.PrintWriter
    new PrintWriter(file) {

      (0 to MAX_LINES).foreach(i=> {

        val ric = nextRic()
        val qty = nextQuantity()
        val prc = nextPrice()
        val side = nextSide()
        val strategy = nextStrategy()
        val parentId = nextParentId()
        orderId += 1
        val ccy = nextCCY()

        val line = s"HSET order:$orderId id $orderId currency $ccy ric $ric quantity $qty price $prc side $side strategy $strategy parentId $parentId"
        val line2 = s"ZADD order.id.pk $orderId $orderId"
        val line3 = s"ZADD order.currency.idx 0 $ccy:$orderId"

        write(line + "\n")
        write(line2 + "\n")
        write(line3 + "\n")
      })
      close()
    }

  }

}
