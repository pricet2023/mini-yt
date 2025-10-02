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
- **Dev:** Docker Compose for local stack

---

## 🐳 Running with Docker Compose

1. **Clone the repo**
    ```bash
    git clone https://github.com/pricet2023/mini-yt.git
    cd mini-yt

2. **Create .env**
- Change or copy env.example to .env

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
- **Frontend:**: http{NEXT_PUBLIC_API_HOST}:3000

- **MinIO Console**: http://{NEXT_PUBLIC_API_HOST}:9001

- **Elasticsearch**: http://{NEXT_PUBLIC_API_HOST}:9200

- **Postgres**: http://{NEXT_PUBLIC_API_HOST}:5432 (username/password in .env)