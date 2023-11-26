/**
 * Mobile Home
 */
import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import "../theme/Footer/Footer-mobile.css";
import { RevolvingCaption } from "../components/RevolvingCaption";
import { ChartMobile } from "../components/ChartMobile";
import ViewPorting from "../../static/img/finos/view-porting.png";
import Conflation from "../../static/img/finos/conflation.png";
import JoiningAndTreeing from "../../static/img/finos/joining-treeing.png";
import VuuLogo from "../../static/img/finos/vuu-text.png";
import FinosLogo from "../../static/img/finos/finos.png";

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
      <div className="vuu-scroll-1-main">
        <h1 className="vuu-heading-1">
          Delivering <br />
          <RevolvingCaption
            captions={revolvingCaptions}
            className="mobileRevolvingCaption"
            offSetValue={44}
          />
          {/* <span className="vuu-revolving-caption">market data</span> */}
        </h1>
        <h2 className="vuu-heading-2">
          from trading systems, <br />
          to human eyes
        </h2>

        <p className="vuu-paragraph-small">
          Vuu deals with the complex task of viewporting, throttling <br /> and
          transmitting your data to clients, so you don't have to.
        </p>
        <div className="vuu-button-bar">
          <Link
            className="vuu-button vuu-button-cta"
            to="/docs/getting_started"
          >
            GET STARTED
          </Link>
        </div>
        {/* <img className="vuu-chart" src={Ch} alt="chart" /> */}
        <ChartMobile />
      </div>

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
        <section className={classnames("vuu-section vuu-frame-11")}>
          <div className="container">
            <div className="image-container">
              <img src={ViewPorting} alt="Image 1" />
            </div>
            <div className="content-container">
              <h2 className="vuu-heading-2">View Porting</h2>
              <p className="vuu-paragraph-large">
                A Viewport is a virtualized window into an underlying table. It
                encapsulates the subscription of a single client-side component.
              </p>
            </div>
          </div>
          <div className="container">
            <div className="image-container">
              <img src={Conflation} alt="Image 1" />
            </div>
            <div className="content-container">
              <h2 className="vuu-heading-2">Conflation</h2>
              <p className="vuu-paragraph-large">
                UI rendering can be a bottleneck. Vuu manages backpressure,
                ensuring that the UI is never over-whelmed with too much data.
              </p>
            </div>
          </div>
          <div className="container">
            <div className="image-container">
              <img src={JoiningAndTreeing} alt="Image 1" />
            </div>
            <div className="content-container">
              <h2 className="vuu-heading-2">Joins & Treeing</h2>
              <p className="vuu-paragraph-large">
                Vuu tables can be joined. Data can be grouped, filtered, sorted
                and aggregated. Updates are sent to clients in real time.
              </p>
            </div>
          </div>
        </section>
        <section className={classnames("vuu-section vuu-frame-12")}>
          <div className="footer-mobile">
            <div className="footer-column-logo">
              <img src={VuuLogo} alt="Image 1" />
            </div>
            <p className="vuu-copyright">
              {" "}
              Copyright &copy; {new Date().getFullYear()} VUU - UBS
            </p>
            <div className="footer-finos-logo">
              <img src={FinosLogo} alt="Image 1" />
            </div>

            <div className="vuu-mobile-link-list">
              <ul>
                <li>
                  <a href="/docs/introduction/intro">Docs</a>
                </li>
                <li>
                  <a href="/docs/getting_started">Getting Started</a>
                </li>
                <li>
                  <a href="/docs/roadmap">Road Map</a>
                </li>
                <li>
                  <a href="/docs/team">Team</a>
                </li>
                <li>
                  <a href="https://finos.org">About FINOS</a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
