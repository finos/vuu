/**
 * Desktop Home
 */
import React, { useEffect, useState } from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { SvgArrow } from "../components/SvgArrow";
import DemoApp from "../../static/img/vuu/DemoApp.png";
import SampleApp from "../../static/img/vuu/SampleApp.png";
import ViewPorting from "../../static/img/finos/view-porting.png";
import Conflation from "../../static/img/finos/conflation.png";
import JoiningAndTreeing from "../../static/img/finos/joining-treeing.png";
import { VuuFeatureLayout } from "../components/VuuFeatureLayout";
import { VuuFeature } from "../components/VuuFeature";
import { useScrollPosition } from "../hooks/useScrollPosition";
import { RevolvingCaption } from "../components/RevolvingCaption";
import { DataAnimation } from "../components/DataAnimation";

const revolvingCaptions = [
  "your data",
  "risk data",
  "order data",
  "market data",
];

const captionIntervals = [3, 5, 5, 5];

function Home() {
  const context = useDocusaurusContext();
  const [animationState, setAnimationState] = useState("waiting");
  const { siteConfig = {} } = context;
  useScrollPosition();
  useEffect(() => {
    console.log("trigger animations");
    setAnimationState("running");
  }, []);
  return (
    <Layout title={`${siteConfig.title}`} description={`${siteConfig.tagline}`}>
      <div className="vuu-scroll-1-bg" />
      <header className={classnames("vuu-section vuu-scroll-1")}>
        <div className="vuu-scroll-1-main">
          <div className="vuu-scroll-1-copy">
            <h1 className="vuu-heading-1">
              Delivering
              <RevolvingCaption
                captions={revolvingCaptions}
                animationState={animationState}
                intervals={captionIntervals}
                loopInterval={5}
              />
            </h1>
            <h2 className="vuu-heading-2">
              from trading systems, to human eyes
            </h2>
            <p className="vuu-paragraph-large">
              Vuu deals with the complex task of viewporting, throttling <br />{" "}
              and transmitting your data to clients, so you don't have to.
            </p>
            <div className="vuu-button-bar">
              <Link
                className="vuu-button vuu-button-cta"
                to="/docs/getting_started"
              >
                GET STARTED
              </Link>
            </div>
          </div>
          <DataAnimation
            animationState={animationState}
            height={600}
            interval={5}
            width={600}
          />
        </div>
        <div className="vuu-scroll-1-scroll-arrow">
          <div className="vuu-scroll-arrow">
            <div className="vuu-scroll-arrow-title">SCROLL</div>
            <SvgArrow className="vuu-scroll-arrow-svg" radius={3} />
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
              <div className="vuu-feature">
                <div className="vuu-feature-1">
                  100<span className="vuu-feature-1-measure">k</span>
                </div>
                <div className="vuu-feature-2">TICKS PER SECOND</div>
              </div>
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
          <VuuFeatureLayout>
            <VuuFeature
              Img={ViewPorting}
              title="View Porting"
              DetailImg={SampleApp}
            >
              A Viewport is a virtualized window into an underlying table. It
              encapsulates the subscription of a single client-side component.
            </VuuFeature>
            <VuuFeature
              className="vuu-conflation"
              Img={Conflation}
              title="Conflation"
              DetailImg={SampleApp}
            >
              UI rendering can be a bottleneck. Vuu manages backpressure,
              ensuring that the UI is never over-whelmed with too much data.
            </VuuFeature>
            <VuuFeature
              className="vuu-joining-treeing"
              Img={JoiningAndTreeing}
              title="Joins & Treeing"
              DetailImg={SampleApp}
            >
              Vuu tables can be joined. Data can be grouped, filtered, sorted
              and aggregated. Updates are sent to clients in real time.
            </VuuFeature>
          </VuuFeatureLayout>
        </section>
        <section className={classnames("vuu-section vuu-frame-13")}>
          <h1 className="vuu-heading-1">Demo App</h1>
          <div className="vuu-demo-bg">
            <div className="vuu-demo-container">
              <img className="vuu-sample-app" src={DemoApp} alt="demo-app" />
            </div>
            <VuuFeature title="Demo">
              Vuu is in incubation status. Production applications are in
              development. A fully-featured showcase application will be
              available for the version 1.0 launch in November 2023.
            </VuuFeature>
          </div>

          <div className="vuu-button-bar">
            <Link
              className="vuu-button vuu-button-cta"
              to="/docs/getting_started"
            >
              GET STARTED
            </Link>
            <Link
              className="vuu-button vuu-button-secondary"
              to="https://github.com/finos/vuu"
            >
              GITHUB
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;
