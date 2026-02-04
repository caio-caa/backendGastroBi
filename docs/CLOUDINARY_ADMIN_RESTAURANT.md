# Cloudinary - Admin de Restaurante(s)

Documentação das rotas de upload de imagens para gerenciamento de categorias, produtos e configurações do restaurante.

---

## Serviço de Upload Central

**Endpoint:** `POST /api/v1/uploads/image`

Antes de enviar imagens para outras rotas, faça upload neste endpoint.

**Query Parameters:**
- `folder` (optional): `products`, `categories`, `logos`, `covers`, `misc` (padrão)

**Request:**
```
Content-Type: multipart/form-data
file: <arquivo de imagem>
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/.../image.webp",
  "publicId": "gastrobi/products/abc123"
}
```

Use a `url` retornada nas rotas abaixo.

---

## 1. Categorias - Imagem

### POST `/api/v1/categories`

Criar nova categoria.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Bebidas",
  "image": "https://res.cloudinary.com/.../category.webp",
  "order": 1
}
```

**Response:**
```json
{
  "id": "cat-123",
  "restaurantId": "rest-456",
  "name": "Bebidas",
  "image": "https://res.cloudinary.com/.../category.webp",
  "order": 1,
  "isActive": true,
  "createdAt": "2026-02-04T05:30:00Z"
}
```

---

### PATCH `/api/v1/categories/:id`

Atualizar categoria (incluindo imagem).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Bebidas Premium",
  "image": "https://res.cloudinary.com/.../newcategory.webp",
  "order": 2
}
```

**Response:**
```json
{
  "id": "cat-123",
  "restaurantId": "rest-456",
  "name": "Bebidas Premium",
  "image": "https://res.cloudinary.com/.../newcategory.webp",
  "order": 2,
  "isActive": true,
  "updatedAt": "2026-02-04T06:00:00Z"
}
```

**Comportamento:**
- Imagem anterior é deletada do Cloudinary automaticamente
- DELETE de categoria remove a imagem

---

## 2. Produtos - Imagem

### POST `/api/v1/products`

Criar novo produto.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Coca-Cola 350ml",
  "image": "https://res.cloudinary.com/.../product.webp",
  "description": "Refrigerante gelado",
  "price": 8.50,
  "categoryId": "cat-123",
  "order": 1
}
```

**Response:**
```json
{
  "id": "prod-789",
  "restaurantId": "rest-456",
  "categoryId": "cat-123",
  "name": "Coca-Cola 350ml",
  "image": "https://res.cloudinary.com/.../product.webp",
  "description": "Refrigerante gelado",
  "price": 8.50,
  "isActive": true,
  "isAvailable": true,
  "order": 1,
  "createdAt": "2026-02-04T05:30:00Z"
}
```

---

### PATCH `/api/v1/products/:id`

Atualizar produto (incluindo imagem).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Coca-Cola 600ml",
  "image": "https://res.cloudinary.com/.../newproduct.webp",
  "price": 12.00
}
```

**Response:**
```json
{
  "id": "prod-789",
  "restaurantId": "rest-456",
  "categoryId": "cat-123",
  "name": "Coca-Cola 600ml",
  "image": "https://res.cloudinary.com/.../newproduct.webp",
  "price": 12.00,
  "isActive": true,
  "updatedAt": "2026-02-04T06:00:00Z"
}
```

**Comportamento:**
- Imagem anterior é deletada do Cloudinary automaticamente
- DELETE de produto remove a imagem

---

## 3. Configurações do Restaurante - Logo e Cover

### PATCH `/api/v1/settings/restaurant`

Atualizar configurações do restaurante (logo e cover image).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Meu Restaurante",
  "phone": "+5511987654321",
  "email": "contato@meurest.com",
  "address": "Rua Principal, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01310-100",
  "website": "https://meurestaurante.com",
  "description": "O melhor restaurante da cidade",
  "logo": "https://res.cloudinary.com/.../logo.webp",
  "coverImage": "https://res.cloudinary.com/.../cover.webp"
}
```

**Response:**
```json
{
  "id": "rest-456",
  "name": "Meu Restaurante",
  "cnpj": "12.345.678/0001-90",
  "phone": "+5511987654321",
  "email": "contato@meurest.com",
  "address": {
    "street": "Rua Principal, 123",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100",
    "website": "https://meurestaurante.com",
    "description": "O melhor restaurante da cidade",
    "logo": "https://res.cloudinary.com/.../logo.webp",
    "coverImage": "https://res.cloudinary.com/.../cover.webp"
  }
}
```

**Comportamento:**
- Logo e cover anteriores são deletados automaticamente
- Suporta atualizar apenas logo OU apenas cover
- Auditado em audit logs

---

## Fluxo Completo - Exemplo

### 1. Upload da imagem do produto
```bash
curl -X POST http://localhost:8000/api/v1/uploads/image?folder=products \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@coca-cola.png"

# Response
{
  "url": "https://res.cloudinary.com/.../product.webp",
  "publicId": "gastrobi/products/xyz789"
}
```

### 2. Criar produto com imagem
```bash
curl -X POST http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca-Cola 350ml",
    "image": "https://res.cloudinary.com/.../product.webp",
    "price": 8.50,
    "categoryId": "cat-123"
  }'
```

### 3. Atualizar com nova imagem
```bash
curl -X PATCH http://localhost:8000/api/v1/products/prod-789 \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image": "https://res.cloudinary.com/.../newproduct.webp"
  }'

# Imagem anterior é deletada automaticamente
```

---

## Especificações

- **Formato:** Convertido para WebP (otimizado)
- **Tamanho Máximo:** 5MB
- **Redimensionamento:** Até 1200x1200px
- **Validação:** image/webp, image/jpeg, image/png, image/gif

---

## Organização no Cloudinary

```
gastrobi/
├── products/   → Imagens de produtos
├── categories/ → Imagens de categorias
├── logos/      → Logos do restaurante
├── covers/     → Imagens de capa
└── misc/       → Outros uploads
```

---

## Auto-Delete Automático

✅ Ao atualizar categoria/produto com nova imagem → imagem antiga deletada  
✅ Ao deletar categoria/produto → imagem removida do Cloudinary  
✅ Sem necessidade de ação manual  
✅ Audit trail registra todas as mudanças
