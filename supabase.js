// Supabase 설정 및 연결
const SUPABASE_URL = 'https://dfomeijvzayyszisqflo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb21laWp2emF5eXN6aXNxZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjYwNDIsImV4cCI6MjA2MDQ0MjA0Mn0.-r1iL04wvPNdBeIvgxqXLF2rWqIUX5Ot-qGQRdYo_qk';

// Supabase 클라이언트 초기화
let supabase;

// Supabase 초기화 함수
function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error('Supabase 클라이언트 라이브러리를 찾을 수 없습니다.');
  }
}

// 페이지 로드 완료 시 Supabase 초기화
document.addEventListener('DOMContentLoaded', initSupabase);

// 모든 직원 데이터 가져오기
async function getData_All() {
  try {
    const { data, error } = await supabase
      .from('employeesinfo')
      .select('*');
    
    if (error) {
      console.error('직원 데이터 조회 오류:', error);
      return [];
    }
    
    // 날짜 형식 변환 (int4 -> yyyy-MM-dd)
    const formattedData = data.map(row => {
      // 모든 날짜 타입 필드 변환
      const dateFields = ['생년월일', '계약일', '계약시작일', '계약종료일', 
                          '건강검진일', '범죄경력조회일', '치매교육이수일'];
      
      const formattedRow = { ...row };
      
      // 만약 데이터에 '(만)나이' 필드가 있다면 변환
      if (formattedRow['(만)나이'] !== undefined && formattedRow['만나이'] === undefined) {
        formattedRow['만나이'] = formattedRow['(만)나이'];
      }
      
      dateFields.forEach(field => {
        if (formattedRow[field] && formattedRow[field] !== null) {
          // yyyymmdd 형식의 숫자를 yyyy-MM-dd 형식으로 변환
          const dateStr = formattedRow[field].toString();
          if (dateStr.length === 8) {
            formattedRow[field] = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        }
      });
      
      return formattedRow;
    });
    
    console.log("변환 후 데이터:", formattedData);
    return formattedData;
  } catch (error) {
    console.error('오류 발생:', error);
    return [];
  }
}

// 직원 데이터 저장 처리
async function processEmployeeFormData(formData) {
  // 근무요일 배열 처리
  const workdaysArray = formData.workdays || [];
  const workdays = workdaysArray.join("_");

  // 날짜 필드를 yyyymmdd 형식의 숫자로 변환하는 함수
  const convertDateToInt = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return null; // 빈 문자열이면 null 반환
    // '-' 제거하고 숫자로 변환
    return dateStr.replace(/-/g, "");
  };

  // 전체 데이터 객체 생성
  const data = {
    직원번호: formData.employeeId || "",
    직원명: formData.name || "",
    주민등록번호: formData.ssn || "",
    생년월일: convertDateToInt(formData.birthdate),
    만나이: formData.age || "",
    주소: formData.address || "",
    이메일: formData.email || "",
    휴대전화번호: formData.mobile || "",
    전화번호: formData.phone || "",
    비상연락망: formData.emergency || "",
    근무구분: formData.workType || "",
    담당직종: formData.position || "",
    계약일: convertDateToInt(formData.contractDate),
    계약시작일: convertDateToInt(formData.contractStart),
    계약종료일: convertDateToInt(formData.contractEnd),
    근무시작시간: formData.workStart || "",
    근무종료시간: formData.workEnd || "",
    휴게시간: formData.breakTime || "",
    근무요일: workdays,
    일일근무시간: formData.dailyHours || "",
    기타근무유형: formData.otherWorkType || "",
    건강검진일: convertDateToInt(formData.healthCheckupDate),
    범죄경력조회일: convertDateToInt(formData.criminalRecordDate),
    치매교육이수일: convertDateToInt(formData.dementiaTrainingDate),
    계좌번호: formData.bankAccount || "",
    계좌은행: formData.bankName || "",
    예금주: formData.accountHolder || "",
  };

  // null인 날짜 필드 제거
  Object.keys(data).forEach(key => {
    if (data[key] === null) {
      delete data[key];
    }
  });

  // 데이터를 Supabase에 추가
  return appendEmployeeLine(data);
}

