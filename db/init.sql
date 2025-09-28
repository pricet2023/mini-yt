CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
  status TEXT DEFAULT 'uploading'
);
