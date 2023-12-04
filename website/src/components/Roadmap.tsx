import React from "react";

import "./Roadmap.css";

export type VuuMilestone = {
  epicLink?: string;
  label: string;
  targetDate: string;
};

export interface RoadmapProps {
  milestones: VuuMilestone[];
}

export const Roadmap = ({ milestones }: RoadmapProps) => {
  const classBase = "vuuRoadmap";

  return (
    <div className={classBase}>
      {milestones.map(({ label, targetDate, epicLink }, i) => (
        <div className={`${classBase}-milestone`} key={i}>
          <div className={`${classBase}-description`}>{label}</div>
          <div>
            <span className={`${classBase}-date`}>{targetDate}</span>
            {epicLink ? (
              <a
                className={`${classBase}-epic`}
                href={epicLink}
                target="_blank"
              >
                View Epic
                <span data-icon="link" />
              </a>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};
