import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const navItems = [
  { key: "vault", label: "My Vault", path: "/dashboard" },
  { key: "add", label: "Add Credential", path: "/add" },

];

function VaultLayout({ activeKey, title, subtitle, children, actions, breadcrumb }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="vault-shell">
      <header className="vault-topbar">
        <div className="vault-topbar-brand">The Academic Curator</div>
        <nav className="vault-topbar-links">
        </nav>
        <div className="vault-topbar-tools">
          <Form.Control placeholder="Search Vault..." className="vault-search" readOnly />
          <Button variant="dark" size="sm" className="vault-logout" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="vault-frame">
        <aside className="vault-sidebar">
          <div className="vault-profile">
            <div className="vault-profile-avatar">A</div>
            <div>
              <strong>Academic Curator</strong>
              <span>Verified Member</span>
            </div>
          </div>

          <div className="vault-menu">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`vault-menu-item ${activeKey === item.key ? "is-active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="vault-content">
          {breadcrumb ? <div className="vault-breadcrumb">{breadcrumb}</div> : null}
          <div className="vault-page-header">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {actions ? <div className="vault-page-actions">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default VaultLayout;
