package org.finos.vuu.example.valkey.populate

import java.io.File
import java.nio.file.{Files, Paths}
import java.nio.file.attribute.FileAttribute
import java.util.UUID
import scala.util.Random


object CreateValKeyDataFile {


  private val HKEX_RICS = Array(
    "00001.HK",
    "00002.HK",
    "00003.HK",
    "00005.HK",
    "00006.HK",
    "00011.HK",
    "00012.HK",
    "00016.HK",
    "00017.HK",
    "00027.HK",
    "00066.HK",
    "00101.HK",
    "00175.HK",
    "00241.HK",
    "00267.HK",
    "00288.HK",
    "00291.HK",
    "00316.HK",
    "00322.HK",
    "00386.HK",
    "00388.HK",
    "00669.HK",
    "00688.HK",
    "00700.HK",
    "00762.HK",
    "00823.HK",
    "00836.HK",
    "00857.HK",
    "00868.HK",
    "00881.HK",
    "00883.HK",
    "00939.HK",
    "00941.HK",
    "00960.HK",
    "00968.HK",
    "00981.HK",
    "00992.HK",
    "01038.HK",
    "01044.HK",
    "01088.HK",
    "01093.HK",
    "01099.HK",
    "01109.HK",
    "01113.HK",
    "01177.HK",
    "01209.HK",
    "01211.HK",
    "01299.HK",
    "01378.HK",
    "01398.HK",
    "01810.HK",
    "01876.HK",
    "01928.HK",
    "01929.HK",
    "01997.HK",
    "02020.HK",
    "02269.HK",
    "02313.HK",
    "02318.HK",
    "02319.HK",
    "02331.HK",
    "02382.HK",
    "02388.HK",
    "02628.HK",
    "02688.HK",
    "02899.HK",
    "03690.HK",
    "03692.HK",
    "03968.HK",
    "03988.HK",
    "06098.HK",
    "06618.HK",
    "06690.HK",
    "06862.HK",
    "09618.HK",
    "09633.HK",
    "09888.HK",
    "09961.HK",
    "09988.HK",
    "09999.HK",
  )

  private val LDN_RICS = Array(
    "AAL.L",
    "ABF.L",
    "ADM.L",
    "ADN.L",
    "AHT.L",
    "ANTO.L",
    "ARM.L",
    "AV.L",
    "AZN.L",
    "BA.L",
    "BAB.L",
    "BARC.L",
    "BATS.L",
    "BDEV.L",
    "BG.L",
    "BKG.L",
    "BLND.L",
    "BLT.L",
    "BNZL.L",
    "BP.L",
    "BRBY.L",
    "BT-A.L",
    "CCL.L",
    "CNA.L",
    "CPG.L",
    "CPI.L",
    "CRH.L",
    "DC.L",
    "DGE.L",
    "DLG.L",
    "EXPN.L",
    "EZJ.L",
    "FRES.L",
    "GFS.L",
    "GKN.L",
    "GLEN.L",
    "GSK.L",
    "HIK.L",
    "HL.L",
    "HMSO.L",
    "HSBA.L",
    "IAG.L",
    "IHG.L",
    "III.L",
    "IMT.L",
    "INTU.L",
    "ISAT.L",
    "ITRK.L",
    "ITV.L",
    "JMAT.L",
    "KGF.L",
    "LAND.L",
    "LGEN.L",
    "LLOY.L",
    "LSE.L",
    "MGGT.L",
    "MKS.L",
    "MNDI.L",
    "MRW.L",
    "NG.L",
    "NXT.L",
    "OML.L",
    "PRU.L",
    "PSON.L",
    "RB.L",
    "RBS.L",
    "RDSA.L",
    "RDSB.L",
    "REL.L",
    "RIO.L",
    "RMG.L",
    "RR.L",
    "RRS.L",
    "RSA.L",
    "SAB.L",
    "SBRY.L",
    "SDR.L",
    "SGE.L",
    "SHP.L",
    "SKY.L",
    "SL.L",
    "SMIN.L",
    "SN.L",
    "SPD.L",
    "SSE.L",
    "STAN.L",
    "STJ.L",
    "SVT.L",
    "TPK.L",
    "TSCO.L",
    "TUI.L",
    "TW.L",
    "ULVR.L",
    "UU.L",
    "VOD.L",
    "WOS.L",
    "WPP.L",
    "WTB.L",
  )

