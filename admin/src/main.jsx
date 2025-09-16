import { ConfigProvider } from "antd";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router/AppRouter";

import "antd/dist/reset.css";
import "./global.css";
import { setCssVars } from "./utils";
setCssVars();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
        <AppRouter />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
