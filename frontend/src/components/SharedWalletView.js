import { useEffect, useState } from "react";
import { Container, Card, Row, Col, Badge, Navbar } from "react-bootstrap";
import API, { getAssetUrl, isPdfAsset } from "../utils/api";
import { useParams } from "react-router-dom";

function SharedWalletView() {
  const [badges, setBadges] = useState([]);
  const { userId } = useParams();

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
      <Navbar className="shared-navbar mb-4">
        <Container>
          <Navbar.Brand className="fw-bold">Skill Wallet Showcase</Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="pb-5">
        <section className="page-hero mb-4">
          <div>
            <span className="eyebrow">Shared Wallet</span>
            <h3 className="fw-bold mb-2">Verified Certifications</h3>
            <p className="page-hero-text mb-0">
              Public portfolio view for achievements and saved certifications.
            </p>
          </div>
        </section>

        {badges.length === 0 ? (
          <div className="empty-state text-center mt-4">
            <h4>This user hasn&apos;t added any badges yet.</h4>
            <p className="text-muted mb-0">Shared certifications will appear here when available.</p>
          </div>
        ) : (
          <Row className="g-4">
            {badges.map((b) => (
              <Col md={6} xl={4} key={b._id}>
                <Card className="badge-card h-100 border-0">
                  {b.imageUrl && (
                    isPdfAsset(b.imageUrl, b.fileType) ? (
                      <iframe
                        title={b.title}
                        src={getAssetUrl(b.imageUrl)}
                        className="badge-card-image"
                      />
                    ) : (
                      <Card.Img
                        variant="top"
                        src={getAssetUrl(b.imageUrl)}
                        className="badge-card-image"
                      />
                    )
                  )}
                  <Card.Body className="d-flex flex-column p-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <Badge bg="info" className="text-dark badge-chip">
                        {b.skill}
                      </Badge>
                      <span className="badge-date">{b.date}</span>
                    </div>
                    <Card.Title className="fw-bold text-dark mb-2">{b.title}</Card.Title>
                    <Card.Subtitle className="mb-3 text-muted badge-org">
                      Issued by {b.organization}
                    </Card.Subtitle>
                    <Card.Text className="text-secondary small badge-description">
                      Shared badge details presented in the same wallet style without changing the concept.
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

export default SharedWalletView;
