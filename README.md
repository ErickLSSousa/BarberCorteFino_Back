# Barber Corte Fino - Backend

API Node.js/Express para agendamento seguro de corte, barba, sobrancelha e tintura capilar usando Supabase/PostgreSQL.

## Recursos

- Login de administrador com JWT e senha com hash.
- Cadastro administrativo de barbeiros.
- Cadastro administrativo dos valores dos servicos.
- Duracao validada no servidor:
  - corte: 60 minutos
  - barba: 20 minutos
  - tintura: 120 minutos
  - sobrancelha: 5 minutos
- Agendamento com varios servicos somando duracao e valor.
- Bloqueio de domingo e de horarios fora do expediente configurado.
- Bloqueio de conflito de horario por barbeiro.
- Validacao de entrada, CORS restrito, Helmet e rate limit.

## Configuracao

1. Execute o SQL de `supabase_schema.sql` no Supabase.
2. Copie `.env.example` para `.env`.
3. Preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `BUSINESS_OPEN_TIME` e `BUSINESS_CLOSE_TIME`.
4. Instale dependencias:

```bash
npm install
```

5. Crie o administrador inicial:

```bash
npm run create-admin
```

6. Inicie a API:

```bash
npm start
```

## Rotas principais

- `GET /health`
- `POST /api/auth/login`
- `GET /api/services`
- `GET /api/barbers`
- `GET /api/availability?barber_id=UUID&date=YYYY-MM-DD&service_ids=UUID,UUID`
- `POST /api/appointments`
- `GET /api/admin/appointments`
- `POST /api/admin/barbers`
- `POST /api/admin/services`

Rotas `/api/admin/*` exigem `Authorization: Bearer TOKEN`.
