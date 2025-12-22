# Script para executar migração de shipping
# Execute este script com: .\database\migrate-shipping.ps1

$dbName = "mercadodepulgas"
$dbUser = "postgres"
$sqlFile = "database\add-shipping-columns.sql"

Write-Host "Executando migração de shipping..." -ForegroundColor Cyan

# Executar migração
$env:PGPASSWORD = Read-Host "Digite a senha do PostgreSQL" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD)
$env:PGPASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

psql -U $dbUser -d $dbName -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nMigração executada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`nErro ao executar migração!" -ForegroundColor Red
    exit 1
}

# Verificar se as colunas foram criadas
Write-Host "`nVerificando colunas criadas..." -ForegroundColor Cyan
psql -U $dbUser -d $dbName -c "\d products" | Select-String -Pattern "shipping"
psql -U $dbUser -d $dbName -c "\d users" | Select-String -Pattern "address"
psql -U $dbUser -d $dbName -c "\dt shipments"

Write-Host "`nConcluído!" -ForegroundColor Green
