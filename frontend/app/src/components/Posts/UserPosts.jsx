import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const getImageUrl = (image) => {
  if (!image) return "https://via.placeholder.com/300";
  if (/^https?:\/\//i.test(image)) return image;

  const normalizedImage = image.replace(/\\/g, "/");
  const uploadsIndex = normalizedImage.indexOf("/uploads/");
  const uploadPath = uploadsIndex >= 0
    ? normalizedImage.slice(uploadsIndex)
    : `/${normalizedImage.replace(/^\//, "")}`;

  return  `https://social-media-backend-fwgu.onrender.com${uploadPath}`;
};

function UserPosts({ posts }) {
  return (
    <Row className="g-2">
      {posts?.map((post) => (
        <Col key={post._id} xs={4}>
          <Card>
            <Link to={`/posts/${post._id}`}>
              <Card.Img
                variant="top"
                src={getImageUrl(post.image)}
                alt="Post image"
                className="img-fluid"
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "cover",
                }}
              />
            </Link>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default UserPosts;
