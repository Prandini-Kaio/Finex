# Script PowerShell para iniciar o projeto com Docker
Write-Host "🚀 Iniciando Finance Controller com Docker..." -ForegroundColor Green

# Verifica se o Docker está rodando
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}

# Constrói e inicia os containers
Write-Host "📦 Construindo e iniciando containers..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Serviços iniciados com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Acesse a aplicação em:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:80" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Para ver os logs:" -ForegroundColor Cyan
    Write-Host "   docker-compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "🛑 Para parar os serviços:" -ForegroundColor Cyan
    Write-Host "   docker-compose down" -ForegroundColor White
} else {
    Write-Host "❌ Erro ao iniciar os serviços. Verifique os logs com: docker-compose logs" -ForegroundColor Red
}

