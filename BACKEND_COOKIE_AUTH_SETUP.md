# Configuração de Autenticação com Cookies HttpOnly

## Status Atual
✅ **IMPLEMENTADO** - O backend agora suporta autenticação via cookies httpOnly.

## Implementação Concluída

### ✅ Checklist de Requisitos

**1. Endpoints de Autenticação**
- [x] `/auth/login/admin` - retorna tokens via cookies
- [x] `/auth/login/restaurant` - retorna tokens via cookies
- [x] `/auth/refresh` - retorna novos tokens via cookies (lê do cookie automaticamente)
- [x] `/auth/logout` - limpa os cookies

**2. Headers HTTP de Segurança**
```
Set-Cookie: accessToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

- [x] HttpOnly: true (token não acessível por JavaScript)
- [x] Secure: true em produção (só enviado em HTTPS)
- [x] SameSite: Strict em produção, Lax em desenvolvimento
- [x] Path=/

**3. CORS Configuration**
```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: http://localhost:3001,3002,3003 (configurável via CORS_ORIGINS)
Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, x-restaurant-id, x-idempotency-key
```

- [x] `credentials: true` habilitado
- [x] Origens configuráveis via variável de ambiente
- [x] Não usa wildcard (*) com credentials

**4. Validação de Tokens**
- [x] Lê tokens automaticamente dos cookies OU do header Authorization
- [x] Valida token em cada requisição protegida
- [x] Retorna 401 se token inválido/expirado
- [x] Refresh automático de token via endpoint `/auth/refresh`

**5. Logout**
- [x] Limpa cookies ao fazer logout
- [x] Registra logout no audit log

---

## Arquivos Modificados

1. **src/main.ts** - Adicionado cookie-parser e configuração CORS completa
2. **src/auth/auth.controller.ts** - Endpoints agora setam/limpam cookies
3. **src/auth/strategies/jwt.strategy.ts** - Extrai token do cookie ou header
4. **src/auth/auth.service.ts** - refreshToken retorna ambos tokens

---

## Respostas dos Endpoints

### Login (POST /auth/login/admin ou /auth/login/restaurant)

**Cookies setados automaticamente:**
- `accessToken` (15 minutos)
- `refreshToken` (7 dias)

**Body de resposta:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "type": "ADMIN",
    "role": "SUPER_ADMIN"
  },
  "message": "Login successful"
}
```

### Refresh (POST /auth/refresh)

Lê o `refreshToken` do cookie automaticamente. Não precisa enviar body.

**Cookies atualizados automaticamente**

**Body de resposta:**
```json
{
  "message": "Token refreshed successfully"
}
```

### Logout (POST /auth/logout)

**Cookies removidos automaticamente**

**Body de resposta:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Compatibilidade

O backend mantém compatibilidade com o header `Authorization: Bearer <token>` para:
- Clientes que não suportam cookies (mobile apps, etc.)
- Testes via Swagger/Postman
- Migrações graduais

---

## Referências
- [OWASP: HttpOnly Cookies](https://owasp.org/www-community/HttpOnly)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [CORS com Credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#credentialed_requests)

---

**Data da Implementação**: 12 de Janeiro de 2026
**Implementação Frontend**: Concluída ✅
**Status Backend**: Concluído ✅
