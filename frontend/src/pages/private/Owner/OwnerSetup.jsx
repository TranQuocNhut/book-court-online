import React from "react";
import { Navigate } from "react-router-dom";
import SetupVenue from "./SetupVenue";

const OwnerSetup = () => {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8fafc",
      padding: "48px 24px"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <SetupVenue />
      </div>
    </div>
  );
};

export default OwnerSetup;

