import React from "react";
import VuuLogo from "../../../static/img/finos/vuu-text.png";
import FinosLogo from "../../../static/img/finos/finos.png";

import "../../css/custom.css";

const Footer = () => {
  return (
    <footer>
      <div className="footer-columns">
        <div className="footer-column">
          <img src={VuuLogo} alt="Image 1" />
          <p className="copyright">
            {" "}
            Copyright &copy; {new Date().getFullYear()} VUU - UBS
          </p>
        </div>
        <div className="footer-column">
          <img src={FinosLogo} alt="Image 2" />
        </div>
        <div className="footer-column">
          <ul>
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
        <div className="footer-column">
          <ul>
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
