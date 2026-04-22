# NightRecall Runbook (Ops + Backups)

이 문서는 **운영 중 장애/이상징후 감지**와 **데이터 백업/복구**를 위해 레포에 추가된 구성(워크플로/엔드포인트/환경변수)을 빠르게 다시 떠올리기 위한 “실행 가능한” 요약입니다.

## 1) Ops 알림 (Slack)

### 목적
- 서버가 5xx를 많이 뱉거나(장애), 429가 증가하거나(레이트리밋), 느린 요청/예외가 늘어날 때 Slack으로 알려서 **문제 인지 시간을 줄이기**.

### 동작 방식(구성요소)
- GitHub Actions 스케줄러가 5분마다 `POST /v1/ops/alert-run` 호출
  - 워크플로: `.github/workflows/ops-alert-run.yml`
  - 스케줄: `*/5 * * * *` (5분마다)
- 백엔드는 최근 N분(서버 설정값)의 이벤트를 집계해 임계치를 넘으면 Slack Incoming Webhook으로 메시지를 보냄
- 인증: 요청 헤더 `X-Ops-Token` 값이 서버의 `OPS_CRON_TOKEN`과 일치해야 함

### GitHub Actions 설정
- Repo → `Settings → Secrets and variables → Actions`
- `Secrets`
  - `OPS_CRON_TOKEN`: 서버 `OPS_CRON_TOKEN`과 동일한 값
- `Variables`
  - `OPS_ALERT_RUN_URL`: 예) `https://<railway-domain>/v1/ops/alert-run`

### Railway(백엔드) 설정
- 백엔드 서비스 환경변수(Variables)에 아래를 세팅
  - `OPS_CRON_TOKEN`: 랜덤 긴 문자열(외부 유출 금지)
  - `OPS_SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL(외부 유출 금지)
  - (선택) `OPS_ALERT_THRESHOLD_*`: 임계치 튜닝용(코드/설정에 따라 키 이름이 다를 수 있으니 실제 백엔드 설정을 기준으로)

### 수동 테스트(권장)
GitHub Actions → `Ops Alert Runner` → `Run workflow`로 즉시 실행해서 Slack에 찍히는지 확인.

문제 발생 시 체크리스트:
- GitHub Actions에서 `OPS_ALERT_RUN_URL`/`OPS_CRON_TOKEN`이 비어있지 않은지
- Railway 백엔드에 `OPS_CRON_TOKEN`/`OPS_SLACK_WEBHOOK_URL`이 들어있는지
- `/v1/ops/alert-run`이 2xx를 리턴하는지(401/403이면 토큰 불일치 가능성)

## 2) DB 백업 (GitHub Actions Artifacts)

Railway Postgres는 플랜에 따라 “내장 백업”이 없을 수 있어, 이 레포는 GitHub Actions로 `pg_dump`를 떠서 **Artifacts(14일 보관)** 로 저장합니다.

### 워크플로
- `.github/workflows/db-backup.yml`
- 스케줄: 매일 `18:10 UTC` (파일 주석 기준으로 `03:10 KST`)
- 출력물: `db-backup-<timestamp>.tar.gz` (내부에 `waitlist.dump`, `app.dump`, `SHA256SUMS.txt`)

### GitHub Actions 설정
- Repo → `Settings → Secrets and variables → Actions` → `Secrets`
  - `WAITLIST_DATABASE_URL`: Railway `Postgres_to_waitlist` 연결 문자열
  - `APP_DATABASE_URL`: Railway 앱용 Postgres 연결 문자열

### 다운로드 확인
Actions → `DB Backup` 실행 결과 화면의 `Artifacts`에 `db-backup`이 생기면 업로드까지 성공.

### 복구(요약)
- 자세한 절차는 [BACKUPS.md](/BACKUPS.md) 참고.
- 핵심은 `pg_restore`로 custom-format dump(`*.dump`)를 복원하는 것.

예시:
```bash
pg_restore --no-owner --no-acl --clean --if-exists -d "$DATABASE_URL" waitlist.dump
pg_restore --no-owner --no-acl --clean --if-exists -d "$DATABASE_URL" app.dump
```

### 자주 겪는 에러
- `pg_dump: server version mismatch`:
  - 서버 Postgres가 18.x인데 로컬/런너의 `pg_dump`가 16.x일 때 발생.
  - 이 레포 워크플로는 `postgresql-client-18` 설치 후 `/usr/lib/postgresql/18/bin/pg_dump`를 사용하도록 구성되어 있음.
- `gpg: cannot open /dev/tty`:
  - CI에 TTY가 없어서 생기는 문제. 워크플로에서 `gpg --batch --yes --no-tty`로 비대화식 처리.

## 3) 지금 “운영적으로 남은 것” 체크

- (권장) Slack 알림 채널을 “ops 전용 채널”로 분리
- (권장) 백업 Artifact 보관기간(14일)이 충분한지 검토(필요 시 늘리거나, 장기보관 스토리지로 이동)
- (권장) 실제 복구 리허설을 1회만이라도 해보기(진짜로 복원 가능한지 확인)

