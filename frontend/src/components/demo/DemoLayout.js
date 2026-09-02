import React from 'react';
import { Outlet } from 'react-router-dom';
import DemoHeader from './DemoHeader';

/**
 * DemoLayout — shell wrapper for all /demo/* routes.
 *
 * Renders DemoHeader (with the DEMO MODE indicator bar) above
 * the child page content via <Outlet />.
 *
 * Sub-pages that already include DemoHeader in their own render
 * (DemoDashboard) are routed directly without this layout so the
 * header doesn't double-render. All other sub-pages (/demo/drive-cleanup,
 * /demo/breach-radar, etc.) are wrapped here.
 */
const DemoLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20">
      <DemoHeader />
      <Outlet />
    </div>
  );
};

export default DemoLayout;
