# Integração Cloudinary - Gerenciamento de Imagens

## Visão Geral

Todas as imagens da aplicação são agora hospedadas no Cloudinary. Quando uma imagem é atualizada ou um recurso é deletado, a imagem antiga é automaticamente removida do Cloudinary.

---

## Serviço Central

**Arquivo:** `src/common/cloudinary/cloudinary.service.ts`

- `upload(file, folder)`: Upload para Cloudinary com organização por pasta
- `delete(publicId)`: Deleta imagem do Cloudinary
- `extractPublicId(url)`: Extrai ID público da URL para limpeza

---

## Rotas de Upload

### POST `/api/v1/uploads/image`

Upload de arquivo único para Cloudinary.

**Query Parameters:**
- `folder` (optional): Organizar em pasta - valores: `products`, `categories`, `avatars`, `logos`, `covers`, `misc` (padrão)

**Request:**
```
Content-Type: multipart/form-data
file: <arquivo>
```

**Response:**
```json
{
  "url": "https://res.cloudinary.com/.../image.webp",
  "publicId": "gastrobi/categories/abc123"
}
```

---

## Rotas Afetadas - Admin da Plataforma

### 1. Usuários - Avatar

#### PATCH `/api/v1/admin/users/:id`
Atualizar avatar do usuário.

**Body:**
```json
{
  "avatar": "https://res.cloudinary.com/.../avatar.webp"
}
```

**Autenticação:** JWT (Admin)

**Comportamento:**
- Se houver avatar anterior, é deletado do Cloudinary automaticamente
- Nova imagem salva na base de dados

---

### 2. Restaurantes - Logo e Cover

#### PATCH `/api/v1/admin/restaurants/:id`
Atualizar informações do restaurante, incluindo logo e cover.

**Body:**
```json
{
  "name": "Nome do Restaurante",
  "settings": {
    "logo": "https://res.cloudinary.com/.../logo.webp",
    "cover": "https://res.cloudinary.com/.../cover.webp"
  }
}
```

**Autenticação:** JWT (Admin)

**Comportamento:**
- Se houver imagens anteriores, são deletadas do Cloudinary automaticamente
- DELETE de restaurante remove todas as imagens

---

### 3. White Label - Logo e Favicon

#### POST `/api/v1/admin/white-label`
Criar configuração white label.

**Body:**
```json
{
  "clientName": "Cliente",
  "brandName": "Marca",
  "domain": "marca.com",
  "logo": "https://res.cloudinary.com/.../logo.webp",
  "favicon": "https://res.cloudinary.com/.../favicon.webp"
}
```

#### PATCH `/api/v1/admin/white-label/:id`
Atualizar configuração white label.

**Body:**
```json
{
  "logo": "https://res.cloudinary.com/.../newlogo.webp",
  "favicon": "https://res.cloudinary.com/.../newfavicon.webp"
}
```

**Autenticação:** JWT (Admin)

**Comportamento:**
- Imagens anteriores são deletadas automaticamente
- DELETE remove logo e favicon

---

## Rotas Afetadas - Admin de Restaurante

### 1. Categorias - Imagem

#### POST `/api/v1/categories`
Criar categoria.

**Body:**
```json
{
  "name": "Bebidas",
  "image": "https://res.cloudinary.com/.../category.webp",
  "order": 1
}
```

#### PATCH `/api/v1/categories/:id`
Atualizar categoria.

**Body:**
```json
{
  "image": "https://res.cloudinary.com/.../newcategory.webp"
}
```

**Autenticação:** JWT (Restaurant)

**Comportamento:**
- Imagem anterior deletada do Cloudinary ao atualizar
- DELETE de categoria remove imagem

---

### 2. Produtos - Imagem

#### POST `/api/v1/products`
Criar produto.

**Body:**
```json
{
  "name": "Coca-Cola 350ml",
  "image": "https://res.cloudinary.com/.../product.webp",
  "price": 8.50,
  "categoryId": "cat-123"
}
```

#### PATCH `/api/v1/products/:id`
Atualizar produto.

**Body:**
```json
{
  "image": "https://res.cloudinary.com/.../newproduct.webp"
}
```

**Autenticação:** JWT (Restaurant)

**Comportamento:**
- Imagem anterior deletada do Cloudinary ao atualizar
- DELETE de produto remove imagem

---

### 3. Configurações - Logo e Cover

#### PATCH `/api/v1/settings/restaurant`
Atualizar configurações do restaurante (logo e cover image).

**Body:**
```json
{
  "logo": "https://res.cloudinary.com/.../logo.webp",
  "coverImage": "https://res.cloudinary.com/.../cover.webp"
}
```

**Autenticação:** JWT (Restaurant)

**Comportamento:**
- Imagens anteriores deletadas automaticamente
- Suporta atualizar apenas logo OU apenas cover

---

## Fluxo de Implementação Frontend

### 1. Upload da Imagem

```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/v1/uploads/image?folder=products', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { url, publicId } = await response.json();
// url é pronto para ser salvo no banco e exibido
```

### 2. Enviar para Endpoint

```javascript
// Exemplo: Atualizar produto
await fetch(`/api/v1/products/${productId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Novo Nome',
    image: url // URL retornada do upload
  })
});
```

---

## Especificações de Imagem

- **Conversão:** Todas convertidas para WebP (otimizado)
- **Redimensionamento:** Máximo 1200x1200px
- **Tamanho Máximo:** 5MB
- **Validação:** MIME type (imagem/webp, imagem/jpeg, imagem/png, imagem/gif)

---

## Organização Cloudinary

Imagens organizadas por pasta:

```
gastrobi/
├── products/      → Imagens de produtos
├── categories/    → Imagens de categorias
├── avatars/       → Avatares de usuários
├── logos/         → Logos de restaurantes e white label
├── covers/        → Imagens de capa
└── misc/          → Outros uploads
```

---

## Notas Importantes

✅ **Auto-Delete:** Ao atualizar ou deletar um recurso, imagens anteriores são removidas automaticamente

✅ **Audit Trail:** Todas as mudanças registradas em audit logs

✅ **CDN Global:** URLs servidas por CDN global do Cloudinary (rápido em qualquer localização)

✅ **Sem Sincronização Manual:** Backend gerencia limpeza automaticamente
