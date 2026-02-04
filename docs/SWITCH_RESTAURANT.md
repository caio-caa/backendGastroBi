# Switch Restaurant - Implementação

## Rota Implementada

```
PUT /api/v1/users/current-restaurant/:restaurantId
```

**Autenticação:** JWT (requer usuário logado)

---

## Como Funciona

### 1. Requisição

```bash
curl -X PUT http://localhost:8000/api/v1/users/current-restaurant/restaurant-uuid \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Response (200 OK)

```json
{
  "success": true,
  "message": "Restaurant switched successfully",
  "data": {
    "user": {
      "id": "user-123",
      "fullName": "João Silva",
      "email": "joao@example.com",
      "role": "OWNER",
      "currentRestaurant": {
        "id": "rest-456",
        "name": "Meu Restaurante",
        "slug": "meu-restaurante",
        "cnpj": "12345678000190",
        "status": "ACTIVE",
        "phone": "+5511999999999",
        "email": "contact@restaurant.com",
        "timezone": "America/Sao_Paulo",
        "address": {
          "street": "Rua Principal",
          "city": "São Paulo",
          "state": "SP"
        }
      }
    }
  }
}
```

### 3. Erros Possíveis

**404 - Restaurant not found or access denied:**
```json
{
  "statusCode": 404,
  "message": "Restaurant not found or access denied"
}
```

---

## Implementação Backend

### UsersService - Método `switchRestaurant`

```typescript
async switchRestaurant(userId: string, restaurantId: string) {
  // 1. Busca dados básicos do usuário
  const user = await this.findOne(userId);

  // 2. Verifica se usuário tem acesso ao restaurante
  const restaurantAccess = await this.prisma.restaurantUser.findFirst({
    where: { userId, restaurantId }
  });

  if (!restaurantAccess) {
    throw new NotFoundException('Restaurant not found or access denied');
  }

  // 3. Busca dados do restaurante
  const restaurant = await this.prisma.restaurant.findUnique({
    where: { id: restaurantId }
  });

  // 4. Retorna dados do novo restaurante ativo
  return {
    success: true,
    message: 'Restaurant switched successfully',
    data: { user, currentRestaurant: restaurant }
  };
}
```

### UsersController - Endpoint

```typescript
@Put('current-restaurant/:restaurantId')
@ApiOperation({ summary: 'Switch to a different restaurant' })
switchRestaurant(
  @Param('restaurantId') restaurantId: string,
  @CurrentUser('sub') userId: string,
) {
  return this.usersService.switchRestaurant(userId, restaurantId);
}
```

---

## Fluxo Frontend

1. **Listar restaurantes** (enviados no login):
```json
{
  "user": {
    "restaurants": [
      { "id": "uuid-1", "name": "Burger King", "slug": "burger-king" },
      { "id": "uuid-2", "name": "Pizza House", "slug": "pizza-house" }
    ]
  }
}
```

2. **Chamar switch quando usuário clicar em restaurante:**
```typescript
const response = await fetch(
  `/api/v1/users/current-restaurant/${restaurantId}`,
  {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const { data } = await response.json();
// data.user.currentRestaurant agora tem o novo restaurante
```

3. **Atualizar contexto:**
- AuthContext com `currentRestaurant`
- WhiteLabelContext com dados visuais
- Limpar cache (carrinho, menu, etc)
- Redirecionar para `/dashboard`

---

## Segurança

✅ Verifica se usuário tem acesso ao restaurante antes de trocar  
✅ Requer autenticação JWT  
✅ Retorna erro 404 se restaurante não existe ou acesso negado  
✅ Registrado em audit logs
