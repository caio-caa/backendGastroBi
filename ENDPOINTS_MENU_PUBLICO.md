# Endpoints de Menu Público

## 1. Validar Cupom
- **Rota:** `POST /menu/:slug/coupon/validate`
- **Descrição:** Valida código de cupom e calcula desconto.
- **Request Body:**
  ```json
  {
    "code": "DESCONTO10",
    "subtotal": 150.00,
    "customerId": "optional-uuid"
  }
  ```
- **Response:**
  ```json
  {
    "valid": true,
    "code": "DESCONTO10",
    "discountType": "percentage",
    "discountValue": 10,
    "calculatedDiscount": 15.00,
    "minOrderValue": 50.00,
    "expiresAt": "2026-02-28T00:00:00.000Z"
  }
  ```
- **Requisição:**
  ```bash
  curl -X POST http://localhost:3001/api/v1/menu/restaurant-slug/coupon/validate \
    -H "Content-Type: application/json" \
    -d '{"code": "DESCONTO10", "subtotal": 150.00}'
  ```

## 2. Calcular Taxa de Entrega
- **Rota:** `POST /menu/:slug/delivery/calculate`
- **Descrição:** Calcula taxa de entrega baseada no CEP.
- **Request Body:**
  ```json
  {
    "zipCode": "01234567"
  }
  ```
- **Response:**
  ```json
  {
    "available": true,
    "fee": 8.00,
    "estimatedTime": 45,
    "freeDeliveryMinimum": 100.00,
    "message": null
  }
  ```
- **Requisição:**
  ```bash
  curl -X POST http://localhost:3001/api/v1/menu/restaurant-slug/delivery/calculate \
    -H "Content-Type: application/json" \
    -d '{"zipCode": "01234567"}'
  ```

## 3. Informações do Restaurante
- **Rota:** `GET /menu/:slug/info`
- **Descrição:** Retorna informações detalhadas do restaurante.
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Restaurant Name",
    "slug": "restaurant-slug",
    "description": "Descrição do restaurante",
    "phone": "+5511999999999",
    "address": {
      "street": "Rua Example",
      "number": "123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234567"
    },
    "openingHours": [
      {
        "dayOfWeek": 1,
        "openTime": "11:00",
        "closeTime": "23:00",
        "isOpen": true
      }
    ],
    "isOpen": true,
    "minimumOrderValue": 30.00,
    "deliveryTime": {
      "min": 30,
      "max": 60
    }
  }
  ```
- **Requisição:**
  ```bash
  curl http://localhost:3001/api/v1/menu/restaurant-slug/info
  ```
