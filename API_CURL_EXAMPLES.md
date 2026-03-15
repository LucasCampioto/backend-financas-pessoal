# Exemplos de cURL — API FinControl

**Pré-requisito:** servidor rodando em `http://localhost:3000` (ex.: `npm run dev`).

**Autenticação:** Login e Signup **não** retornam o token no body. O servidor define um cookie HttpOnly (`token`) com o JWT. Para testar rotas protegidas com cURL: use `-c arquivo` para salvar os cookies ao fazer login/signup e `-b arquivo` para enviá-los nas requisições seguintes (ex.: `-c cookies.txt` no login, `-b cookies.txt` nas demais). Alternativamente, é possível usar o header `Authorization: Bearer TOKEN` (substitua `TOKEN` por um JWT válido).

---

## 1. Autenticação

### 1.1 Signup (criar conta)

**Requisição:**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"name\":\"João Silva\",\"email\":\"joao@exemplo.com\",\"password\":\"senha123\"}"
```

**Body de envio (exemplo):**

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso (201):**

```json
{
  "user": { "email": "joao@exemplo.com", "name": "João Silva" }
}
```

O servidor define o cookie `token` (HttpOnly) com o JWT na resposta.

**Resposta de erro (409 — email já cadastrado):**

```json
{
  "message": "Email já cadastrado"
}
```

**Resposta de erro (400 — validação):**

```json
{
  "message": "Nome é obrigatório; Email inválido"
}
```

---

### 1.2 Login

**Requisição:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d "{\"email\":\"joao@exemplo.com\",\"password\":\"senha123\"}"
```

**Body de envio (exemplo):**

```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Resposta de sucesso (200):**

```json
{
  "user": { "email": "joao@exemplo.com", "name": "João Silva" }
}
```

O servidor define o cookie `token` (HttpOnly) com o JWT na resposta.

**Resposta de erro (401):**

```json
{
  "message": "Credenciais inválidas"
}
```

---

### 1.3 Logout

**Requisição:** use o cookie salvo no login (ex.: `-b cookies.txt`) ou o header Authorization.

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

Ou com header: `-H "Authorization: Bearer TOKEN"`. O servidor remove o cookie `token`.

**Resposta de sucesso (204):** sem corpo.

---

### 1.4 Dados do usuário autenticado (me)

**Requisição:** após login/signup, salve os cookies com `-c cookies.txt` e use `-b cookies.txt` nas requisições protegidas.

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

Ou com header: `-H "Authorization: Bearer TOKEN"`.

**Resposta de sucesso (200):**

```json
{
  "email": "joao@exemplo.com",
  "name": "João Silva"
}
```

**Resposta de erro (401):**

```json
{
  "message": "Token não informado"
}
```

---

## 2. Dados financeiros

### 2.1 Obter todos os dados financeiros

**Requisição:**

```bash
curl -X GET http://localhost:3000/api/finances \
  -H "Authorization: Bearer TOKEN"
```

**Resposta de sucesso (200):**

```json
{
  "revenues": [],
  "expenses": [],
  "taxConfig": { "percentual": 6, "fixedTaxes": [] }
}
```

---

## 3. Receitas

### 3.1 Criar receita

**Requisição:**

```bash
curl -X POST http://localhost:3000/api/revenues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"description\":\"Freelance\",\"amount\":5000,\"date\":\"2026-03-01\",\"type\":\"comprovado\",\"recurring\":false}"
```

**Body de envio (exemplo):** opcional `recurrenceEndMonth` (YYYY-MM) indica até qual mês a recorrência vale.

```json
{
  "description": "Freelance",
  "amount": 5000,
  "date": "2026-03-01",
  "type": "comprovado",
  "recurring": false,
  "recurrenceEndMonth": null
}
```

**Resposta de sucesso (201):**

```json
{
  "id": "674abc123def456789012345",
  "description": "Freelance",
  "amount": 5000,
  "date": "2026-03-01",
  "type": "comprovado",
  "recurring": false,
  "recurrenceEndMonth": null
}
```

---

### 3.2 Editar receita (PUT)

**Requisição:** substitua `:id` pelo id da receita.

```bash
curl -X PUT http://localhost:3000/api/revenues/674abc123def456789012345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -b cookies.txt \
  -d "{\"description\":\"Freelance atualizado\",\"amount\":5500,\"date\":\"2026-03-01\",\"type\":\"comprovado\",\"recurring\":true,\"recurrenceEndMonth\":\"2026-12\"}"
