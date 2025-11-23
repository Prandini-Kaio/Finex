# Docker Setup - Finance Controller

Este documento explica como executar o projeto completo (backend, frontend e banco de dados) usando Docker.

## Pré-requisitos

- Docker Desktop instalado e rodando
- Docker Compose (geralmente incluído no Docker Desktop)

## Como executar

### 1. Subir todos os serviços

Na raiz do projeto, execute:

```bash
docker-compose up -d
```

Isso irá:
- Criar e iniciar o banco de dados PostgreSQL
- Construir e iniciar o backend (Spring Boot)
- Construir e iniciar o frontend (React/Vite com Nginx)

### 2. Acessar a aplicação

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

### 3. Ver logs

Para ver os logs de todos os serviços:
```bash
docker-compose logs -f
```

Para ver logs de um serviço específico:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 4. Parar os serviços

```bash
docker-compose down
```

Para parar e remover volumes (apaga dados do banco):
```bash
docker-compose down -v
```

## Reconstruir após mudanças no código

Se você fez alterações no código e precisa reconstruir as imagens:

```bash
docker-compose up -d --build
```

Ou para um serviço específico:
```bash
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

## Estrutura dos serviços

### Backend (Spring Boot)
- **Porta**: 8080
- **Banco de dados**: Conecta automaticamente ao PostgreSQL via rede Docker
- **Health check**: Aguarda o PostgreSQL estar pronto antes de iniciar

### Frontend (React/Vite)
- **Porta**: 80
- **Servidor**: Nginx servindo arquivos estáticos
- **API**: Detecta automaticamente o hostname e conecta ao backend na porta 8080

### PostgreSQL
- **Porta**: 5432
- **Database**: finance
- **User**: finance
- **Password**: finance
- **Volume**: Dados persistem em `postgres_data`

## Variáveis de ambiente

As configurações podem ser alteradas no arquivo `docker-compose.yml`:

### Backend
- `SPRING_DATASOURCE_URL`: URL de conexão com o banco
- `SPRING_DATASOURCE_USERNAME`: Usuário do banco
- `SPRING_DATASOURCE_PASSWORD`: Senha do banco
- `APP_CORS_ALLOW_ALL_ORIGINS`: Permite CORS de qualquer origem (true/false)

### Frontend
- `VITE_API_URL`: URL da API do backend (opcional, detecta automaticamente)

## Troubleshooting

### Backend não conecta ao banco
- Verifique se o PostgreSQL está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs postgres backend`

### Frontend não carrega
- Verifique se o container está rodando: `docker-compose ps`
- Verifique os logs: `docker-compose logs frontend`
- Acesse http://localhost:80 diretamente

### Erro de CORS
- Certifique-se de que `APP_CORS_ALLOW_ALL_ORIGINS=true` está configurado
- Reinicie o backend: `docker-compose restart backend`

### Limpar tudo e começar do zero
```bash
docker-compose down -v
docker-compose up -d --build
```

## Desenvolvimento

Para desenvolvimento local sem Docker, você ainda pode usar:
- Backend: `cd financecontroller && ./mvnw spring-boot:run`
- Frontend: `cd frontend && npm run dev`
- Banco: Use o `compose.yaml` dentro de `financecontroller/` ou o `docker-compose.yml` da raiz apenas para o postgres

