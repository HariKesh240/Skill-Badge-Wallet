import { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import API from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    await API.post("/register", { email, password });
    navigate("/");
  };

  return (
    <div className="auth-shell">
      <Container fluid className="auth-layout">
        <div className="auth-hero">
          <div className="auth-brand">The Academic Curator</div>
          <div className="auth-hero-copy">
            <h1>Curate Your Legacy From Day One.</h1>
            <p>
              Create your account to begin organizing certificates and verified
              accomplishments in one secure academic vault.
            </p>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Set up your access credentials to initialize your vault.</p>
            </div>

            <Form className="auth-form">
              <Form.Group className="mb-3">
                <Form.Label>Institutional Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@university.edu"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Secure Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>

              <Form.Check
                type="checkbox"
                className="auth-check"
                label="I understand this wallet stores my professional credentials."
              />

              <Button onClick={submit} className="w-100 auth-submit" variant="dark">
                Create Vault
              </Button>
            </Form>

            <p className="auth-footer">
              Already registered? <Link to="/">Sign in</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Register;