```

**Body de envio (exemplo):** mesmos campos do POST (sem id).

```json
{
  "description": "Freelance atualizado",
  "amount": 5500,
  "date": "2026-03-01",
  "type": "comprovado",
  "recurring": true,
  "recurrenceEndMonth": "2026-12"
}
```

**Resposta de sucesso (200):** objeto Revenue atualizado (inclui `id`, `recurrenceEndMonth`, etc.).

**Resposta de erro (404):** `{ "message": "Receita não encontrada" }`

---

### 3.3 Remover receita

**Requisição:**

```bash
curl -X DELETE http://localhost:3000/api/revenues/674abc123def456789012345 \
  -H "Authorization: Bearer TOKEN"
```

**Resposta de sucesso (204):** sem corpo.

**Resposta de erro (404):**

```json
{
  "message": "Receita não encontrada"
}
```

---

## 4. Despesas

### 4.1 Criar despesa

**Requisição:**

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"description\":\"Supermercado\",\"amount\":350.50,\"date\":\"2026-03-05\",\"category\":\"Alimentação\",\"bank\":\"Conta Corrente\",\"recurring\":false}"
```

**Body de envio (exemplo):** opcional `recurrenceEndMonth` (YYYY-MM) indica até qual mês a recorrência vale.

```json
{
  "description": "Supermercado",
  "amount": 350.5,
  "date": "2026-03-05",
  "category": "Alimentação",
  "bank": "Conta Corrente",
  "recurring": false,
  "recurrenceEndMonth": null
}
```

**Resposta de sucesso (201):**

```json
{
  "id": "674abc123def456789012346",
  "description": "Supermercado",
  "amount": 350.5,
  "date": "2026-03-05",
  "category": "Alimentação",
  "bank": "Conta Corrente",
  "recurring": false,
  "recurrenceEndMonth": null
}
```

---

### 4.2 Editar despesa (PUT)

**Requisição:** substitua `:id` pelo id da despesa.

```bash
curl -X PUT http://localhost:3000/api/expenses/674abc123def456789012346 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"description\":\"Supermercado\",\"amount\":400,\"date\":\"2026-03-05\",\"category\":\"Alimentação\",\"bank\":\"Conta Corrente\",\"recurring\":true,\"recurrenceEndMonth\":\"2026-10\"}"
```

**Body de envio (exemplo):** mesmos campos do POST (sem id).

```json
{
  "description": "Supermercado",
  "amount": 400,
  "date": "2026-03-05",
  "category": "Alimentação",
  "bank": "Conta Corrente",
  "recurring": true,
  "recurrenceEndMonth": "2026-10"
}
```

**Resposta de sucesso (200):** objeto Expense atualizado.

**Resposta de erro (404):** `{ "message": "Despesa não encontrada" }`

---

### 4.3 Criar despesas em lote (bulk)

**Requisição:**

```bash
curl -X POST http://localhost:3000/api/expenses/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "[{\"description\":\"Luz\",\"amount\":120,\"date\":\"2026-03-10\",\"category\":\"Contas\",\"bank\":\"Débito\"},{\"description\":\"Internet\",\"amount\":99.90,\"date\":\"2026-03-10\",\"category\":\"Contas\",\"bank\":\"Débito\"}]"
```

**Body de envio (exemplo):**

```json
[
  {
    "description": "Luz",
    "amount": 120,
    "date": "2026-03-10",
    "category": "Contas",
    "bank": "Débito"
  },
  {
    "description": "Internet",
    "amount": 99.9,
    "date": "2026-03-10",
    "category": "Contas",
    "bank": "Débito"
  }
]
```

**Resposta de sucesso (201):**

```json
[
  {
    "id": "674abc123def456789012347",
    "description": "Luz",
    "amount": 120,
    "date": "2026-03-10",
    "category": "Contas",
    "bank": "Débito",
    "recurring": false
  },
  {
    "id": "674abc123def456789012348",
    "description": "Internet",
    "amount": 99.9,
    "date": "2026-03-10",
    "category": "Contas",
    "bank": "Débito",
    "recurring": false
  }
]
```

---

### 4.4 Remover despesa

**Requisição:**

```bash
curl -X DELETE http://localhost:3000/api/expenses/674abc123def456789012346 \
  -H "Authorization: Bearer TOKEN"
```

**Resposta de sucesso (204):** sem corpo.

**Resposta de erro (404):**

```json
{
  "message": "Despesa não encontrada"
}
```

---

### 4.5 Remover todas as despesas de um mês

**Requisição:** substitua `YYYY-MM` pelo mês desejado (ex.: `2026-03`).

```bash
curl -X DELETE http://localhost:3000/api/expenses/by-month/2026-03 \
  -H "Authorization: Bearer TOKEN"
```

**Resposta de sucesso (204):** sem corpo.

---

### 4.6 Substituir despesas de cartão de crédito do mês

