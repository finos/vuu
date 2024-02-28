import React from "react";

import "./Contact.css";

export type ContactDetail = {
  title: string;
  description: string;
  email?: string;
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
          <div className={`${classBase}-description`}>{description}</div>
          <div className={`${classBase}-email`}>
              { email ? (
               <div>{email}</div>
              ) : null}
          </div>
          <hr />
        </>
      ))}
    </div>
  );
};
