package org.finos.vuu.csv

import org.finos.vuu.core.module.basket.csv.CsvStaticLoader
import org.scalatest.featurespec.AnyFeatureSpec

import scala.io.Source

class CsvStaticLoaderTests extends AnyFeatureSpec{

    Feature("CSV loading Test Case") {

      Scenario("Can successfully load and parse basket constituents") {
        val testResourcePath =  this.getClass.getResource("/constituents").getPath
        val constituents = CsvStaticLoader.loadConstituent(".FTSE100", Some(testResourcePath))

        assert(constituents.length == 3)
        val firstRow = constituents.head
        assert(firstRow("Symbol") == "AAL.L")
        assert(firstRow("Last Trade") == "436.35")
        assert(firstRow("Name") == "Anglo American PLC")
        assert(firstRow("Weighting") == 0.0278736825813547)
        assert(firstRow("Volume") == "5799089")
        assert(firstRow("Change") == "5.35")
      }

      Scenario("When parsing basket constituents fails return empty") {

        val constituents = CsvStaticLoader.loadConstituent(".FTSEWithError")

        assert(constituents.length == 0)
      }


      Scenario("When no matching basket constituents file return empty") {

        val constituents = CsvStaticLoader.loadConstituent(".NoSuchFile")

        assert(constituents.length == 0)
      }

    }
}
