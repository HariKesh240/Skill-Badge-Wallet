import { useEffect, useState } from "react";
import { Container, Card, Row, Col, Badge, Navbar } from "react-bootstrap";
import API from "../utils/api";
import { useParams } from "react-router-dom";

function SharedWallet() {
  const [badges, setBadges] = useState([]);
  const { userId } = useParams(); // Retrieves the userId from the URL

  useEffect(() => {
    const loadSharedBadges = async () => {
      try {
        const res = await API.get(`/shared/${userId}`);
        setBadges(res.data);
      } catch (err) { 
        console.error(err); 
      }
    };
    loadSharedBadges();
  }, [userId]);

  return (
    <>
      <Navbar bg="primary" variant="dark" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand className="fw-bold">
            <span className="me-2">🎖️</span> Skill Wallet Showcase
          </Navbar.Brand>
        </Container>
      </Navbar>
      
      <Container>
        <h3 className="fw-bold text-center mb-4">Verified Certifications</h3>

        {badges.length === 0 ? (
          <div className="text-center mt-5 p-5 bg-white rounded shadow-sm">
            <h4 className="text-muted">This user hasn't added any badges yet.</h4>
          </div>
        ) : (
          <Row>
            {badges.map((b) => (
              <Col md={4} key={b._id} className="mb-4">
                <Card className="h-100 shadow-sm border-0">
                  {b.imageUrl && (
                    <Card.Img 
                      variant="top" 
                      src={`http://localhost:5000${b.imageUrl}`} 
                      style={{ height: '200px', objectFit: 'cover' }} 
                    />
                  )}
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

export default SharedWallet;