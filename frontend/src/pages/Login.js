import { useState } from "react";
import { Container, Form, Button, Card, FloatingLabel } from "react-bootstrap";
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
      navigate("/dashboard");
    } catch (err) { alert("Invalid Credentials"); }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <Card className="p-4 shadow-lg border-0" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">Welcome Back</h2>
          <p className="text-muted">Sign in to manage your badges</p>
        </div>

        <Form onSubmit={submit}>
          <FloatingLabel label="Email address" className="mb-3">
            <Form.Control type="email" placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} required />
          </FloatingLabel>

          <FloatingLabel label="Password" title="Password" className="mb-4">
            <Form.Control type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
          </FloatingLabel>

          <Button variant="primary" type="submit" className="w-100 py-2 fw-bold shadow-sm">
            Sign In
          </Button>
        </Form>

        <p className="mt-4 text-center small">
          New user? <Link to="/register" className="text-decoration-none fw-bold">Create account</Link>
        </p>
      </Card>
    </Container>
  );
}

export default Login;