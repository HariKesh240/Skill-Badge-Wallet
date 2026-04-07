import { useState } from "react";
import { Container, Form, Button } from "react-bootstrap";
import API from "../utils/api";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  return (
    <div className="auth-shell">
      <Container fluid className="auth-layout">
        <div className="auth-hero">
          <div className="auth-brand">The Academic Curator</div>
          <div className="auth-hero-copy">
            <h1>Your Legacy, Securely Archived.</h1>
            <p>
              Access your verified institutional achievements and professional
              credentials in your high-density digital vault.
            </p>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-header">
              <h2>Sign In</h2>
              <p>Enter your credentials to unlock your vault.</p>
            </div>

            <Form onSubmit={submit} className="auth-form">
              <Form.Group className="mb-3">
                <Form.Label>Institutional Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@university.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <div className="auth-row">
                <Form.Label className="mb-2">Secure Password</Form.Label>
                <button type="button" className="auth-inline-link">Forgot?</button>
              </div>
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Check
                type="checkbox"
                className="auth-check"
                label="Keep session active for 30 days"
              />

              <Button variant="dark" type="submit" className="w-100 auth-submit">
                Unlock Vault
              </Button>
            </Form>

            <p className="auth-footer">
              New user? <Link to="/register">Create account</Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Login;
