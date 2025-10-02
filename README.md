# Mini YouTube Clone 🎥

This is a full-stack project built with **Next.js**, **PostgreSQL**, **MinIO (S3-compatible storage)**, and **Elasticsearch**.  
The goal is to replicate the core features of a video-sharing platform:
- Uploading videos
- Searching videos by title/description
- Watching videos via streaming directly from object storage
- Managing metadata in a relational database
- Using background jobs for large file uploads

---

## 🚀 Features

- **Frontend:** Next.js (React, TypeScript, TailwindCSS)
- **Backend:** Next.js App Router API routes
- **Database:** PostgreSQL (Prisma ORM)
- **Storage:** MinIO (S3-compatible) with presigned URL uploads
- **Search:** Elasticsearch for full-text indexing
- **Monitoring/Dev:** Docker Compose for local stack, Grafana + OpenTelemetry (optional)

---

## 🗂 API

## 🐳 Running with Docker Compose

1. **Clone the repo**
    ```bash
    git clone https://github.com/<your-repo>.git
    cd <your-repo>

2. **Create .env**
    Change or copy env.example to .env

3. **Start services**
    ```bash
    docker-compose up --build
    ```
    This brings up:

    frontend → Next.js app

    postgres → Metadata database

    minio → Object storage

    elasticsearch → Search indexing

    apache → Reverse proxy to MinIO (fixes Host header for presigned URLs)

4. **Access services**
    - **Frontend:**: http{PUBLIC_URL}:3000

    - **MinIO Console**: http://{PUBLIC_URL}:9001

    - **Elasticsearch**: http://{PUBLIC_URL}:9200

    - **Postgres**: http://{PUBLIC_URL}:5432 (username/password in .env)