# 직원 관리 시스템 - Supabase 버전

## 프로젝트 개요

Google Apps Script에서 Supabase로 마이그레이션된 직원 관리 시스템입니다. 이 시스템은 직원의 기본 정보, 계약 사항, 자격증 정보 등을 관리합니다.

## 기술 스택

- HTML/CSS/JavaScript (프론트엔드)
- Supabase (백엔드 DB 및 API)

## 기능

1. 직원 정보 조회 (전체/재직 중인 직원)
2. 신규 직원 등록
3. 기존 직원 정보 수정
4. 자격증 정보 관리 (등록/삭제)

## Supabase 설정

Supabase에 다음 테이블들이 필요합니다:

### employeesinfo 테이블

| 필드명               | 수파베이스 필드명             |
| -------------------- | ----------------------------- |
| generatedId          | 직원등록\_id (자동 생성 UUID) |
| employeeId           | 직원번호                      |
| name                 | 직원명                        |
| ssn                  | 주민등록번호                  |
| birthdate            | 생년월일                      |
| age                  | (만)나이                      |
| address              | 주소                          |
| email                | 이메일                        |
| mobile               | 휴대전화번호                  |
| phone                | 전화번호                      |
| emergency            | 비상연락망                    |
| workType             | 근무구분                      |
| position             | 담당직종                      |
| contractDate         | 계약일                        |
| contractStart        | 계약시작일                    |
| contractEnd          | 계약종료일                    |
| workStart            | 근무시작시간                  |
| workEnd              | 근무종료시간                  |
| breakTime            | 휴게시간                      |
| workdays             | 근무요일                      |
| dailyHours           | 일일근무시간                  |
| otherWorkType        | 기타근무유형                  |
| healthCheckupDate    | 건강검진일                    |
| criminalRecordDate   | 범죄경력조회일                |
| dementiaTrainingDate | 치매교육이수일                |
| bankAccount          | 계좌번호                      |
| bankName             | 계좌은행                      |
| accountHolder        | 예금주                        |

### employees_cert 테이블

| 필드명         | 수파베이스필드명              |
| -------------- | ----------------------------- |
| certId         | 자격등록\_id (자동 생성 UUID) |
| employeeId     | 직원번호                      |
| employeeName   | 직원명                        |
| certName       | 자격증명                      |
| certNumber     | 자격번호                      |
| certDate       | 자격증취득일                  |
| certExpiryDate | 자격증만료일                  |
| certIssuer     | 자격증발행처                  |

### employeesinfo_outdated 테이블

employeesinfo와 동일한 구조로, 삭제된 직원 정보를 보관하기 위한 테이블입니다.

## 설치 및 실행 방법

1. index.html, style.css, supabase.js 파일을 웹 서버에 업로드합니다.
2. Supabase 프로젝트 생성 및 테이블 설정을 완료합니다.
3. supabase.js 파일에 Supabase URL과 API 키를 설정합니다.
4. 웹 브라우저에서 index.html 파일에 접속하여 시스템을 사용합니다.

## 주의사항

- 브라우저에서 JavaScript가 활성화되어 있어야 합니다.
- 민감한 개인정보를 다루는 시스템이므로 보안에 주의하세요.
- Supabase 키는 anon/public 키만 사용하고, Row Level Security(RLS)를 적절히 설정하세요.
