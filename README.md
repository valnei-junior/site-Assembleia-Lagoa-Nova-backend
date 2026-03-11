# Site Assembleia Lagoa Nova - Backend

API Node.js/Express com autenticação JWT, controle de acesso por perfil, departamentos, eventos e upload de mídia.

## Stack
- Node.js
- Express
- Sequelize
- PostgreSQL
- Multer
- Sharp
- FFmpeg (fluent-ffmpeg + ffmpeg-static)
- JWT

## Estrutura
- controllers
- routes
- models
- middleware
- config
- services
- uploads
- utils
- server.js
- app.js

## Instalação
1. npm install
2. Copie .env.example para .env e ajuste variáveis
3. npm run db:migrate
4. npm run db:seed
5. npm run dev

## Variáveis de Ambiente (.env)
- PORT=5000
- FRONTEND_URL=http://localhost:5173
- NODE_ENV=development
- DATABASE_URL=postgres://postgres:postgres@localhost:5432/ad_lagoa_nova
- JWT_ACCESS_SECRET=...
- JWT_REFRESH_SECRET=...

## Scripts
- npm run dev
- npm run start
- npm run db:migrate
- npm run db:seed

## Endpoints Principais
- GET /health
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- GET /api/v1/auth/me
- GET /api/v1/departments
- POST /api/v1/departments
- GET /api/v1/departments/:departmentId/events
- POST /api/v1/departments/:departmentId/events/:eventId/videos
- POST /api/v1/uploads/video
- POST /api/v1/media/upload
- GET /api/video/:name
- GET /api/v1/video/:name
- GET /video/:name
- GET /api/v1/media/video/:name
- GET /api/v1/media/image/:name
- GET /api/v1/media/thumbnail/:name
- GET /uploads/videos/:filename
- GET /uploads/images/:filename

## Observações
- Upload de vídeo configurado para até 80MB por arquivo.
- CORS em desenvolvimento aceita localhost/127.0.0.1 com porta dinâmica.
- Streaming de vídeo usa Range Requests (206 Partial Content).
- Imagens são otimizadas automaticamente com Sharp.
- Vídeos podem gerar thumbnail automaticamente com FFmpeg.
