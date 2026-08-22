# notes/ — 예측 모델 연구 노트북

경마 예측 알고리즘을 **학습·실험·개선**하기 위한 Jupyter 노트북 모음입니다.
Deno 커널을 사용하므로 노트북이 **프로덕션 모델 코드(`lib/predict/model-v1.ts`)를 그대로 import**합니다 —
노트북에서 백테스트로 검증한 개선이 별도 포팅 없이 곧바로 서비스 코드가 됩니다.

## 왜 Jupyter + Deno인가

- **파이썬 개발자 친화**: 익숙한 Jupyter UI 그대로, 셀 단위 실험/시각화 가능
- **포팅 비용 제로**: 서비스가 TypeScript이므로, 파이썬으로 실험 후 TS로 재작성하는 이중 작업이 없음
- Deno는 TypeScript를 설정 없이 바로 실행하는 런타임입니다 (파이썬 인터프리터에 타입이 내장됐다고 생각하면 됩니다)

## 설치 (최초 1회)

```bash
# 1. Deno 설치 (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

# 2. Jupyter 설치 (이미 있다면 생략)
pip install jupyterlab

# 3. Deno를 Jupyter 커널로 등록
deno jupyter --install
```

## 실행

```bash
# 저장소 루트에서
jupyter lab notes/
```

노트북을 열고 커널이 **Deno**인지 확인하세요. KRA API 키는 저장소 루트의
`.env.local`에서 자동으로 읽습니다 (노트북 첫 셀 참조).

## 노트북 목록

| 파일 | 내용 |
|---|---|
| `01-model-v1.ipynb` | 모델 v1 해부 — 데이터 로드부터 백테스트, 가중치 튜닝 실험까지 |

## 모델 개선 절차

1. 노트북에서 아이디어 실험 → 백테스트로 기존 모델과 **동일 기간 비교**
2. 개선이 확인되면 `lib/predict/model-v2.ts`를 **새 파일로** 작성 (v1을 덮어쓰지 않음 — 버전 비교 가능하게)
3. `components/PredictView.tsx`의 import를 v2로 교체
4. 서비스의 "이날 적중 성적" 섹션이 실전 성능을 계속 공개하므로, 배포 후 몇 주간 실측 확인

## 주의

- KRA API 레이트리밋을 존중하세요 — 백테스트 날짜 수를 한 번에 크게 늘리지 말 것
- 백테스트 적중률에 과최적화(overfitting)하지 말 것 — 기간을 나눠 교차 확인
- `.env.local`은 절대 커밋 금지 (이미 .gitignore에 있음)
