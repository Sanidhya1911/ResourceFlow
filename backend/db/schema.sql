CREATE TABLE users (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  email     VARCHAR(150) UNIQUE NOT NULL,
  password  VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE resources (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  category    VARCHAR(50) NOT NULL,
  type        VARCHAR(10) NOT NULL,
  latitude    DECIMAL(9,6) NOT NULL,
  longitude   DECIMAL(9,6) NOT NULL,
  expiry_at   TIMESTAMP NOT NULL,
  is_matched  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
  id          SERIAL PRIMARY KEY,
  offer_id    INTEGER REFERENCES resources(id),
  request_id  INTEGER REFERENCES resources(id),
  score       DECIMAL(5,4),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_expiry ON resources(expiry_at);