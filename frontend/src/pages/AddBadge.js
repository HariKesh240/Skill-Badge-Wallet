import { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import API from "../utils/api";
import NavbarComp from "../components/NavbarComp";
import { useNavigate } from "react-router-dom";

function AddBadge() {
  const [data, setData] = useState({});
  const [image, setImage] = useState(null); // New state for Image
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    
    // We must use FormData when uploading files
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("skill", data.skill);
    formData.append("organization", data.organization);
    formData.append("date", data.date);
    if (image) formData.append("image", image);

    await API.post("/badge", formData);
    navigate("/dashboard");
  };

  return (
    <>
      <NavbarComp />
      <Container className="d-flex justify-content-center mt-5">
        <Card className="p-4 shadow-sm border-0" style={{ maxWidth: "600px", width: "100%" }}>
          <h3 className="fw-bold mb-4 text-center">Add New Skill Badge</h3>
          <Form onSubmit={submit}>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Badge Title</Form.Label>
                  <Form.Control placeholder="e.g. AWS Certified Solutions Architect"
                    onChange={(e) => setData({ ...data, title: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Skill Category</Form.Label>
                  <Form.Control placeholder="e.g. Cloud Computing"
                    onChange={(e) => setData({ ...data, skill: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Organization</Form.Label>
                  <Form.Control placeholder="e.g. Amazon"
                    onChange={(e) => setData({ ...data, organization: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Issue Date</Form.Label>
                  <Form.Control type="date"
                    onChange={(e) => setData({ ...data, date: e.target.value })} required />
                </Form.Group>
              </Col>
              {/* NEW FILE INPUT */}
              <Col md={6}>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">Upload Certificate</Form.Label>
                  <Form.Control type="file" accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])} />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" size="lg">Save Badge</Button>
              <Button variant="light" onClick={() => navigate("/dashboard")}>Cancel</Button>
            </div>
          </Form>
        </Card>
      </Container>
    </>
  );
}

export default AddBadge;