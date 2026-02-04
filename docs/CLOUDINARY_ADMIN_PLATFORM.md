# Cloudinary - Admin da Plataforma

Documentação das rotas de upload de imagens para gerenciamento de usuários, restaurantes e white label.

---

## Serviço de Upload Central

**Endpoint:** `POST /api/v1/uploads/image`

Antes de enviar imagens para outras rotas, faça upload neste endpoint.

**Query Parameters:**
- `folder` (optional): `avatars`, `logos`, `covers`, `misc` (padrão)

**Request:**
```
Content-Type: multipart/form-data
file: <arquivo de imagem>
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/.../image.webp",
  "publicId": "gastrobi/avatars/abc123"
}
```

Use a `url` retornada nas rotas abaixo.

---

## 1. Usuários - Avatar

### PATCH `/api/v1/admin/users/:id`

Atualizar avatar de um usuário.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "fullName": "João Silva",
  "avatar": "https://res.cloudinary.com/.../avatar.webp"
}
```

**Response:**
```json
{
  "id": "user-123",
  "email": "joao@example.com",
  "fullName": "João Silva",
  "avatar": "https://res.cloudinary.com/.../avatar.webp",
  "type": "ADMIN",
  "isActive": true,
  "createdAt": "2026-01-15T10:30:00Z"
}
```

**Comportamento:**
- Avatar anterior é deletado do Cloudinary automaticamente
- Auditado em audit logs

---

## 2. Restaurantes - Logo e Cover

### PATCH `/api/v1/admin/restaurants/:id`

Atualizar informações do restaurante, incluindo logo e cover.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Restaurante Delícia",
  "phone": "+5511999999999",
  "email": "contato@delicia.com",
  "settings": {
    "logo": "https://res.cloudinary.com/.../logo.webp",
    "cover": "https://res.cloudinary.com/.../cover.webp"
  }
}
```

**Response:**
```json
{
  "id": "rest-123",
  "name": "Restaurante Delícia",
  "slug": "restaurante-delicia",
  "phone": "+5511999999999",
  "email": "contato@delicia.com",
  "settings": {
    "logo": "https://res.cloudinary.com/.../logo.webp",
    "cover": "https://res.cloudinary.com/.../cover.webp"
  }
}
```

**Comportamento:**
- Imagens anteriores são deletadas do Cloudinary
- DELETE de restaurante remove todas as imagens

---

## 3. White Label - Logo e Favicon

### POST `/api/v1/admin/white-label`

Criar nova configuração white label.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "clientName": "Marca Premium",
  "brandName": "Premium Restaurant",
  "domain": "premium.com",
  "logo": "https://res.cloudinary.com/.../logo.webp",
  "favicon": "https://res.cloudinary.com/.../favicon.webp",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#1e40af"
}
```

**Response:**
```json
{
  "id": "wl-123",
  "clientName": "Marca Premium",
  "brandName": "Premium Restaurant",
  "domain": "premium.com",
  "logo": "https://res.cloudinary.com/.../logo.webp",
  "favicon": "https://res.cloudinary.com/.../favicon.webp",
  "primaryColor": "#3b82f6",
  "createdAt": "2026-02-04T05:30:00Z"
}
```

---

### PATCH `/api/v1/admin/white-label/:id`

Atualizar configuração white label.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "brandName": "Premium Restaurant V2",
  "logo": "https://res.cloudinary.com/.../newlogo.webp",
  "favicon": "https://res.cloudinary.com/.../newfavicon.webp",
  "primaryColor": "#ff6b6b"
}
```

**Response:**
```json
{
  "id": "wl-123",
  "clientName": "Marca Premium",
  "brandName": "Premium Restaurant V2",
  "logo": "https://res.cloudinary.com/.../newlogo.webp",
  "favicon": "https://res.cloudinary.com/.../newfavicon.webp",
  "primaryColor": "#ff6b6b"
}
```

**Comportamento:**
- Logo e favicon anteriores são deletados automaticamente
- DELETE remove todas as imagens associadas

---

## Fluxo Completo - Exemplo

### 1. Upload da imagem
```bash
curl -X POST http://localhost:8000/api/v1/uploads/image?folder=logos \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@logo.png"

# Response
{
  "url": "https://res.cloudinary.com/.../logo.webp",
  "publicId": "gastrobi/logos/abc123"
}
```

### 2. Usar a URL em create/update
```bash
curl -X PATCH http://localhost:8000/api/v1/admin/users/user-123 \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "avatar": "https://res.cloudinary.com/.../logo.webp"
  }'
```

---

## Especificações

- **Formato:** Convertido para WebP
- **Tamanho Máximo:** 5MB
- **Redimensionamento:** Até 1200x1200px
- **Validação:** image/webp, image/jpeg, image/png, image/gif

---

## Organização no Cloudinary

```
gastrobi/
├── avatars/   → Avatares de usuários
├── logos/     → Logos de restaurantes e white label
├── covers/    → Imagens de capa
└── misc/      → Outros uploads
```
