# backend/Dockerfile
FROM node:20-bullseye-slim

WORKDIR /app

# Cài Python + pip
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

# Copy package.json trước để cache
COPY package*.json ./

RUN npm ci --only=production

# Copy python requirements
COPY python/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# Copy toàn bộ code (đây là dòng lỗi trước đó)
COPY . .

# Expose port
EXPOSE 3000

# Chạy cả Node và Python server
CMD ["sh", "-c", "python3 python/model_server.py & npm start"]