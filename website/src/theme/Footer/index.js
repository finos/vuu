import React from "react";
import VuuLogo from "../../../static/img/finos/vuu-text.png";
import FinosLogo from "../../../static/img/finos/finos.png";

import "./Footer.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer-columns">
        <div className="footer-column footer-column-logo">
          <img src={VuuLogo} alt="Image 1" width="80" />
          <p className="vuu-copyright">
            {" "}
            Copyright &copy; {new Date().getFullYear()} VUU
          </p>
        </div>
        <div className="vuu-separator" />
        <div className="footer-column">
          <a href="https://www.finos.org/about-us">
            <img className="footer-finos-logo" src={FinosLogo} alt="FINOS" />
          </a>
        </div>
        <div className="vuu-separator" />
        <div className="footer-column">
          <ul className="vuu-link-list">
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
              <a href="/docs/roadmap">Team</a>
            </li>
            <li>
              <a href="https://www.finos.org/about-us">About FINOS</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