  private val NYSE_RICS = Array(
    "AAPL",
    "MSFT",
    "AMZN",
    "NVDA",
    "META",
    "TSLA",
    "GOOGL",
    "GOOG",
    "AVGO",
    "COST",
    "PEP",
    "ADBE",
    "CSCO",
    "CMCSA",
    "NFLX",
    "TMUS",
    "AMD",
    "TXN",
    "INTC",
    "AMGN",
    "INTU",
    "HON",
    "QCOM",
    "AMAT",
    "BKNG",
    "SBUX",
    "ISRG",
    "ADP",
    "MDLZ",
    "GILD",
    "VRTX",
    "REGN",
    "ADI",
    "LRCX",
    "MU",
    "PANW",
    "SNPS",
    "CHTR",
    "MELI",
    "PYPL",
    "CSX",
    "CDNS",
    "KLAC",
    "PDD",
    "MAR",
    "MNST",
    "ABNB",
    "ORLY",
    "CTAS",
    "ASML",
    "NXPI",
    "WDAY",
    "LULU",
    "KDP",
    "FTNT",
    "MRVL",
    "PCAR",
    "ODFL",
    "ADSK",
    "KHC",
    "MCHP",
    "CPRT",
    "AEP",
    "PAYX",
    "EXC",
    "ON",
    "AZN",
    "SGEN",
    "ROST",
    "MRNA",
    "BIIB",
    "CRWD",
    "IDXX",
    "BKR",
    "CEG",
    "CTSH",
    "VRSK",
    "DXCM",
    "TTD",
    "XEL",
    "EA",
    "CSGP",
    "GFS",
    "FAST",
    "TEAM",
    "GEHC",
    "WBD",
    "FANG",
    "DDOG",
    "ANSS",
    "EBAY",
    "DLTR",
    "ALGN",
    "ZS",
    "ILMN",
    "WBA",
    "ZM",
    "ENPH",
    "SIRI",
    "JD",
    "LCID",
  )

  private val RICS = HKEX_RICS ++ LDN_RICS ++ NYSE_RICS

  private val SIDES = Array("B", "S", "SS")
  private val STRATEGIES = Array("BLK", "LIT", "VWAP", "TWAP", "SNIPER", "DARK", "PAIR")
  private val CURRENCY = Array("GBP", "EUR", "USD", "HKD", "CAD")

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

    val MAX_LINES = 20_000_000 //this is a function of RAM, 25m on Macbook Pro m2 with 16Gb RAM is quite toppy
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

        val orderTimeMs = System.currentTimeMillis()
        val orderIdGuid = UUID.randomUUID.toString
        val ric = nextRic()
        val qty = nextQuantity()
        val prc = nextPrice()
        val side = nextSide()
        val strategy = nextStrategy()
        val parentId = nextParentId()
        orderId += 1
        val ccy = nextCCY()

        val line = s"HSET order:$orderIdGuid id $orderIdGuid currency $ccy ric $ric quantity $qty price $prc side $side strategy $strategy parentId $parentId orderTimeMs $orderTimeMs"
        val line2 = s"ZADD order.id.pk $orderId $orderIdGuid"
        val line3 = s"ZADD order.currency.idx 0 $ccy:$orderIdGuid"
        val line4 = s"ZADD order.orderTimeMs.idx 0 $orderTimeMs:$orderIdGuid"
        val line5 = s"ZADD order.strategy.idx 0 $strategy:$orderIdGuid"
        val line6 = s"ZADD order.parentId.idx 0 $parentId:$orderIdGuid"
        val line7 = s"ZADD order.ric.idx 0 $ric:$orderIdGuid"
        val line8 = s"ZADD order.quantity.idx 0 $qty:$orderIdGuid"

        write(line + "\n")
        write(line2 + "\n")
        write(line3 + "\n")
        write(line4 + "\n")
        write(line5 + "\n")
        write(line6 + "\n")
        write(line7 + "\n")
        write(line8 + "\n")
      })
      close()
    }

  }

}
