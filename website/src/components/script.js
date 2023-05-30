import React, { useState } from "react";
import "../css/custom.css";
import ViewPorting from "../../static/img/finos/view-porting.png";
import Conflation from "../../static/img/finos/conflation.png";
import JoiningAndTreeing from "../../static/img/finos/joining-treeing.png";
import Table from "../../static/img/finos/table.png";

const Script = () => {
  const [expandedColumn, setExpandedColumn] = useState(null);

  const handleColumnClick = (columnIndex) => {
    setExpandedColumn(columnIndex === expandedColumn ? null : columnIndex);
  };

  return (
    <div className="feature-3-container">
      <div
        className={`column ${expandedColumn === 0 ? "expanded" : ""}`}
        onClick={() => handleColumnClick(0)}
      >
        <img
          src={ViewPorting}
          alt="VUU"
          className={`image ${
            expandedColumn !== 0 && expandedColumn !== null ? "hidden" : ""
          }`}
        />
        {expandedColumn === 0 && (
          <img src={Table} alt="VUU Logo" className="expanded-image" />
        )}
        <h2 className="feature-3-heading">View Porting</h2>
        <p
          className={`p-homepage ${
            expandedColumn !== 0 && expandedColumn !== null ? "hidden" : ""
          }`}
        >
          A Viewport is a specific client's view onto an underlying table. It
          has knowledge of the underlying table that a viewport is looking.
        </p>
      </div>
      <div
        className={`column ${expandedColumn === 1 ? "expanded" : ""}`}
        onClick={() => handleColumnClick(1)}
      >
        <img
          src={Conflation}
          alt="VUU"
          className={`image ${
            expandedColumn !== 1 && expandedColumn !== null ? "hidden" : ""
          }`}
        />
        {expandedColumn === 1 && (
          <img src={Table} alt="VUU Logo" className="expanded-image" />
        )}
        <h2 className="feature-3-heading">Conflation</h2>
        <p
          className={`p-homepage ${
            expandedColumn !== 1 && expandedColumn !== null ? "hidden" : ""
          }`}
        >
          A Viewport is a specific client's view onto an underlying table. It
          has knowledge of the underlying table that a viewport is looking.
        </p>
      </div>
      <div
        className={`column ${expandedColumn === 2 ? "expanded" : ""}`}
        onClick={() => handleColumnClick(2)}
      >
        <img
          src={JoiningAndTreeing}
          alt="VUU"
          className={`image ${
            expandedColumn !== 2 && expandedColumn !== null ? "hidden" : ""
          }`}
        />
        {expandedColumn === 2 && (
          <img src={Table} alt="VUU Logo" className="expanded-image" />
        )}
        <h2 className="feature-3-heading">Joining and Treeing</h2>
        <p
          className={`p-homepage ${
            expandedColumn !== 2 && expandedColumn !== null ? "hidden" : ""
          }`}
        >
          A Viewport is a specific client's view onto an underlying table. It
          has knowledge of the underlying table that a viewport is looking.
        </p>
      </div>
    </div>
  );
};

export default Script;