// 직원 데이터를 Supabase에 추가
async function appendEmployeeLine(data) {
  try {
    // 회원번호 상태 확인 - 신규직원등록중인 경우 새 ID 생성
    let employeeId = data.직원번호 || "";
    if (employeeId === "신규직원등록중") {
      // 새 직원번호 생성
      const newIdResult = await generateEmployeeIdServer();
      if (newIdResult.success) {
        employeeId = newIdResult.newId;
      } else {
        return {
          success: false,
          message: "직원번호 생성 중 오류가 발생했습니다: " + (newIdResult.message || "")
        };
      }
    }

    // 직원 ID 업데이트
    data.직원번호 = employeeId;

    // Supabase에 데이터 삽입
    const { data: insertedData, error } = await supabase
      .from('employeesinfo')
      .insert([data])
      .select();

    if (error) {
      console.error("직원 데이터 삽입 오류:", error);
      return {
        success: false,
        message: "직원 데이터 저장 중 오류가 발생했습니다: " + error.message
      };
    }

    return {
      success: true,
      message: "직원 등록 완료!",
      employeeId: employeeId, // 새로 생성된 직원번호를 반환
    };
  } catch (error) {
    console.error("데이터 저장 중 오류 발생:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다: " + error.message,
    };
  }
}

// 새로운 직원번호 생성 함수
async function generateEmployeeIdServer() {
  try {
    // 현재 연도의 마지막 두 자리 가져오기
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // 직원번호 형식 S + YY + 001~999
    const prefix = "S" + currentYear;
    
    // 현재 연도 직원번호 조회
    const { data, error } = await supabase
      .from('employeesinfo')
      .select('직원번호')
      .like('직원번호', `${prefix}%`);
    
    if (error) {
      console.error("직원번호 조회 오류:", error);
      return { success: false, message: "직원번호 조회 중 오류가 발생했습니다: " + error.message };
    }
    
    // 기존 직원번호 중 현재 연도의 것을 필터링
    const existingIds = data.map(item => item.직원번호);
    
    // 가장 큰 번호 찾기
    let maxNumber = 0;
    existingIds.forEach((id) => {
      if (!id) return; // id가 undefined인 경우 건너뜀
      
      // prefix(SYY) 이후의 숫자 부분 추출
      const numberPart = parseInt(id.substring(3), 10);
      if (!isNaN(numberPart) && numberPart > maxNumber) {
        maxNumber = numberPart;
      }
    });
    
    // 다음 번호 생성 (3자리 숫자로 패딩)
    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    const newEmployeeId = prefix + nextNumber;
    
    return { success: true, newId: newEmployeeId };
  } catch (error) {
    console.error("직원번호 생성 중 오류 발생:", error);
    return { success: false, message: "직원번호 생성 중 오류가 발생했습니다: " + error.message };
  }
}

// 직원 데이터를 OUTDATED로 이동 (Supabase에서는 별도 테이블로 이동)
async function move_EmployeeLine(employeeId) {
  try {
    // 1. 이동할 직원 데이터 조회
    const { data: employeeData, error: selectError } = await supabase
      .from('employeesinfo')
      .select('*')
      .eq('"직원등록_id"', employeeId)  // 대소문자 수정: Id -> id
      .single();

    if (selectError || !employeeData) {
      console.error("직원 조회 오류:", selectError);
      return {
        success: false,
        message: `직원등록_id "${employeeId}"를 가진 직원을 찾을 수 없습니다: ${selectError?.message || ''}`,
      };
    }

    // 2. employeesinfo_outdated 테이블에 데이터 복사
    const { error: insertError } = await supabase
      .from('employeesinfo_outdated')
      .insert([employeeData]);

    if (insertError) {
      console.error("데이터 백업 오류:", insertError);
      return {
        success: false,
        message: `직원 데이터 백업 중 오류가 발생했습니다: ${insertError.message}`,
      };
    }

    // 3. 원본 테이블에서 데이터 삭제
    const { error: deleteError } = await supabase
      .from('employeesinfo')
      .delete()
      .eq('"직원등록_id"', employeeId);  // 대소문자 수정: Id -> id

    if (deleteError) {
      console.error("데이터 삭제 오류:", deleteError);
      return {
        success: false,
        message: `직원 데이터 삭제 중 오류가 발생했습니다: ${deleteError.message}`,
      };
    }

    return {
      success: true,
      message: `직원등록_id "${employeeId}"의 데이터가 성공적으로 OUTDATED로 이동되었습니다.`,
    };
  } catch (error) {
    console.error("오류 발생:", error);
    return {
      success: false,
      message: "직원 데이터 이동 중 오류가 발생했습니다: " + error.message,
    };
  }
}

