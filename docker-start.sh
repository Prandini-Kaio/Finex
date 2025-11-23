#!/bin/bash

# Script Bash para iniciar o projeto com Docker
echo "🚀 Iniciando Finance Controller com Docker..."

# Verifica se o Docker está rodando
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker."
    exit 1
fi

# Constrói e inicia os containers
echo "📦 Construindo e iniciando containers..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Serviços iniciados com sucesso!"
    echo ""
    echo "📍 Acesse a aplicação em:"
    echo "   Frontend: http://localhost:80"
    echo "   Backend:  http://localhost:8080"
    echo ""
    echo "📊 Para ver os logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Para parar os serviços:"
    echo "   docker-compose down"
else
    echo "❌ Erro ao iniciar os serviços. Verifique os logs com: docker-compose logs"
fi

