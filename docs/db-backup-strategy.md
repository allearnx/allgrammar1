# DB 백업 전략

## Supabase 백업 옵션

### 1. 자동 백업 (기본 제공)
- **Free/Pro 플랜**: 매일 자동 백업, 7일 보관
- Supabase Dashboard → **Settings → Database → Backups** 에서 확인
- 복원: Supabase 지원팀에 요청

### 2. PITR (Point-in-Time Recovery)
- **Pro 플랜 이상** 에서 활성화 가능 (추가 비용)
- Dashboard → **Settings → Database → Point in Time Recovery** 에서 활성화
- 특정 시점(초 단위)으로 복원 가능
- WAL(Write-Ahead Logging) 기반

### 3. 수동 백업 (권장: 주 1회)
대규모 변경(마이그레이션, 데이터 정리) 전 수동 백업:

```bash
# Supabase CLI로 스키마 덤프
supabase db dump -f backup_$(date +%Y%m%d).sql

# 데이터 포함 덤프
supabase db dump -f backup_$(date +%Y%m%d)_data.sql --data-only
```

### 4. 테이블별 CSV 내보내기
Dashboard → **Table Editor** → 테이블 선택 → **Export to CSV**
- 소규모 데이터 확인/복원 시 유용

## 복원 절차

### 자동 백업 복원
1. Supabase Dashboard → Settings → Database → Backups
2. 복원할 날짜 선택 → Restore 클릭
3. **주의**: 현재 데이터가 백업 시점으로 덮어씌워짐

### 수동 백업 복원
```bash
# 스키마 + 데이터 복원
psql $DATABASE_URL < backup_20260314.sql
```

## 권장 정책

| 항목 | 설정 |
|------|------|
| 자동 백업 | 활성화 확인 (기본 제공) |
| PITR | Pro 플랜이면 활성화 권장 |
| 수동 백업 | 마이그레이션 전 필수 |
| 백업 파일 보관 | Git에 포함하지 않음 (.gitignore) |

## 체크리스트

- [ ] Supabase Dashboard에서 자동 백업 활성화 확인
- [ ] PITR 활성화 여부 결정 (Pro 플랜 필요)
- [ ] 마이그레이션 전 수동 백업 프로세스 확립
- [ ] `*.sql` 백업 파일 .gitignore에 추가
