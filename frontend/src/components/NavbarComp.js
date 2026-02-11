import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

function NavbarComp() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="text-primary">
          <span className="me-2">🎖️</span>BadgeWallet
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link onClick={() => navigate("/dashboard")} className="fw-semibold">Dashboard</Nav.Link>
            <Nav.Link onClick={() => navigate("/add")} className="fw-semibold me-3">Add Badge</Nav.Link>
            <Button variant="outline-danger" size="sm" onClick={logout} className="rounded-pill px-3">
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComp;