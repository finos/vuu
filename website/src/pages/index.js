import React from "react";
import classnames from "classnames";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./styles.module.css";
import Feature from "../components/feature";
import { features } from "../components/feature-config";
import { featuresTwo } from "../components/featuresTwo-config";
import Chart from "../../static/img/finos/chart.png";
import DemoApp from "../../static/img/finos/demo-app.png";
import Scroll from "../../static/img/finos/scroll.png";
import Effect from "../../static/img/finos/effect.png";
import Script from "../components/script";

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`${siteConfig.title}`} description={`${siteConfig.tagline}`}>
      <header className={classnames("hero hero--primary", styles.heroBanner)}>
        <div className="container">
          <h1>Delivering risk data </h1>
          <h2>from trading systems, to human eyes</h2>
          <p className="p-homepage">
            Vuu deals with the complex task of viewporting, throttling <br />{" "}
            and transmiting your data to clients, so you don't have to.
          </p>
          <Link
            className={classnames(
              "button button--lg get-started-button",
              styles.getStarted
            )}
            to={"https://finos.org/"}
          >
            GET STARTED
          </Link>
        </div>
        <img
          src={Chart}
          alt="chart"
          // style={{ height: "500px", width: "400px" }}
        />
      </header>

      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <img
                className="home-page-images"
                src={Scroll}
                alt="demo-app"
                style={{ height: "50px" }}
              />
              <h1 style={{ textAlign: "center" }}> Why VUU</h1>

              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
        {featuresTwo && featuresTwo.length && (
          <section className={styles.members}>
            <Script />

            <img
              src={Effect}
              className="home-page-images"
              alt="demo-app"
              style={{ height: "40px", marginTop: "40px" }}
            />
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
        )}
      </main>
    </Layout>
  );
}

export default Home;
