import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./styles.module.css";
import { SvgArrow } from "../components/SvgArrow";
import Chart from "../../static/img/finos/chart.png";
import DemoApp from "../../static/img/finos/demo-app.png";
import ViewPorting from "../../static/img/finos/view-porting.png";
import Conflation from "../../static/img/finos/conflation.png";
import JoiningAndTreeing from "../../static/img/finos/joining-treeing.png";
import { VuuFeatureLayout } from "../components/VuuFeatureLayout";
import { VuuFeature } from "../components/VuuFeature";
import { useScrollPosition } from "../hooks/useScrollPosition";

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  useScrollPosition();
  return (
    <Layout title={`${siteConfig.title}`} description={`${siteConfig.tagline}`}>
      <div className="vuu-scroll-1-bg" />
      <header className={classnames("vuu-section vuu-scroll-1")}>
        <div className="vuu-scroll-1-main">
          <div className="vuu-scroll-1-copy">
            <h1 className="vuu-heading-1">
              Delivering{" "}
              <span className="vuu-revolving-caption">risk data</span>
            </h1>
            <h2 className="vuu-heading-2">
              from trading systems, to human eyes
            </h2>
            <p className="vuu-paragraph-large">
              Vuu deals with the complex task of viewporting, throttling <br />{" "}
              and transmiting your data to clients, so you don't have to.
            </p>
            <Link
              className={classnames(
                "vuu-action button vuu-get-started-button button--lg"
              )}
              to={"https://finos.org/"}
            >
              GET STARTED
            </Link>
          </div>
          <img
            className="vuu-chart"
            src={Chart}
            alt="chart"
            // style={{ height: "500px", width: "400px" }}
          />
        </div>
        <div className="vuu-scroll-1-scroll-arrow">
          <div className="vuu-scroll-arrow">
            <div className="vuu-scroll-arrow-title">SCROLL</div>
            <SvgArrow className="vuu-scroll-arrow-svg" radius={3} />
            {/* <img
              className="home-page-images"
              src={Scroll}
              alt="demo-app"
              style={{ height: "50px" }}
            /> */}
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
            <VuuFeature Img={ViewPorting} title="View Porting">
              A Viewport is a specific client's view onto an underlying table.
              It has knowledge of the underlying table that a viewport is
              looking.
            </VuuFeature>
            <VuuFeature Img={Conflation} title="Conflation">
              A Viewport is a specific client's view onto an underlying table.
              It has knowledge of the underlying table that a viewport is
              looking.
            </VuuFeature>
            <VuuFeature Img={JoiningAndTreeing} title="Joins & Treeing">
              A Viewport is a specific client's view onto an underlying table.
              It has knowledge of the underlying table that a viewport is
              looking.
            </VuuFeature>
          </VuuFeatureLayout>
        </section>
        <section className={classnames("vuu-section vuu-frame-13")}>
          <h1 style={{ textAlign: "center" }}> Demo App</h1>
          <img
            src={DemoApp}
            className="home-page-images"
            alt="demo-app"
            style={{ height: "500px", width: "75%", borderRadius: "20px" }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "2vh",
            }}
          >
            <Link
              className={classnames(
                "button button--lg get-started-button",
                styles.getStarted
              )}
              to={"https://finos.org/"}
            >
              GET STARTED
            </Link>
            <Link
              className={classnames(
                "button button--lg github-button",
                styles.getStarted
              )}
              to={"https://finos.org/"}
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
