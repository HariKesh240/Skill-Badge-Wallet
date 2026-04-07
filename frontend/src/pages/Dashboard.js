import { useEffect, useState } from "react";
import { Container, Card, Button, Row, Col, Badge } from "react-bootstrap";
import API, { getAssetUrl, isPdfAsset } from "../utils/api";
import VaultLayout from "../components/VaultLayout";

function Dashboard() {
  const[badges, setBadges] = useState([]);

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

  // Share functionality
  const shareWallet = () => {
    const userId = localStorage.getItem("userId");
    const shareUrl = `${window.location.origin}/shared/${userId}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Shareable link copied to clipboard!");
  };

  useEffect(() => { loadBadges(); },[]);

  return (
    <VaultLayout
      activeKey="vault"
      title="My Vault"
      subtitle={`Managing ${badges.length} Verified Professional Credentials`}
      actions={
        <div className="vault-toolbar">
          <div className="vault-filter-pills">
            <button type="button" className="is-active">All Badges</button>
          </div>
          <Button variant="outline-dark" className="vault-share-button" onClick={shareWallet}>
            Share Wallet
          </Button>
        </div>
      }
    >
      <Container fluid className="p-0">
        {badges.length === 0 ? (
          <div className="vault-empty-state">
            <h4>No badges found. Start adding your skills!</h4>
            <p>Your saved certifications will appear here in your credential grid.</p>
          </div>
        ) : (
          <Row className="g-4">
            {badges.map((b) => (
              <Col md={6} xl={4} key={b._id}>
                <Card className="vault-badge-card h-100">
                  <div className="vault-badge-card-top">
                    {b.imageUrl ? (
                      isPdfAsset(b.imageUrl, b.fileType) ? (
                        <iframe
                          title={b.title}
                          src={getAssetUrl(b.imageUrl)}
                          className="vault-badge-media"
                        />
                      ) : (
                        <Card.Img
                          variant="top"
                          src={getAssetUrl(b.imageUrl)}
                          className="vault-badge-media"
                        />
                      )
                    ) : (
                      <div className="vault-badge-media vault-badge-media-placeholder">{b.skill?.slice(0, 1) || "B"}</div>
                    )}
                    <Badge className="vault-verified-badge">Verified</Badge>
                  </div>
                  <Card.Body className="vault-badge-body">
                    <Card.Title>{b.title}</Card.Title>
                    <Card.Text className="vault-badge-skill">{b.skill}</Card.Text>
                    <div className="vault-badge-meta">
                      <div>
                        <span>Issuing Authority</span>
                        <strong>{b.organization}</strong>
                      </div>
                      <div>
                        <span>Date Earned</span>
                        <strong>{b.date}</strong>
                      </div>
                    </div>
                    <Button variant="link" className="vault-remove-link" onClick={() => remove(b._id)}>
                      Remove Badge
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </VaultLayout>
  );
}

export default Dashboard;
