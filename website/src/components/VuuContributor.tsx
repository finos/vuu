import React from "react";

import "./VuuContributor.css";

const classBase = "vuuContributor";

export interface VuuContributorProps {
  company: string;
  initial: string;
  name: string;
  role: string;
}

export const VuuContributor = ({
  company,
  initial,
  name,
  role,
}: VuuContributorProps) => {
  return (
    <div className={classBase} data-initial={initial}>
      <div className={`${classBase}-name`}>{name}</div>
      <div>
        <span className={`${classBase}-company`}>{company}</span>,
        <span className={`${classBase}-role`}>{role}</span>
      </div>
    </div>
  );
};
