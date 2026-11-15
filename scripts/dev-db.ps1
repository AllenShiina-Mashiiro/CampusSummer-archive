# 本地开发数据库（Windows / PowerShell）
#
# 用 PostgreSQL 官方二进制在工作区里起一个独立实例（默认端口 5432），
# 不碰机器上已有的 PostgreSQL 服务。
#
#   .\scripts\dev-db.ps1 start     # 首次会自动 initdb 再启动
#   .\scripts\dev-db.ps1 stop
#   .\scripts\dev-db.ps1 status
#   .\scripts\dev-db.ps1 reset     # 删库重来（会丢失本地数据）

param(
  [ValidateSet('start', 'stop', 'status', 'reset')]
  [string]$Action = 'start'
)

$ErrorActionPreference = 'Stop'

$PgBin = if ($env:PG_BIN) { $env:PG_BIN } else { 'D:\Program Files\PostgreSQL\18\bin' }
$Root = Split-Path -Parent $PSScriptRoot
$DataDir = Join-Path $Root '.pgdata'
$Port = if ($env:PG_PORT) { $env:PG_PORT } else { '5432' }
$DbName = if ($env:PG_DATABASE) { $env:PG_DATABASE } else { 'campussummer' }

function Test-PgUp {
  try {
    & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p $Port -U postgres -d postgres -tAc 'select 1' 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

switch ($Action) {
  'status' {
    if (Test-PgUp) { "dev db: running on 127.0.0.1:$Port" } else { "dev db: stopped" }
  }

  'start' {
    if (-not (Test-Path $DataDir)) {
      Write-Host "初始化数据目录 $DataDir ..."
      & (Join-Path $PgBin 'initdb.exe') -D $DataDir -U postgres --auth=trust --encoding=UTF8 --locale=C | Out-Null
    }

    if (Test-PgUp) {
      Write-Host "dev db 已在 127.0.0.1:$Port 运行"
      break
    }

    # 注意：沙箱环境下 pg_ctl 会因受限令牌创建失败，直接前台跑 postgres.exe 更稳
    Write-Host "启动 postgres（端口 $Port，Ctrl+C 停止）..."
    & (Join-Path $PgBin 'postgres.exe') -D $DataDir -p $Port -c listen_addresses=127.0.0.1
  }

  'stop' {
    Get-Process postgres -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host 'dev db 已停止'
  }

  'reset' {
    Write-Host '删除并重建数据库...'
    & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p $Port -U postgres -d postgres -c "drop database if exists $DbName" | Out-Null
    & (Join-Path $PgBin 'psql.exe') -h 127.0.0.1 -p $Port -U postgres -d postgres -c "create database $DbName" | Out-Null
    Write-Host "重建完成，接着执行：npm run db:push && npm run db:seed"
  }
}
