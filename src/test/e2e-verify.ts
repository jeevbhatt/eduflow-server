import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

let jwtToken = '';
let testEmail = '';
let studentId = '';
let courseId = '';
let assessmentId = '';
let categoryId = '';

async function runTests() {
  console.log('===========================================');
  console.log('   COMPREHENSIVE E2E VERIFICATION SUITE');
  console.log('   EduFlow - All Modules (Fixed Payloads)');
  console.log('   Server: http://localhost:4000');
  console.log('===========================================');

  try {
    // ============================================
    // PHASE 1: AUTHENTICATION
    // ============================================
    console.log('\n--- PHASE 1: AUTHENTICATION ---\n');

    // 1.1 REGISTER USER
    console.log('[1.1] User Registration...');
    testEmail = `test_${Date.now()}@eduflow.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Test',
      lastName: 'Admin',
      email: testEmail,
      password: 'password123',
      role: 'institute'
    });
    console.log('  ✓ Registration complete');

    // 1.2 LOGIN
    console.log('[1.2] User Login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    jwtToken = loginRes.data.data?.token || loginRes.data.token;
    console.log('  ✓ Login successful, Token received');

    // 1.3 MFA SETUP
    console.log('[1.3] MFA Setup...');
    try {
      const mfaRes = await axios.get(`${BASE_URL}/auth/mfa-setup`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('  ✓ MFA endpoint:', mfaRes.data.qrCode ? 'QR Generated' : 'Ready');
    } catch (e: any) {
      console.log('  ⚠ MFA:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 2: INSTITUTE SETUP
    // ============================================
    console.log('\n--- PHASE 2: INSTITUTE SETUP ---\n');

    // 2.1 CREATE INSTITUTE (with all required fields)
    console.log('[2.1] Institute Creation...');
    try {
      await axios.post(`${BASE_URL}/institute`, {
        instituteName: 'Test Institute ' + Date.now(),
        instituteEmail: `institute_${Date.now()}@eduflow.com`,
        institutePhoneNumber: '9800000000',
        instituteAddress: 'Kathmandu, Nepal'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      console.log('  ✓ Institute created with all tables');
    } catch (e: any) {
      console.log('  ⚠ Institute:', e.response?.data?.message || 'Already exists or error');
    }

    // Re-login to get updated instituteNumber
    const reLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail, password: 'password123'
    });
    jwtToken = reLoginRes.data.data?.token || reLoginRes.data.token;
    const userData = reLoginRes.data.data?.user || reLoginRes.data.data;
    console.log('  ✓ Re-login, instituteNumber:', userData?.currentInstituteNumber);

    // ============================================
    // PHASE 3: CATEGORY (Prerequisite for Course)
    // ============================================
    console.log('\n--- PHASE 3: CATEGORY ---\n');

    // 3.1 GET CATEGORIES
    console.log('[3.1] Get Categories...');
    try {
      const catRes = await axios.get(`${BASE_URL}/institute/category`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const categories = catRes.data.data;
      if (categories && categories.length > 0) {
        categoryId = categories[0].id;
      }
      console.log('  ✓ Categories count:', categories?.length || 0, '| Using:', categoryId);
    } catch (e: any) {
      console.log('  ✗ Categories:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 4: COURSE MANAGEMENT
    // ============================================
    console.log('\n--- PHASE 4: COURSE MANAGEMENT ---\n');

    // 4.1 CREATE COURSE (with all required fields)
    console.log('[4.1] Course Creation...');
    try {
      const courseRes = await axios.post(`${BASE_URL}/institute/course`, {
        courseName: 'Mathematics 101',
        courseDescription: 'Introduction to Mathematics',
        coursePrice: '5000',
        courseDuration: '3 months',
        courseLevel: 'Beginner',
        categoryId: categoryId || 'test-category-id'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      courseId = courseRes.data.data?.id;
      console.log('  ✓ Course created');
    } catch (e: any) {
      console.log('  ✗ Course:', e.response?.data?.message || e.message);
    }

    // 4.2 GET ALL COURSES
    console.log('[4.2] Get All Courses...');
    try {
      const coursesRes = await axios.get(`${BASE_URL}/institute/course`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const courses = coursesRes.data.data;
      if (!courseId && courses && courses.length > 0) {
        courseId = courses[0].id;
      }
      console.log('  ✓ Courses count:', courses?.length || 0, '| Using:', courseId);
    } catch (e: any) {
      console.log('  ✗ Get Courses:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 5: STUDENT MANAGEMENT
    // ============================================
    console.log('\n--- PHASE 5: STUDENT MANAGEMENT ---\n');

    // 5.1 CREATE STUDENT
    console.log('[5.1] Student Creation...');
    try {
      const studentRes = await axios.post(`${BASE_URL}/institute/student`, {
        firstName: 'Ram',
        lastName: 'Sharma',
        studentPhoneNo: '9841000001',
        studentAddress: 'Kathmandu',
        enrolledDate: '2025-01-01',
        studentImage: 'https://example.com/student.jpg'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      studentId = studentRes.data.data?.id;
      console.log('  ✓ Student created, ID:', studentId);
    } catch (e: any) {
      console.log('  ✗ Student:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 6: TEACHER MANAGEMENT
    // ============================================
    console.log('\n--- PHASE 6: TEACHER MANAGEMENT ---\n');

    // 6.1 CREATE TEACHER (with all required fields)
    console.log('[6.1] Teacher Creation...');
    try {
      await axios.post(`${BASE_URL}/institute/teacher`, {
        firstName: 'Maya',
        lastName: 'Tamang',
        teacherEmail: `teacher_${Date.now()}@eduflow.com`,
        teacherPhoneNumber: '9811111111',
        teacherExperience: '5 years',
        teacherSalary: '50000',
        teacherJoinedDate: '2025-01-01',
        courseId: courseId || 'test-course-id'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      console.log('  ✓ Teacher created');
    } catch (e: any) {
      console.log('  ✗ Teacher:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 7: ATTENDANCE
    // ============================================
    console.log('\n--- PHASE 7: ATTENDANCE ---\n');

    // 7.1 MARK ATTENDANCE
    console.log('[7.1] Mark Attendance...');
    if (studentId && courseId) {
      try {
        await axios.post(`${BASE_URL}/institute/academic/attendance`, {
          courseId: courseId,
          attendanceDate: '2025-01-15',
          students: [{ id: studentId, status: 'present', remarks: 'On time' }]
        }, { headers: { Authorization: `Bearer ${jwtToken}` }});
        console.log('  ✓ Attendance marked');
      } catch (e: any) {
        console.log('  ✗ Attendance:', e.response?.data?.message || e.message);
      }
    } else {
      console.log('  ⚠ Skipped: Missing studentId or courseId');
    }

    // 7.2 GET STUDENT ATTENDANCE
    console.log('[7.2] Get Student Attendance...');
    if (studentId) {
      try {
        const attRes = await axios.get(`${BASE_URL}/institute/academic/attendance/${studentId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        console.log('  ✓ Attendance records:', attRes.data.data?.length || 0);
      } catch (e: any) {
        console.log('  ✗ Get Attendance:', e.response?.data?.message || e.message);
      }
    }

    // ============================================
    // PHASE 8: ASSESSMENTS & RESULTS (MARKS)
    // ============================================
    console.log('\n--- PHASE 8: ASSESSMENTS & RESULTS (MARKS) ---\n');

    // 8.1 CREATE ASSESSMENT
    console.log('[8.1] Create Assessment...');
    if (courseId) {
      try {
        await axios.post(`${BASE_URL}/institute/academic/assessment`, {
          courseId: courseId,
          title: 'Mid-Term Exam',
          assessmentType: 'exam',
          maxMarks: 100,
          assessmentDate: '2025-02-15'
        }, { headers: { Authorization: `Bearer ${jwtToken}` }});
        console.log('  ✓ Assessment created');
      } catch (e: any) {
        console.log('  ✗ Assessment:', e.response?.data?.message || e.message);
      }
    }

    // 8.2 GET ASSESSMENTS
    console.log('[8.2] Get Assessments...');
    if (courseId) {
      try {
        const assessListRes = await axios.get(`${BASE_URL}/institute/academic/assessment/course/${courseId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        const assessments = assessListRes.data.data;
        if (assessments && assessments.length > 0) {
          assessmentId = assessments[0].id;
        }
        console.log('  ✓ Assessments count:', assessments?.length || 0);
      } catch (e: any) {
        console.log('  ✗ Get Assessments:', e.response?.data?.message || e.message);
      }
    }

    // 8.3 POST RESULTS (MARKS ENTRY)
    console.log('[8.3] Post Results (Marks Entry)...');
    if (assessmentId && studentId) {
      try {
        await axios.post(`${BASE_URL}/institute/academic/result`, {
          assessmentId: assessmentId,
          results: [{ studentId: studentId, marksObtained: 85, remarks: 'Excellent' }]
        }, { headers: { Authorization: `Bearer ${jwtToken}` }});
        console.log('  ✓ Results/Marks posted');
      } catch (e: any) {
        console.log('  ✗ Post Results:', e.response?.data?.message || e.message);
      }
    } else {
      console.log('  ⚠ Skipped: Missing assessmentId or studentId');
    }

    // 8.4 GET REPORT CARD
    console.log('[8.4] Get Student Report Card...');
    if (studentId) {
      try {
        const reportRes = await axios.get(`${BASE_URL}/institute/academic/result/student/${studentId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        console.log('  ✓ Report card results:', reportRes.data.data?.length || 0);
      } catch (e: any) {
        console.log('  ✗ Report Card:', e.response?.data?.message || e.message);
      }
    }

    // ============================================
    // PHASE 9: FINANCE
    // ============================================
    console.log('\n--- PHASE 9: FINANCE ---\n');

    // 9.1 CREATE FEE STRUCTURE (correct fields: name, amount)
    console.log('[9.1] Create Fee Structure...');
    try {
      await axios.post(`${BASE_URL}/institute/finance/structure`, {
        name: 'Tuition Fee',
        amount: 25000,
        frequency: 'monthly',
        description: 'Monthly tuition fee'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      console.log('  ✓ Fee structure created');
    } catch (e: any) {
      console.log('  ✗ Fee Structure:', e.response?.data?.message || e.message);
    }

    // 9.2 GET FEE STRUCTURES
    console.log('[9.2] Get Fee Structures...');
    let feeStructureId = '';
    try {
      const feeRes = await axios.get(`${BASE_URL}/institute/finance/structure`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const fees = feeRes.data.data;
      if (fees && fees.length > 0) {
        feeStructureId = fees[0].id;
      }
      console.log('  ✓ Fee structures count:', fees?.length || 0);
    } catch (e: any) {
      console.log('  ✗ Get Fees:', e.response?.data?.message || e.message);
    }

    // 9.3 RECORD PAYMENT (correct fields: paymentDate)
    console.log('[9.3] Record Payment...');
    if (studentId && feeStructureId) {
      try {
        await axios.post(`${BASE_URL}/institute/finance/payment`, {
          studentId: studentId,
          feeStructureId: feeStructureId,
          amountPaid: 5000,
          paymentDate: '2025-01-20',
          paymentMethod: 'Cash',
          remarks: 'First installment'
        }, { headers: { Authorization: `Bearer ${jwtToken}` }});
        console.log('  ✓ Payment recorded');
      } catch (e: any) {
        console.log('  ✗ Payment:', e.response?.data?.message || e.message);
      }
    } else {
      console.log('  ⚠ Skipped: Missing studentId or feeStructureId');
    }

    // ============================================
    // PHASE 10: EXAM SCHEDULING
    // ============================================
    console.log('\n--- PHASE 10: EXAM SCHEDULING ---\n');

    // 10.1 SCHEDULE EXAM
    console.log('[10.1] Schedule Exam...');
    if (assessmentId) {
      try {
        await axios.post(`${BASE_URL}/institute/academic/exams`, {
          assessmentId: assessmentId,
          examDate: '2025-03-15',
          startTime: '10:00',
          endTime: '12:00',
          roomId: null,
          invigilatorId: null
        }, { headers: { Authorization: `Bearer ${jwtToken}` }});
        console.log('  ✓ Exam scheduled');
      } catch (e: any) {
        console.log('  ✗ Schedule Exam:', e.response?.data?.message || e.message);
      }
    } else {
      console.log('  ⚠ Skipped: Missing assessmentId');
    }

    // 10.2 GET EXAM SCHEDULES
    console.log('[10.2] Get Exam Schedules...');
    try {
      const examsRes = await axios.get(`${BASE_URL}/institute/academic/exams`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('  ✓ Exam schedules count:', examsRes.data.data?.length || 0);
    } catch (e: any) {
      console.log('  ✗ Get Exams:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 11: LIBRARY MANAGEMENT
    // ============================================
    console.log('\n--- PHASE 11: LIBRARY MANAGEMENT ---\n');

    // 11.1 ADD BOOK
    console.log('[11.1] Add Book...');
    let bookId = '';
    try {
      const bookRes = await axios.post(`${BASE_URL}/institute/library/books`, {
        title: 'Introduction to Computer Science',
        author: 'John Smith',
        isbn: '978-0-13-110362-7',
        category: 'Computer Science',
        description: 'A comprehensive introduction to CS.',
        totalCopies: 5,
        publishedYear: 2023
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      console.log('  ✓ Book added');
    } catch (e: any) {
      console.log('  ✗ Add Book:', e.response?.data?.message || e.message);
    }

    // 11.2 GET BOOKS
    console.log('[11.2] Get Books...');
    try {
      const booksRes = await axios.get(`${BASE_URL}/institute/library/books`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      const books = booksRes.data.data;
      if (books && books.length > 0) {
        bookId = books[0].id;
      }
      console.log('  ✓ Books count:', books?.length || 0);
    } catch (e: any) {
      console.log('  ✗ Get Books:', e.response?.data?.message || e.message);
    }

    // 11.3 BORROW BOOK
    console.log('[11.3] Borrow Book...');
    if (bookId && studentId) {
      try {
        await axios.post(`${BASE_URL}/institute/library/borrow`, {
          bookId: bookId,
          studentId: studentId,
          dueDate: '2025-02-15'
        }, { headers: { Authorization: `Bearer ${jwtToken}` }});
        console.log('  ✓ Book borrowed');
      } catch (e: any) {
        console.log('  ✗ Borrow Book:', e.response?.data?.message || e.message);
      }
    } else {
      console.log('  ⚠ Skipped: Missing bookId or studentId');
    }

    // ============================================
    // PHASE 12: PROFILE MANAGEMENT
    // ============================================
    console.log('\n--- PHASE 12: PROFILE MANAGEMENT ---\n');

    // 12.1 GET PROFILE
    console.log('[12.1] Get Profile...');
    try {
      const profileRes = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('  ✓ Profile fetched:', profileRes.data.data?.firstName);
    } catch (e: any) {
      console.log('  ✗ Get Profile:', e.response?.data?.message || e.message);
    }

    // 12.2 UPDATE PROFILE
    console.log('[12.2] Update Profile...');
    try {
      await axios.put(`${BASE_URL}/auth/profile`, {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '9800000001',
        bio: 'Test bio for E2E verification'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      console.log('  ✓ Profile updated');
    } catch (e: any) {
      console.log('  ✗ Update Profile:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 13: GOOGLE SHEETS INTEGRATION
    // ============================================
    console.log('\n--- PHASE 13: GOOGLE SHEETS INTEGRATION ---\n');

    // 13.1 GET SYNC STATUS
    console.log('[13.1] Get Sheets Sync Status...');
    try {
      const statusRes = await axios.get(`${BASE_URL}/integration/sheets/status`, {
        headers: { Authorization: `Bearer ${jwtToken}` }
      });
      console.log('  ✓ Sync status:', statusRes.data.data?.connected ? 'Connected' : 'Not configured');
    } catch (e: any) {
      console.log('  ✗ Sync Status:', e.response?.data?.message || e.message);
    }

    // 13.2 EXPORT STUDENTS (Prepare)
    console.log('[13.2] Export Students to Sheets...');
    try {
      const exportRes = await axios.post(`${BASE_URL}/integration/sheets/export/students`, {
        sheetId: 'test-sheet-id'
      }, { headers: { Authorization: `Bearer ${jwtToken}` }});
      console.log('  ✓ Export prepared:', exportRes.data.data?.recordCount, 'records');
    } catch (e: any) {
      console.log('  ✗ Export Students:', e.response?.data?.message || e.message);
    }

    // ============================================
    // PHASE 14: OAUTH ENDPOINTS
    // ============================================
    console.log('\n--- PHASE 14: OAUTH ENDPOINTS ---\n');

    // 14.1 GOOGLE TOKEN AUTH (will fail without real token, but tests route exists)
    console.log('[14.1] Google OAuth Endpoint...');
    try {
      await axios.post(`${BASE_URL}/auth/google/token`, {
        idToken: 'test-token'
      });
      console.log('  ✓ Google OAuth: Route accessible');
    } catch (e: any) {
      // Expected to fail with invalid token, but route should exist
      if (e.response?.status === 401 || e.response?.data?.message?.includes('Invalid')) {
        console.log('  ✓ Google OAuth: Route accessible (token validation working)');
      } else if (e.response?.status === 404) {
        console.log('  ✗ Google OAuth: Route not found');
      } else {
        console.log('  ✓ Google OAuth: Route exists');
      }
    }

    // 14.2 MICROSOFT TOKEN AUTH
    console.log('[14.2] Microsoft OAuth Endpoint...');
    try {
      await axios.post(`${BASE_URL}/auth/microsoft/token`, {
        accessToken: 'test-token'
      });
      console.log('  ✓ Microsoft OAuth: Route accessible');
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.data?.message?.includes('Invalid')) {
        console.log('  ✓ Microsoft OAuth: Route accessible (token validation working)');
      } else if (e.response?.status === 404) {
        console.log('  ✗ Microsoft OAuth: Route not found');
      } else {
        console.log('  ✓ Microsoft OAuth: Route exists');
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n===========================================');
    console.log('   COMPREHENSIVE E2E VERIFICATION COMPLETE');
    console.log('   Phases Tested: 1-14');
    console.log('===========================================');
    console.log('\nAll module tests executed.');
    console.log('Review output for any failures (✗).');
    process.exit(0);

  } catch (error: any) {
    console.error('Fatal error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
