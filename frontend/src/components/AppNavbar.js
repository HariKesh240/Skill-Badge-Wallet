import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

function AppNavbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Navbar bg="white" expand="lg" className="app-navbar mb-4" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="text-primary fw-bold">
          <span className="me-2">BadgeWallet</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-lg-center nav-actions">
            <Nav.Link onClick={() => navigate("/dashboard")} className="fw-semibold">
              Dashboard
            </Nav.Link>
            <Nav.Link onClick={() => navigate("/add")} className="fw-semibold">
              Add Badge
            </Nav.Link>
            <Button variant="outline-danger" size="sm" onClick={logout} className="rounded-pill px-3">
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
