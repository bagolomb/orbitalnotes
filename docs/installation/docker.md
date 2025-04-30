Dockerized Setup (Cross-platform & Portable)

Create these two files:

### `Dockerfile`

```Dockerfile
# Use official Python image
FROM python:3.11-slim

# Install Node.js & npm
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create app directories
WORKDIR /app

# Backend setup
COPY backend/ backend/
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Frontend setup
WORKDIR /app/frontend
COPY frontend/ frontend/
RUN npm install

# Expose frontend and backend ports
EXPOSE 8000 5173

# Run backend and frontend (use `docker-compose` for both in real use)
CMD ["bash"]
```

### `docker-compose.yml`

```yaml
version: "3.8"
services:
  backend:
    build: .
    working_dir: /app/backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app/backend
    ports:
      - "8000:8000"

  frontend:
    build: .
    working_dir: /app/frontend
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app/frontend
    ports:
      - "5173:5173"
```

Then run:

```bash
docker-compose up --build
```
