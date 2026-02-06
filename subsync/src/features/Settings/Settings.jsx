import { Outlet, useLocation } from "react-router-dom";

function SettingsPage() {
  const location = useLocation();
  
  return (
    <div className="flex flex-col md:flex-row w-full h-full gap-2">
      <div className="w-full">
        <div key={location.key}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
