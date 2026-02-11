import { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    await API.post("/register", { email, password });
    navigate("/");
  };

  return (
    <Container className="mt-5">
      <Card className="p-4">
        <h3>Register</h3>
        <Form>
          <Form.Control
            className="mb-3"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Form.Control
            className="mb-3"
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={submit}>Register</Button>
        </Form>
      </Card>
    </Container>
  );
}

export default Register;
