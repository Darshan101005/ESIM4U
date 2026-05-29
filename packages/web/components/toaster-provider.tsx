"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1A1D20",
          color: "#fff",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "#22C55E",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
