import React from "react";

import "./Contact.css";

export type ContactDetail = {
  title: string;
  description: string;
  email: string;
  subscription?: string;
};

export interface ContactProps {
  contactDetails: ContactDetail[];
}

export const Contact = ({ contactDetails }: ContactProps) => {
  const classBase = "vuuContact";

  return (
    <div className={classBase}>
      {contactDetails.map(({ title, description, email, subscription }, i) => (
        <>
          <div className={`${classBase}-title`}>{title}</div>
          <div className={`${classBase}-subtitle`}>{description}</div>
          <div className={`${classBase}-email`}>{email}</div>
          <div className={`${classBase}-subscription`}>
              { subscription ? (
               <div>
                    <span className={`${classBase}-text`}>Subscribe by emailing </span>
                    <a className={`${classBase}-email`}>{subscription}</a>
                </div>
              ) : null}
          </div>
          <hr />
        </>
      ))}
    </div>
  );
};