Remove todas as despesas do mês com `bank` igual a "Cartão de Crédito" ou "Importado" e insere a nova lista.

**Requisição:** substitua `YYYY-MM` pelo mês (ex.: `2026-03`).

```bash
curl -X PUT http://localhost:3000/api/expenses/replace-credit-card/2026-03 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"expenses\":[{\"description\":\"Compras online\",\"amount\":250,\"date\":\"2026-03-15\",\"category\":\"Compras\",\"bank\":\"Cartão de Crédito\"}]}"
```

**Body de envio (exemplo):**

```json
{
  "expenses": [
    {
      "description": "Compras online",
      "amount": 250,
      "date": "2026-03-15",
      "category": "Compras",
      "bank": "Cartão de Crédito"
    }
  ]
}
```

**Resposta de sucesso (200):** objeto `FinanceData` (revenues, expenses, taxConfig) atualizado.

```json
{
  "revenues": [],
  "expenses": [
    {
      "id": "674abc123def456789012349",
      "description": "Compras online",
      "amount": 250,
      "date": "2026-03-15",
      "category": "Compras",
      "bank": "Cartão de Crédito",
      "recurring": false
    }
  ],
  "taxConfig": { "percentual": 6, "fixedTaxes": [] }
}
```

---

## 5. Configuração de impostos

### 5.1 Obter configuração de impostos

**Requisição:**

```bash
curl -X GET http://localhost:3000/api/tax-config \
  -H "Authorization: Bearer TOKEN"
```

**Resposta de sucesso (200):**

```json
{
  "percentual": 6,
  "fixedTaxes": [
    { "id": "ft-001", "description": "ISS", "amount": 50 }
  ]
}
```

Se o usuário ainda não tiver configuração:

```json
{
  "percentual": 0,
  "fixedTaxes": []
}
```

---

### 5.2 Atualizar configuração de impostos

**Requisição:**

```bash
curl -X PUT http://localhost:3000/api/tax-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"percentual\":6,\"fixedTaxes\":[{\"id\":\"ft-001\",\"description\":\"ISS\",\"amount\":50},{\"id\":\"ft-002\",\"description\":\"Outros\",\"amount\":30}]}"
```

**Body de envio (exemplo):**

```json
{
  "percentual": 6,
  "fixedTaxes": [
    { "id": "ft-001", "description": "ISS", "amount": 50 },
    { "id": "ft-002", "description": "Outros", "amount": 30 }
  ]
}
```

**Resposta de sucesso (200):**

```json
{
  "percentual": 6,
  "fixedTaxes": [
    { "id": "ft-001", "description": "ISS", "amount": 50 },
    { "id": "ft-002", "description": "Outros", "amount": 30 }
  ]
}
```

---

## 6. Projeção de investimentos (savings)

Um único plano por usuário: taxa de juros geral + array de entradas (mês + valor). A taxa se aplica a todas as entradas e ao saldo acumulado.

### 6.1 Resumo das rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/savings` | Retorna o plano do usuário: `{ interestRate, entries }`. |
| PUT | `/api/savings` | Substitui o plano com `{ interestRate, entries }`. |
| GET | `/api/savings/projection` | Retorna plano + projeção mês a mês com juros. |

### 6.2 Bloco copiável (body de envio e retorno)

**GET /api/savings** — Obter plano atual

```bash
curl -s http://localhost:3000/api/savings -b cookies.txt
```

**Body de envio:** nenhum.

**Retorno (200):**

```json
{
  "interestRate": 6,
  "entries": [
    { "month": "2026-03", "amount": 1000 },
    { "month": "2026-04", "amount": 1000 }
  ]
}
```

Se o usuário ainda não tiver plano: `{ "interestRate": 0, "entries": [] }`.

---

**PUT /api/savings** — Criar ou atualizar plano (taxa única + lista de meses/valores)

```bash
curl -X PUT http://localhost:3000/api/savings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"interestRate\":6,\"entries\":[{\"month\":\"2026-03\",\"amount\":1000},{\"month\":\"2026-04\",\"amount\":1000}]}"
```

**Body de envio:**

```json
{
  "interestRate": 6,
  "entries": [
    { "month": "2026-03", "amount": 1000 },
    { "month": "2026-04", "amount": 1000 }
  ]
}
```

- `interestRate`: número >= 0 (taxa em % ao ano, ex.: 6 = 6% a.a.), aplicada a todos os meses e ao montante.
- `entries`: array de objetos com `month` (YYYY-MM) e `amount` (número >= 0).

**Retorno (200):** mesmo formato do GET — plano atualizado.

```json
{
  "interestRate": 6,
  "entries": [
    { "month": "2026-03", "amount": 1000 },
    { "month": "2026-04", "amount": 1000 }
  ]
}
```

