import { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import VaultLayout from "../components/VaultLayout";

function AddBadge() {
  const [data, setData] = useState({});
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("skill", data.skill);
    formData.append("organization", data.organization);
    formData.append("date", data.date);
    if (image) formData.append("image", image);

    try {
      await API.post("/badge", formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Upload failed. Please try again.");
    }
  };

  return (
    <VaultLayout
      activeKey="add"
      title="Curate Your Legacy."
      subtitle="Upload and verify your professional milestones. Your encrypted vault ensures your achievements are recognized globally."
      breadcrumb="Vault > New Credential"
    >
      <Container fluid className="p-0">
            <Card className="vault-form-card">
              <Form onSubmit={submit}>
                <div className="vault-upload-box">
                  <div className="vault-upload-icon">+</div>
                  <strong>Drag and drop certificate</strong>
                  <span>Upload a certificate image or PDF. Images use local OCR, and PDFs are checked locally.</span>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => setImage(e.target.files[0])}
                    required
                  />
                </div>
                <p className="vault-upload-note">
                  Only certificate-like uploads receive a verified badge.
                </p>
                {error && <p className="text-danger mt-3 mb-0">{error}</p>}

                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Certificate Name</Form.Label>
                      <Form.Control
                        placeholder="e.g. Senior Architecture Specialist"
                        onChange={(e) => setData({ ...data, title: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Issuing Authority</Form.Label>
                      <Form.Control
                        placeholder="e.g. Stanford Online"
                        onChange={(e) => setData({ ...data, organization: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Credential Category</Form.Label>
                      <Form.Control
                        placeholder="e.g. Information Security"
                        onChange={(e) => setData({ ...data, skill: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Date Earned</Form.Label>
                      <Form.Control
                        type="date"
                        onChange={(e) => setData({ ...data, date: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="vault-form-actions">
                  <Button variant="dark" type="submit" className="vault-primary-button">
                    Verify & Save
                  </Button>
                  <Button variant="light" onClick={() => navigate("/dashboard")} className="vault-secondary-button">
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card>
          
      </Container>
    </VaultLayout>
  );
}

export default AddBadge;
