# Acesso do Frontend pela Rede Local

Este documento explica como configurar o sistema para permitir que outros dispositivos na rede local acessem o frontend.

## Configuração do Frontend (Vite)

O arquivo `frontend/vite.config.ts` já está configurado para aceitar conexões da rede local:

```typescript
server: {
  host: '0.0.0.0', // Permite acesso de outros dispositivos na rede local
  port: 5173,
  strictPort: false,
}
```

## Como Acessar

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Identifique o IP da sua máquina na rede local:**
   - Windows: Execute `ipconfig` e procure por "Endereço IPv4"
   - Linux/Mac: Execute `ifconfig` ou `ip addr`

3. **Acesse o frontend de outros dispositivos:**
   - Use o IP da sua máquina seguido da porta: `http://SEU_IP:5173`
   - Exemplo: `http://192.168.127.41:5173`

## Configuração do Backend (CORS)

### Opção 1: Permitir qualquer origem (Desenvolvimento) - RECOMENDADO

No arquivo `financecontroller/src/main/resources/application.properties`, a linha já está ativada:

```properties
app.cors.allow-all-origins=true
```

Isso permitirá que qualquer dispositivo na rede local acesse o backend. **Esta é a configuração padrão e recomendada para desenvolvimento em rede local.**

### Opção 2: Especificar IPs específicos

Se preferir ser mais restritivo, você pode especificar os IPs permitidos:

```properties
app.cors.allowed-origins=http://localhost:5173,http://192.168.127.41:5173,http://192.168.1.100:5173
```

**Nota:** Substitua os IPs pelos IPs reais dos dispositivos que precisam acessar.

## Configuração da URL da API no Frontend

**A detecção automática já está configurada!** O frontend detecta automaticamente o IP/hostname do servidor e constrói a URL da API dinamicamente.

- Se acessado via `http://localhost:5173` → API será `http://localhost:8080`
- Se acessado via `http://192.168.127.41:5173` → API será `http://192.168.127.41:8080`

### Configuração Manual (Opcional)

Se o backend estiver rodando em uma máquina diferente do frontend, você pode configurar manualmente:

1. Crie um arquivo `.env` na pasta `frontend/`:
   ```
   VITE_API_URL=http://IP_DO_BACKEND:8080
   ```

2. Isso sobrescreverá a detecção automática.

## Exemplo de Uso

1. **Máquina servidor (onde o código está rodando):**
   - IP: `192.168.127.41`
   - Frontend: `http://192.168.127.41:5173`
   - Backend: `http://192.168.127.41:8080`

2. **Dispositivo cliente (celular, tablet, outro PC):**
   - Acesse: `http://192.168.127.41:5173`
   - Certifique-se de que o dispositivo está na mesma rede Wi-Fi

## Troubleshooting

### Frontend não acessível de outros dispositivos
- Verifique se o firewall do Windows não está bloqueando a porta 5173
- Certifique-se de que o Vite está configurado com `host: '0.0.0.0'`
- Verifique se os dispositivos estão na mesma rede

### Erro de CORS no navegador
- **Solução:** Certifique-se de que `app.cors.allow-all-origins=true` está configurado no `application.properties`
- Reinicie o backend após alterar as configurações
- O frontend agora detecta automaticamente o IP do servidor, então não precisa configurar manualmente

### Erro "CORS request did not succeed"
- Verifique se o backend está rodando e acessível
- Verifique se o firewall não está bloqueando a porta 8080
- Certifique-se de que `app.cors.allow-all-origins=true` está ativo
- O frontend agora usa automaticamente o mesmo IP/hostname para acessar a API

### Backend não acessível
- Verifique se o Spring Boot está configurado para aceitar conexões externas
- Por padrão, o Spring Boot aceita conexões de qualquer IP na porta 8080
- Verifique o firewall se necessário