---

**GET /api/savings/projection** — Projeção com juros (uma taxa para todo o plano)

```bash
curl -s "http://localhost:3000/api/savings/projection" -b cookies.txt
```

**Body de envio:** nenhum.

**Retorno (200):**

```json
{
  "interestRate": 6,
  "entries": [
    { "month": "2026-03", "amount": 1000 },
    { "month": "2026-04", "amount": 1000 }
  ],
  "projection": [
    { "month": "2026-03", "amount": 1000, "interestRate": 6, "interestEarned": 0, "balanceAfter": 1000 },
    { "month": "2026-04", "amount": 1000, "interestRate": 6, "interestEarned": 5, "balanceAfter": 2005 }
  ]
}
```

---

## 7. Dashboard (Previsão Financeira)

Totais calculados no back-end para o mês: receita, custos, cartão de crédito, impostos e lucro líquido. Query: `?month=YYYY-MM` (se omitido, usa o mês atual).

### 7.1 Obter dados do dashboard

**Rota:** `GET /api/dashboard?month=2026-04` (auth: cookie ou Authorization).

**Bloco copiável (cURL + retorno):**

```bash
# GET /api/dashboard?month=YYYY-MM
# Retorno (200): { month, label, totalRevenue, totalExpenses, totalCreditCard, totalTax, netProfit }
curl -X GET "http://localhost:3000/api/dashboard?month=2026-04" -b cookies.txt
```

**Exemplo de resposta (200):**

```json
{
  "month": "2026-04",
  "label": "Abr 2026",
  "totalRevenue": 13405,
  "totalExpenses": 12708.07,
  "totalCreditCard": 2698.07,
  "totalTax": 1637.94,
  "netProfit": -941
}
```

---

## Convenções

- **Datas:** `YYYY-MM-DD` (ex.: 2026-03-07).
- **Mês:** `YYYY-MM` (ex.: 2026-03).
- **Valores monetários:** número (não string).
- **IDs:** string (retornados pelo servidor nas respostas).
- **type (receita):** `"comprovado"` ou `"nao_comprovado"`.
- **recurrenceEndMonth:** opcional, formato `YYYY-MM`. Quando `recurring` é true, indica até qual mês a recorrência dura; omitido ou null = indefinido.

---

## Resumo das alterações (PUT e recurrenceEndMonth)

O bloco abaixo é apenas texto, copiável.

```
=== NOVAS ROTAS ===

1) PUT /api/revenues/:id
   Método: PUT
   Path: /api/revenues/:id (id = id da receita)
   Auth: cookie token ou Authorization: Bearer
   Body de envio: description (string), amount (number), date (YYYY-MM-DD), type ("comprovado" | "nao_comprovado"), recurring (boolean, opcional), recurrenceEndMonth (string YYYY-MM, opcional)
   Retorno sucesso (200): objeto Revenue completo: { id, description, amount, date, type, recurring, recurrenceEndMonth }
   Retorno erro (404): { "message": "Receita não encontrada" }
   Retorno erro (400): { "message": "..." } (validação)

2) PUT /api/expenses/:id
   Método: PUT
   Path: /api/expenses/:id (id = id da despesa)
   Auth: cookie token ou Authorization: Bearer
   Body de envio: description (string), amount (number), date (YYYY-MM-DD), category (string), bank (string), recurring (boolean, opcional), recurrenceEndMonth (string YYYY-MM, opcional)
   Retorno sucesso (200): objeto Expense completo: { id, description, amount, date, category, bank, recurring, recurrenceEndMonth }
   Retorno erro (404): { "message": "Despesa não encontrada" }
   Retorno erro (400): { "message": "..." } (validação)

=== O QUE MUDOU NO BODY DE ENVIO ===

- Receita (POST /api/revenues e PUT /api/revenues/:id): novo campo opcional recurrenceEndMonth (string, formato YYYY-MM). Quando recurring é true, indica até qual mês a recorrência vale; omitido ou null = indefinido.

- Despesa (POST /api/expenses, POST /api/expenses/bulk, PUT /api/expenses/:id, body de replace-credit-card): novo campo opcional recurrenceEndMonth (string, YYYY-MM). Mesmo significado.

=== O QUE MUDOU NAS RESPOSTAS ===

- Todas as respostas que devolvem um objeto Revenue passam a incluir recurrenceEndMonth (valor ou null).
- Todas as respostas que devolvem um objeto Expense passam a incluir recurrenceEndMonth (valor ou null).
- Novas respostas 200 para PUT /api/revenues/:id e PUT /api/expenses/:id com o recurso atualizado.
```
