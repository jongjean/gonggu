#!/bin/bash
# PostgreSQL 데이터베이스 및 사용자 생성

echo "🔧 PostgreSQL 설정 시작..."

# .env에서 비밀번호 읽기 (또는 기본값)
DB_PASSWORD=${DB_PASSWORD:-"gonggu_secure_2026"}

# PostgreSQL 명령 실행
sudo -u postgres psql << EOF
-- 사용자 확인 및 생성
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'gonggu') THEN
    CREATE USER gonggu WITH PASSWORD '$DB_PASSWORD';
    RAISE NOTICE 'User gonggu created';
  ELSE
    RAISE NOTICE 'User gonggu already exists';
  END IF;
END
\$\$;

-- 데이터베이스 확인 및 생성
SELECT 'Database already exists' WHERE EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gonggu')
UNION ALL
SELECT 'Creating database' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gonggu');

-- 데이터베이스가 없으면 생성
\if :{?dbexists}
\else
CREATE DATABASE gonggu OWNER gonggu;
\endif

-- gonggu 데이터베이스에 연결
\c gonggu

-- pgvector 확장 설치
CREATE EXTENSION IF NOT EXISTS vector;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE gonggu TO gonggu;
GRANT ALL PRIVILEGES ON SCHEMA public TO gonggu;

-- 확인
SELECT version();
SELECT * FROM pg_extension WHERE extname = 'vector';
EOF

echo "✅ PostgreSQL 설정 완료"
echo "📝 사용자: gonggu"
echo "📝 데이터베이스: gonggu"
echo "📝 비밀번호: $DB_PASSWORD"
