/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.

 * Created by chris on 21/08/15.

 */
package io.venuu.vuu.core.table

import com.espertech.esper.client.{Configuration, EPServiceProviderManager, EventBean, UpdateListener}
import com.espertech.esper.event.map.MapEventBean
import org.scalatest.featurespec.AnyFeatureSpec
import org.scalatest.matchers.should.Matchers

import java.util

//Some details on esper handling removes
//http://www.espertech.com/esper/release-5.3.0/esper-reference/html/processingmodel.html
//http://www.espertech.com/esper/release-5.3.0/esper-reference/html/epl_clauses.html#epl-select-using-istream-rstream


/**
  * After much digging around in esper it seems the easiest way to transmit deletes through the streams is by additing a flag.
  * This massive downside of this is that we will cache a history of all unique events by id. so for example
  * if we had an orders table and we continuously added 10m orders each 10 mins, but we were willing to delete all dead orders
  * esper should have a cache of only the 10m orders in reality as we have no way to clear it out, in 1 hr it will contain 60m.
  *
  * that is bad, but will need to revist when we have a mega-data use case.
  */
class JoinManagerTest extends AnyFeatureSpec with Matchers {

  Feature("check esper output when passing scala maps"){

    Scenario("check scala map handling"){

      val leftEventType = "instrument"
      val rightEventType = "prices"

     val instrumentDef = new java.util.HashMap[String, Object]()
      instrumentDef.put("instrument.ric", classOf[String])
      instrumentDef.put("instrument.description", classOf[String])
      instrumentDef.put("instrument._isDeleted", classOf[Boolean])

      val pricesDef = new util.HashMap[String, Object]()

      pricesDef.put("prices.ric", classOf[String])
      pricesDef.put("prices.bid", classOf[Double])
      pricesDef.put("prices.ask", classOf[Double])
      pricesDef.put("prices._isDeleted", classOf[Boolean])


      val epl = s"SELECT $leftEventType.ric, $leftEventType._isDeleted, $rightEventType.ric, $rightEventType._isDeleted FROM $leftEventType.std:unique(instrument.ric) $leftEventType LEFT OUTER JOIN $rightEventType.std:unique(prices.ric) AS $rightEventType ON $leftEventType.ric = $rightEventType.ric"

      //val epl = s"create window InstrumentPrices.std:unique(instrument.ric) as SELECT $leftEventType.ric, $rightEventType.ric FROM $leftEventType LEFT OUTER JOIN $rightEventType ON $leftEventType.ric = $rightEventType.ric"

      val epl2 = s"SELECT rstream * FROM $leftEventType.std:unique(instrument.ric) AS $leftEventType LEFT OUTER JOIN $rightEventType.std:unique(prices.ric) AS $rightEventType ON $leftEventType.ric = $rightEventType.ric"

      val cepConfig = new Configuration();

      cepConfig.addEventType("instrument", instrumentDef)
      cepConfig.addEventType("prices", pricesDef)

      val cep = EPServiceProviderManager.getProvider("myCEPEngine",cepConfig);
      val cepRT = cep.getEPRuntime();

      val cepAdm = cep.getEPAdministrator();
      val cepStatement = cepAdm.createEPL(epl);
      //val deleteCepStatement = cepAdm.createEPL(epl2)

      val listener = new UpdateListener {

        override def update(newEvents: Array[EventBean], oldEvents: Array[EventBean]): Unit = {

          println("here +> " +
            newEvents.foreach(
              evb => println(evb.asInstanceOf[MapEventBean].getProperties)

            ))
        }
      }

      cepStatement.addListener(listener)

      val event = new java.util.HashMap[String, Any]();
      event.put("instrument.ric", "VOD.L");
      event.put("instrument.description", "Vodaphone");
      event.put("instrument._isDeleted", false);
      //event.put("_eventType", "DELETE")

      val event2 = new java.util.HashMap[String, Any]();
      event2.put("prices.ric", "VOD.L");
      event2.put("prices.bid", 220.1d);
      event2.put("prices.ask", 221.1d);
      event2.put("prices._isDeleted", true);

      cepRT.sendEvent(event, leftEventType)
      cepRT.sendEvent(event2, rightEventType)

      //cepRT.executeQuery(s"DELETE FROM instrument where ric = 'VOD.L'")

      Thread.sleep(100)

    }

  }

}
