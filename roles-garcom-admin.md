# 🔐 Sistema de Roles — Garçom vs Admin

## Contexto

O GastroBi precisa de dois perfis distintos de acesso no painel do restaurante:

| Perfil | Descrição |
|--------|-----------|
| **Admin** (OWNER / MANAGER) | Dono ou gestor do restaurante — acesso total ao sistema |
| **Garçom** (WAITER) | Funcionário de atendimento — acesso limitado à operação |

---

## 📋 Permissões por Perfil

### Admin (OWNER / MANAGER)
- ✅ Dashboard (métricas, resumo)
- ✅ Clientes
- ✅ Fidelidade (brevemente)
- ✅ Campanhas (brevemente)
- ✅ Cardápio Digital
- ✅ QR Codes
- ✅ POS – Frente de Caixa
- ✅ Relatórios
- ✅ Configurações

### Garçom (WAITER)
- ✅ POS – Frente de Caixa (principal ferramenta)
- ✅ Cardápio Digital (consulta, para auxiliar o cliente)
- ✅ QR Codes (visualizar, compartilhar)
- ❌ Dashboard
- ❌ Clientes
- ❌ Fidelidade
- ❌ Campanhas
- ❌ Relatórios
- ❌ Configurações

---

## 🔧 O que falta na API (Backend)

### 1. Adicionar o role `WAITER` ao enum de roles

```prisma
enum UserRole {
  OWNER
  MANAGER
  STAFF
  WAITER   // <- NOVO
}
```

### 2. Endpoint de login deve retornar o campo `role` corretamente

O endpoint `POST /auth/login/restaurant` já retorna o `role`, mas precisa aceitar o novo valor `WAITER`.

**Response esperada (sem mudanças no formato, apenas novo valor possível):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "garcom@restaurante.com",
      "fullName": "Carlos Garçom",
      "type": "RESTAURANT",
      "role": "WAITER",
      "currentRestaurant": {
        "id": "uuid",
        "name": "Restaurante do João",
        "slug": "restaurante-do-joao"
      },
      "restaurants": [...]
    }
  }
}
```

### 3. Endpoint `GET /auth/me` deve retornar o role atualizado

Sem mudanças no formato — apenas garantir que o campo `role` inclua `WAITER`.

### 4. Middleware de autorização no backend (recomendado)

Proteger as rotas do backend para que um `WAITER` não consiga acessar endpoints administrativos:

| Rota | Roles permitidos |
|------|-----------------|
| `GET /orders`, `POST /orders`, `PATCH /orders/:id/status` | OWNER, MANAGER, WAITER |
| `GET /products`, `GET /categories` | OWNER, MANAGER, WAITER |
| `POST /products`, `PATCH /products`, `DELETE /products` | OWNER, MANAGER |
| `GET /tables`, `GET /tables/:id/qr-code` | OWNER, MANAGER, WAITER |
| `POST /tables`, `PATCH /tables`, `DELETE /tables` | OWNER, MANAGER |
| `GET /customers`, `POST /customers`, etc. | OWNER, MANAGER |
| `GET /orders/reports` | OWNER, MANAGER |
| `GET /dashboard/*` | OWNER, MANAGER |
| `*/settings/*` | OWNER, MANAGER |

### 5. Criar garçom via Admin (opcional, mas recomendado)

Endpoint para o OWNER/MANAGER criar contas de garçom:

```
POST /users/waiter
Body: { fullName, email, password, restaurantId }
Response: { user: { id, email, fullName, role: "WAITER", ... } }
```

---

## 🖥️ Implementação no Frontend

### AuthContext

- Expandir o tipo `User.role` para incluir `'WAITER'`
- Criar helper `isAdmin()` e `isWaiter()`
- Garçom logado é redirecionado para `/pos` (ao invés de `/dashboard`)

### Sidebar

- Filtragem dinâmica dos itens de navegação com base no `role`
- Admin vê todos os 9 itens
- Garçom vê apenas: POS, Cardápio Digital, QR Codes

### Route Guards

- Middleware de proteção nas páginas admin-only
- Redireciona garçom para `/pos` se tentar acessar rota proibida

### Header

- Exibe o role formatado ("Proprietário", "Gerente", "Garçom")
- Garçom não vê botão de trocar restaurante (apenas 1 restaurante)

---

## 📝 Resumo de Mudanças

| Camada | O que fazer |
|--------|------------|
| **Prisma/DB** | Adicionar `WAITER` ao enum `UserRole` |
| **Backend** | Aceitar `WAITER` no login, proteger rotas por role |
| **Frontend** | Role-based sidebar, route guards, redirect por perfil |

---

*Documento gerado para alinhamento entre frontend e backend.*
*Data: 09/02/2026*
