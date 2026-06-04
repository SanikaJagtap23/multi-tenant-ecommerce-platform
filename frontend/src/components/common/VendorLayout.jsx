import { Outlet } from "react-router-dom";
import VendorSidebar from "./VendorSidebar";
import "./VendorLayout.css";

export default function VendorLayout() {
  return (
    <div className="vendor-layout">
      <VendorSidebar />
      <main className="vendor-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