// 자격증 데이터 가져오기
async function getData_Cert() {
  try {
    const { data, error } = await supabase
      .from('employees_cert')
      .select('*');
    
    if (error) {
      console.error('자격증 데이터 조회 오류:', error);
      return [];
    }
    
    // 날짜 형식 변환 (int4 -> yyyy-MM-dd)
    const formattedData = data.map(row => {
      const formattedRow = { ...row };
      
      // 자격증 날짜 필드
      ['자격증취득일', '자격증만료일'].forEach(field => {
        if (formattedRow[field] && formattedRow[field] !== null) {
          // yyyymmdd 형식의 숫자를 yyyy-MM-dd 형식으로 변환
          const dateStr = formattedRow[field].toString();
          if (dateStr.length === 8) {
            formattedRow[field] = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        }
      });
      
      return formattedRow;
    });
    
    console.log("변환 후 자격증 데이터:", formattedData);
    return formattedData;
  } catch (error) {
    console.error('오류 발생:', error);
    return [];
  }
}

// 자격증 데이터를 처리하는 함수
async function processCertFormData(formData) {
  // 날짜 필드를 yyyymmdd 형식의 숫자로 변환하는 함수
  const convertDateToInt = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return null; // 빈 문자열이면 null 반환
    // '-' 제거하고 숫자로 변환
    return dateStr.replace(/-/g, "");
  };

  // 전체 데이터 객체 생성
  const data = {
    직원번호: formData.employeeId || "",
    직원명: formData.employeeName || "",
    자격증명: formData.certName || "",
    자격번호: formData.certNumber || "",
    자격증취득일: convertDateToInt(formData.certDate),
    자격증만료일: convertDateToInt(formData.certExpiryDate),
    자격증발행처: formData.certIssuer || "",
  };

  // null인 날짜 필드 제거
  Object.keys(data).forEach(key => {
    if (data[key] === null) {
      delete data[key];
    }
  });

  // 데이터를 Supabase에 추가
  return appendCertLine(data);
}

// 자격증 데이터를 Supabase에 추가하는 함수
async function appendCertLine(data) {
  try {
    const { data: insertedData, error } = await supabase
      .from('employees_cert')
      .insert([data])
      .select();

    if (error) {
      console.error("자격증 데이터 삽입 오류:", error);
      return {
        success: false,
        message: "자격증 데이터 저장 중 오류가 발생했습니다: " + error.message
      };
    }

    return {
      success: true,
      message: "자격증 등록 완료!",
      certId: insertedData[0].자격등록_id,  // 대소문자 수정: Id -> id
    };
  } catch (error) {
    console.error("자격증 데이터 저장 중 오류 발생:", error);
    return {
      success: false,
      message: "자격증 데이터 저장 중 오류가 발생했습니다: " + error.message,
    };
  }
}

// 자격증 데이터 삭제 함수
async function deleteCertData_Supabase(certId) {
  try {
    const { error } = await supabase
      .from('employees_cert')
      .delete()
      .eq('자격등록_id', certId);  // 대소문자 수정: Id -> id

    if (error) {
      console.error("자격증 데이터 삭제 오류:", error);
      return {
        success: false,
        message: "삭제할 자격증 정보를 찾을 수 없습니다: " + error.message,
      };
    }
    
    return { 
      success: true, 
      message: "자격증 정보가 삭제되었습니다." 
    };
  } catch (error) {
    console.error("자격증 삭제 중 오류 발생:", error);
    return {
      success: false,
      message: "자격증 삭제 중 오류가 발생했습니다: " + error.message,
    };
  }
} 