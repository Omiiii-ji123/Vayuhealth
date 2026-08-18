import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children, title, subtitle, onSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="app-shell__main">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          title={title}
          subtitle={subtitle}
          onSearch={onSearch}
        />
        <main className="app-shell__content">{children}</main>
      </div>
    </div>
  );
}
