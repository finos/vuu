import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import "../theme/Footer/Footer-mobile.css";
import { RevolvingCaption } from "../components/RevolvingCaption";
import { ChartMobile } from "../components/ChartMobile";
const revolvingCaptions = [
  "your data",
  "risk data",
  "market data",
  "order data",
];

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`${siteConfig.title}`} description={`${siteConfig.tagline}`}>
      <div className="vuu-scroll-1-bg" />
      <header className={classnames("vuu-section vuu-scroll-1")}>
        <div className="vuu-scroll-1-main">
          <div className="vuu-scroll-1-copy">
            <h1 className="vuu-heading-1">
              Delivering <br />
              <RevolvingCaption captions={revolvingCaptions} />
              {/* <span className="vuu-revolving-caption">market data</span> */}
            </h1>
            <h2 className="vuu-heading-2">
              from trading systems, <br />
              to human eyes
            </h2>
            {/* <img className="vuu-chart" src={Ch} alt="chart" /> */}
            <ChartMobile />

            <p className="vuu-paragraph-large">
              Vuu deals with the complex task of viewporting, throttling <br />{" "}
              and transmiting your data to clients, so you don't have to.
            </p>
            <div className="vuu-button-bar">
              <Link
                className="vuu-button vuu-button-cta"
                to="https://finos.org/"
              >
                GET STARTED
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="vuu-main">
        <section className={classnames("vuu-section vuu-frame-10")}>
          <div className="container">
            <h1 className="vuu-heading-1" style={{ textAlign: "center" }}>
              Why VUU ?
            </h1>
            <div className="vuu-feature-row">
              <div className="vuu-feature">
                <div className="vuu-feature-1">
                  1<span className="vuu-feature-1-measure">mil</span>
                </div>
                <div className="vuu-feature-2">ROWS PER TABLE</div>
              </div>
            </div>
            <div className="vuu-feature-row">
              <div className="vuu-feature">
                <div className="vuu-feature-1">
                  100<span className="vuu-feature-1-measure">k</span>
                </div>
                <div className="vuu-feature-2">TICKS PER SECOND</div>
              </div>
            </div>
            <div className="vuu-feature-row">
              <div className="vuu-feature">
                <div className="vuu-feature-1">
                  100<span className="vuu-feature-1-measure">mb</span>
                </div>
                <div className="vuu-feature-2">MEMORY FOOTPRINT</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
