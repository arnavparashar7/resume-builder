FROM node:22-bookworm

WORKDIR /app

ENV PORT=3000
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"

COPY package*.json ./

RUN npm ci

RUN npx playwright install chromium --with-deps

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

RUN mkdir -p /data

CMD npx prisma db push && npm run start