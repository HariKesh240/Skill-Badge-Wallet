import { useEffect, useState } from "react";
import { Container, Card, Button, Row, Col, Badge } from "react-bootstrap";
import API from "../utils/api";
import NavbarComp from "../components/NavbarComp";

function Dashboard() {
  const [badges, setBadges] = useState([]);

  const loadBadges = async () => {
    try {
      const res = await API.get("/badge");
      setBadges(res.data);
    } catch (err) { console.error(err); }
  };

  const remove = async (id) => {
    if (window.confirm("Delete this badge?")) {
      await API.delete(`/badge/${id}`);
      loadBadges();
    }
  };

  useEffect(() => { loadBadges(); }, []);

  return (
    <>
      <NavbarComp />
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Your Skill Badges</h2>
          <Badge bg="primary" pill>{badges.length} Total</Badge>
        </div>

        {badges.length === 0 ? (
          <div className="text-center mt-5 p-5 bg-white rounded shadow-sm">
            <h4 className="text-muted">No badges found. Start adding your skills!</h4>
          </div>
        ) : (
          <Row>
            {badges.map((b) => (
              <Col md={4} key={b._id} className="mb-4">
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body className="d-flex flex-column">
                    <div className="text-end mb-2">
                      <Badge bg="info" className="text-dark">{b.skill}</Badge>
                    </div>
                    <Card.Title className="fw-bold text-dark">{b.title}</Card.Title>
                    <Card.Subtitle className="mb-3 text-muted">
                      Issued by: {b.organization}
                    </Card.Subtitle>
                    <Card.Text className="text-secondary small">
                      <i className="bi bi-calendar-event me-2"></i>Date: {b.date}
                    </Card.Text>
                    <div className="mt-auto pt-3 border-top">
                      <Button variant="link" className="text-danger p-0 text-decoration-none" onClick={() => remove(b._id)}>
                        Remove Badge
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}

export default Dashboard;