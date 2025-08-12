const SUPABASE_URL = 'https://dfomeijvzayyszisqflo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb21laWp2emF5eXN6aXNxZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjYwNDIsImV4cCI6MjA2MDQ0MjA0Mn0.-r1iL04wvPNdBeIvgxqXLF2rWqIUX5Ot-qGQRdYo_qk';

let supabase;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.error('Supabase 클라이언트 라이브러리를 찾을 수 없습니다.');
  }
}

window.supabase = initSupabase();

document.addEventListener('DOMContentLoaded', initSupabase);

async function getData_All() {
  try {
    const { data, error } = await supabase
      .from('employeesinfo')
      .select('*');
    
    if (error) {
      console.error('직원 데이터 조회 오류:', error);
      return [];
    }
    
    const formattedData = data.map(row => {
      const dateFields = ['생년월일', '계약일', '계약시작일', '계약종료일', 
                          '건강검진일', '범죄경력조회일', '치매교육이수일'];
      
      const formattedRow = { ...row };
      
      if (formattedRow['(만)나이'] !== undefined && formattedRow['만나이'] === undefined) {
        formattedRow['만나이'] = formattedRow['(만)나이'];
      }
      
      dateFields.forEach(field => {
        if (formattedRow[field] && formattedRow[field] !== null) {
          const dateStr = formattedRow[field].toString();
          if (dateStr.length === 8) {
            formattedRow[field] = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        }
      });
      
      return formattedRow;
    });
    
    return formattedData;
  } catch (error) {
    console.error('오류 발생:', error);
    return [];
  }
}

async function processEmployeeFormData(formData) {
  const workdaysArray = formData.workdays || [];
  const workdays = workdaysArray.join("_");

  const convertDateToInt = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return null;
    return dateStr.replace(/-/g, "");
  };

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

  Object.keys(data).forEach(key => {
    if (data[key] === null) {
      delete data[key];
    }
  });

  return appendEmployeeLine(data);
}

async function appendEmployeeLine(data) {
  try {
    let employeeId = data.직원번호 || "";
    if (employeeId === "신규직원등록중") {
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

    data.직원번호 = employeeId;

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
      employeeId: employeeId,
    };
  } catch (error) {
    console.error("데이터 저장 중 오류 발생:", error);
    return {
      success: false,
      message: "데이터 저장 중 오류가 발생했습니다: " + error.message,
    };
  }
}

async function generateEmployeeIdServer() {
  try {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    const prefix = "S" + currentYear;
    
    const { data, error } = await supabase
      .from('employeesinfo')
      .select('직원번호')
      .like('직원번호', `${prefix}%`);
    
    if (error) {
      console.error("직원번호 조회 오류:", error);
      return { success: false, message: "직원번호 조회 중 오류가 발생했습니다: " + error.message };
    }
    
    const existingIds = data.map(item => item.직원번호);
    
    let maxNumber = 0;
    existingIds.forEach((id) => {
      if (!id) return;
      
      const numberPart = parseInt(id.substring(3), 10);
      if (!isNaN(numberPart) && numberPart > maxNumber) {
        maxNumber = numberPart;
      }
    });
    
    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    const newEmployeeId = prefix + nextNumber;
    
    return { success: true, newId: newEmployeeId };
  } catch (error) {
    console.error("직원번호 생성 중 오류 발생:", error);
    return { success: false, message: "직원번호 생성 중 오류가 발생했습니다: " + error.message };
  }
}

async function move_EmployeeLine(employeeId) {
  try {
    const { data: employeeData, error: selectError } = await supabase
      .from('employeesinfo')
      .select('*')
      .eq('"직원등록_id"', employeeId)
      .single();

    if (selectError || !employeeData) {
      console.error("직원 조회 오류:", selectError);
      return {
        success: false,
        message: `직원등록_id "${employeeId}"를 가진 직원을 찾을 수 없습니다: ${selectError?.message || ''}`,
      };
    }

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

    const { error: deleteError } = await supabase
      .from('employeesinfo')
      .delete()
      .eq('"직원등록_id"', employeeId);

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

async function getData_Cert() {
  try {
    const { data, error } = await supabase
      .from('employees_cert')
      .select('*');
    
    if (error) {
      console.error('자격증 데이터 조회 오류:', error);
      return [];
    }
    
    const formattedData = data.map(row => {
      const formattedRow = { ...row };
      
      ['자격증취득일', '자격증만료일'].forEach(field => {
        if (formattedRow[field] && formattedRow[field] !== null) {
          const dateStr = formattedRow[field].toString();
          if (dateStr.length === 8) {
            formattedRow[field] = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        }
      });
      
      return formattedRow;
    });
    
    return formattedData;
  } catch (error) {
    console.error('오류 발생:', error);
    return [];
  }
}

async function processCertFormData(formData) {
  const convertDateToInt = (dateStr) => {
    if (!dateStr || dateStr.trim() === "") return null;
    return dateStr.replace(/-/g, "");
  };

  const data = {
    직원번호: formData.employeeId || "",
    직원명: formData.employeeName || "",
    자격증명: formData.certName || "",
    자격번호: formData.certNumber || "",
    자격증취득일: convertDateToInt(formData.certDate),
    자격증만료일: convertDateToInt(formData.certExpiryDate),
    자격증발행처: formData.certIssuer || "",
  };

  Object.keys(data).forEach(key => {
    if (data[key] === null) {
      delete data[key];
    }
  });

  return appendCertLine(data);
}

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
      certId: insertedData[0].자격등록_id,
    };
  } catch (error) {
    console.error("자격증 데이터 저장 중 오류 발생:", error);
    return {
      success: false,
      message: "자격증 데이터 저장 중 오류가 발생했습니다: " + error.message,
    };
  }
}

async function deleteCertData_Supabase(certId) {
  try {
    const { error } = await supabase
      .from('employees_cert')
      .delete()
      .eq('자격등록_id', certId);

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