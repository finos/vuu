/**
 * Desktop Footer
 */
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
            Copyright &copy; {new Date().getFullYear()} VUU - UBS
          </p>
        </div>
        <div className="vuu-separator" />
        <div className="footer-column">
          <img className="footer-finos-logo" src={FinosLogo} alt="Image 2" />
        </div>
        <div className="vuu-separator" />
        <div className="footer-column">
          <ul className="vuu-link-list">
            <li>
              <a href="/page1">Docs</a>
            </li>
            <li>
              <a href="/page2">Getting Started</a>
            </li>
            <li>
              <a href="/page2">Road Map</a>
            </li>
            <li>
              <a href="/page2">Team</a>
            </li>
            <li>
              <a href="/page2">About FINOS</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
