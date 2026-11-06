const pool = require("../db");
const nodemailer = require("nodemailer");

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'mogesshitaw7707@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Ethiopian Higher Education Standard Grading Scale
const calculateGrade = (total) => {
  const score = Math.round(Number(total) * 100) / 100;
  if (score >= 90) return { grade: "A+", gradePoint: 4.0, status: "Excellent" };
  if (score >= 85) return { grade: "A", gradePoint: 4.0, status: "Excellent" };
  if (score >= 80) return { grade: "A-", gradePoint: 3.75, status: "Very Good" };
  if (score >= 75) return { grade: "B+", gradePoint: 3.5, status: "Very Good" };
  if (score >= 70) return { grade: "B", gradePoint: 3.0, status: "Good" };
  if (score >= 65) return { grade: "B-", gradePoint: 2.75, status: "Good" };
  if (score >= 60) return { grade: "C+", gradePoint: 2.5, status: "Satisfactory" };
  if (score >= 50) return { grade: "C", gradePoint: 2.0, status: "Satisfactory" };
  if (score >= 45) return { grade: "C-", gradePoint: 1.75, status: "Unsatisfactory" };
  if (score >= 40) return { grade: "D", gradePoint: 1.0, status: "Very Poor" };
  return { grade: "F", gradePoint: 0.0, status: "Fail" };
};

// Ensure student_evaluations table exists
const ensureTableExists = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS student_evaluations (
      id SERIAL PRIMARY KEY,
      student_id INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
      course_id INT NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
      instructor_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id INT REFERENCES departments(department_id) ON DELETE CASCADE,
      batch_id INT REFERENCES batches(batch_id) ON DELETE SET NULL,
      semester_id INT REFERENCES semesters(id) ON DELETE SET NULL,
      academic_year_id INT REFERENCES academic_year(id) ON DELETE SET NULL,
      section VARCHAR(10) NOT NULL,
      continuous_assessment NUMERIC(5,2) DEFAULT 0,
      mid_exam NUMERIC(5,2) DEFAULT 0,
      final_exam NUMERIC(5,2) DEFAULT 0,
      total_score NUMERIC(5,2) DEFAULT 0,
      letter_grade VARCHAR(5) DEFAULT 'F',
      grade_point NUMERIC(3,2) DEFAULT 0.00,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'locked', 'published')),
      is_result_published BOOLEAN DEFAULT FALSE,
      result_published_at TIMESTAMP,
      approved_by INT REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMP,
      locked_by INT REFERENCES users(id) ON DELETE SET NULL,
      locked_at TIMESTAMP,
      remarks TEXT,
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (student_id, course_id, section)
    );
  `;
  try {
    await pool.query(createTableQuery);
    // Add missing columns if table already exists
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS is_result_published BOOLEAN DEFAULT FALSE`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS result_published_at TIMESTAMP`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS academic_year_id INT REFERENCES academic_year(id) ON DELETE SET NULL`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS approved_by INT REFERENCES users(id) ON DELETE SET NULL`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS locked_by INT REFERENCES users(id) ON DELETE SET NULL`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD COLUMN IF NOT EXISTS remarks TEXT`).catch(() => {});
    // Extend the status check constraint safely
    await pool.query(`ALTER TABLE student_evaluations DROP CONSTRAINT IF EXISTS student_evaluations_status_check`).catch(() => {});
    await pool.query(`ALTER TABLE student_evaluations ADD CONSTRAINT student_evaluations_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'locked', 'published'))`).catch(() => {});
  } catch (error) {
    console.error("Error ensuring student_evaluations table exists:", error);
  }
};

ensureTableExists();

// 1. Get all assigned courses & sections for the instructor
const getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user?.id || req.query.instructor_id;

    if (!instructorId) {
      return res.status(400).json({ success: false, error: "Instructor ID is required" });
    }

    // Query both course_section_instructor_assign and day_courses schedules
    const query = `
      WITH assigned_courses AS (
        SELECT 
          c.course_id,
          c.course_code,
          c.course_name,
          c.credit_hour,
          csia.section,
          cb.batch as batch_id,
          b.batch_year,
          cb.semester_id,
          sem.semester as semester_name,
          cb.department_id,
          d.department_name
        FROM course_section_instructor_assign csia
        JOIN course_batch cb ON csia.course_batch_id = cb.id
        JOIN course c ON cb.course_id = c.course_id
        JOIN departments d ON cb.department_id = d.department_id
        LEFT JOIN batches b ON cb.batch = b.batch_id
        LEFT JOIN semesters sem ON cb.semester_id = sem.id
        WHERE csia.instructor_id = $1

        UNION

        SELECT 
          c.course_id,
          c.course_code,
          c.course_name,
          c.credit_hour,
          s.section,
          s.batch_id,
          ba.batch_year,
          s.semester_id,
          sem.semester as semester_name,
          s.department_id,
          d.department_name
        FROM day_courses dc
        JOIN day_schedules ds ON dc.day_schedule_id = ds.id
        JOIN schedules s ON ds.schedule_id = s.id
        JOIN course c ON dc.course_id = c.course_id
        JOIN departments d ON s.department_id = d.department_id
        LEFT JOIN batches ba ON s.batch_id = ba.batch_id
        LEFT JOIN semesters sem ON s.semester_id = sem.id
        WHERE dc.instructor_id = $1
      )
      SELECT DISTINCT * FROM assigned_courses
      ORDER BY course_code, section;
    `;

    const { rows } = await pool.query(query, [instructorId]);
    res.json({ success: true, courses: rows });
  } catch (err) {
    console.error("getInstructorCourses error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch instructor courses" });
  }
};

// 2. Get enrolled students and their evaluation marks for a course and section
const getCourseEvaluations = async (req, res) => {
  try {
    const { course_id, section, department_id, batch_id, semester_id, academic_year_id } = req.query;

    if (!course_id || !section) {
      return res.status(400).json({ success: false, error: "course_id and section are required" });
    }

    // Build student query
    let studentQuery = `
      SELECT 
        s.student_id,
        s.student_number,
        s.full_name,
        s.email,
        s.gender,
        s.section,
        s.status as student_status,
        d.department_name,
        b.batch_year,
        sem.semester as semester_name,
        ay.academic_year as academic_year_name,
        COALESCE(se.id, NULL) as evaluation_id,
        COALESCE(se.academic_year_id, NULL) as academic_year_id,
        COALESCE(se.continuous_assessment, 0) as continuous_assessment,
        COALESCE(se.mid_exam, 0) as mid_exam,
        COALESCE(se.final_exam, 0) as final_exam,
        COALESCE(se.total_score, 0) as total_score,
        COALESCE(se.letter_grade, 'F') as letter_grade,
        COALESCE(se.grade_point, 0.00) as grade_point,
        COALESCE(se.status, 'draft') as evaluation_status,
        COALESCE(se.feedback, '') as feedback,
        se.updated_at as evaluated_at,
        se.approved_at,
        se.locked_at,
        se.remarks,
        u_app.full_name as approved_by_name,
        u_lock.full_name as locked_by_name
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN batches b ON s.batch_id = b.batch_id
      LEFT JOIN semesters sem ON s.semester_id = sem.id
      LEFT JOIN student_evaluations se ON se.student_id = s.student_id 
        AND se.course_id = $1 
        AND se.section = $2
      LEFT JOIN academic_year ay ON se.academic_year_id = ay.id
      LEFT JOIN users u_app ON se.approved_by = u_app.id
      LEFT JOIN users u_lock ON se.locked_by = u_lock.id
      WHERE s.status = 'Active'
        AND s.section = $2
    `;

    const queryParams = [Number(course_id), section];
    let paramIndex = 3;

    if (department_id) {
      studentQuery += ` AND s.department_id = $${paramIndex++}`;
      queryParams.push(Number(department_id));
    }

    if (batch_id) {
      studentQuery += ` AND s.batch_id = $${paramIndex++}`;
      queryParams.push(Number(batch_id));
    }

    if (academic_year_id) {
      studentQuery += ` AND (se.academic_year_id = $${paramIndex++} OR se.academic_year_id IS NULL)`;
      queryParams.push(Number(academic_year_id));
    }

    studentQuery += ` ORDER BY s.student_number ASC`;

    const { rows } = await pool.query(studentQuery, queryParams);

    // Course info
    const courseRes = await pool.query(
      `SELECT course_id, course_code, course_name, credit_hour FROM course WHERE course_id = $1`,
      [Number(course_id)]
    );

    // Compute section overall status & metadata
    let sectionStatus = "not_started";
    let approvedAt = null;
    let approvedByName = null;
    let lockedAt = null;
    let lockedByName = null;
    let remarks = null;

    const evaluatedRows = rows.filter((r) => r.evaluation_id);
    if (evaluatedRows.length > 0) {
      if (evaluatedRows.some((r) => r.evaluation_status === "locked")) {
        sectionStatus = "locked";
      } else if (evaluatedRows.some((r) => r.evaluation_status === "approved")) {
        sectionStatus = "approved";
      } else if (evaluatedRows.some((r) => r.evaluation_status === "published")) {
        sectionStatus = "published";
      } else if (evaluatedRows.some((r) => r.evaluation_status === "submitted")) {
        sectionStatus = "submitted";
      } else {
        sectionStatus = "draft";
      }

      const withApproval = evaluatedRows.find((r) => r.approved_at);
      if (withApproval) {
        approvedAt = withApproval.approved_at;
        approvedByName = withApproval.approved_by_name;
      }
      const withLock = evaluatedRows.find((r) => r.locked_at);
      if (withLock) {
        lockedAt = withLock.locked_at;
        lockedByName = withLock.locked_by_name;
      }
      const withRemarks = evaluatedRows.find((r) => r.remarks);
      if (withRemarks) {
        remarks = withRemarks.remarks;
      }
    }

    res.json({
      success: true,
      course: courseRes.rows[0] || null,
      section_status: sectionStatus,
      section_metadata: {
        approved_at: approvedAt,
        approved_by_name: approvedByName,
        locked_at: lockedAt,
        locked_by_name: lockedByName,
        remarks: remarks,
      },
      students: rows,
    });
  } catch (err) {
    console.error("getCourseEvaluations error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch student evaluations" });
  }
};

// 3. Batch save or update evaluations for a class
const saveEvaluations = async (req, res) => {
  const client = await pool.connect();
  try {
    const instructorId = req.user?.id || req.body.instructor_id;
    const {
      course_id,
      section,
      department_id,
      batch_id,
      semester_id,
      academic_year_id,
      evaluations, // array of { student_id, continuous_assessment, mid_exam, final_exam, feedback, status }
      is_final_submission,
    } = req.body;

    if (!course_id || !section || !Array.isArray(evaluations)) {
      return res.status(400).json({
        success: false,
        error: "course_id, section, and an evaluations array are required",
      });
    }

    await client.query("BEGIN");

    // Guard: Prevent modifications if results are already approved or locked
    const lockCheck = await client.query(
      `SELECT status FROM student_evaluations WHERE course_id = $1 AND section = $2 LIMIT 1`,
      [Number(course_id), section]
    );

    if (lockCheck.rows.length > 0) {
      const existingSecStatus = lockCheck.rows[0].status;
      if (existingSecStatus === "locked" || existingSecStatus === "approved") {
        await client.query("ROLLBACK");
        return res.status(403).json({
          success: false,
          error: `Grades cannot be modified. The evaluations for this section have already been ${existingSecStatus.toUpperCase()} by the Department Head. Please contact your Department Head to unlock them if revisions are needed.`,
        });
      }
    }

    const savedRecords = [];
    const evaluationStatus = is_final_submission ? "submitted" : "draft";

    for (const item of evaluations) {
      const studentId = Number(item.student_id);
      const ca = Math.max(0, Math.min(100, Number(item.continuous_assessment || 0)));
      const mid = Math.max(0, Math.min(100, Number(item.mid_exam || 0)));
      const final = Math.max(0, Math.min(100, Number(item.final_exam || 0)));
      const totalScore = Math.min(100, Math.round((ca + mid + final) * 100) / 100);
      const { grade, gradePoint } = calculateGrade(totalScore);
      const feedback = item.feedback || null;

      const upsertQuery = `
        INSERT INTO student_evaluations (
          student_id,
          course_id,
          instructor_id,
          department_id,
          batch_id,
          semester_id,
          academic_year_id,
          section,
          continuous_assessment,
          mid_exam,
          final_exam,
          total_score,
          letter_grade,
          grade_point,
          status,
          feedback,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        ON CONFLICT (student_id, course_id, section)
        DO UPDATE SET
          instructor_id = EXCLUDED.instructor_id,
          department_id = COALESCE(EXCLUDED.department_id, student_evaluations.department_id),
          batch_id = COALESCE(EXCLUDED.batch_id, student_evaluations.batch_id),
          semester_id = COALESCE(EXCLUDED.semester_id, student_evaluations.semester_id),
          academic_year_id = COALESCE(EXCLUDED.academic_year_id, student_evaluations.academic_year_id),
          continuous_assessment = EXCLUDED.continuous_assessment,
          mid_exam = EXCLUDED.mid_exam,
          final_exam = EXCLUDED.final_exam,
          total_score = EXCLUDED.total_score,
          letter_grade = EXCLUDED.letter_grade,
          grade_point = EXCLUDED.grade_point,
          status = EXCLUDED.status,
          feedback = EXCLUDED.feedback,
          updated_at = NOW()
        RETURNING *;
      `;

      const result = await client.query(upsertQuery, [
        studentId,
        Number(course_id),
        instructorId,
        department_id ? Number(department_id) : null,
        batch_id ? Number(batch_id) : null,
        semester_id ? Number(semester_id) : null,
        academic_year_id ? Number(academic_year_id) : null,
        section,
        ca,
        mid,
        final,
        totalScore,
        grade,
        gradePoint,
        evaluationStatus,
        feedback,
      ]);

      savedRecords.push(result.rows[0]);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: is_final_submission
        ? "Grades submitted and finalized successfully"
        : "Evaluations saved successfully",
      saved_count: savedRecords.length,
      records: savedRecords,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("saveEvaluations error:", err);
    res.status(500).json({ success: false, error: "Failed to save evaluations" });
  } finally {
    client.release();
  }
};

// 4. Get evaluation analytics summary for a course section
const getEvaluationSummary = async (req, res) => {
  try {
    const { course_id, section } = req.query;

    if (!course_id || !section) {
      return res.status(400).json({ success: false, error: "course_id and section are required" });
    }

    const statsQuery = `
      SELECT 
        COUNT(*)::int as total_evaluated,
        ROUND(AVG(total_score), 2) as average_score,
        MAX(total_score) as highest_score,
        MIN(total_score) as lowest_score,
        COUNT(CASE WHEN total_score >= 50 THEN 1 END)::int as passed_count,
        COUNT(CASE WHEN total_score < 50 THEN 1 END)::int as failed_count,
        ROUND(COUNT(CASE WHEN total_score >= 50 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as pass_rate
      FROM student_evaluations
      WHERE course_id = $1 AND section = $2;
    `;

    const gradeDistQuery = `
      SELECT letter_grade, COUNT(*)::int as count
      FROM student_evaluations
      WHERE course_id = $1 AND section = $2
      GROUP BY letter_grade
      ORDER BY letter_grade;
    `;

    const [statsResult, distResult] = await Promise.all([
      pool.query(statsQuery, [Number(course_id), section]),
      pool.query(gradeDistQuery, [Number(course_id), section]),
    ]);

    const gradeOrder = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
    const gradeDistribution = gradeOrder.map((g) => {
      const match = distResult.rows.find((r) => r.letter_grade === g);
      return { grade: g, count: match ? match.count : 0 };
    });

    res.json({
      success: true,
      summary: statsResult.rows[0] || {},
      distribution: gradeDistribution,
    });
  } catch (err) {
    console.error("getEvaluationSummary error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch evaluation summary" });
  }
};

// 5. Publish results for a course section so students can view them
const publishResults = async (req, res) => {
  const client = await pool.connect();
  try {
    const instructorId = req.user?.id || req.body.instructor_id;
    const { course_id, section, department_id, batch_id, semester_id } = req.body;

    if (!course_id || !section) {
      return res.status(400).json({ success: false, error: "course_id and section are required" });
    }

    await client.query("BEGIN");

    // Mark all evaluations for this course+section as published
    const updateResult = await client.query(
      `UPDATE student_evaluations
       SET is_result_published = TRUE,
           result_published_at = NOW(),
           status = 'published',
           updated_at = NOW()
       WHERE course_id = $1 AND section = $2
       RETURNING student_id`,
      [Number(course_id), section]
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "No evaluations found for this course and section to publish" });
    }

    // Fetch course info for email
    const courseRes = await client.query(
      `SELECT course_code, course_name FROM course WHERE course_id = $1`,
      [Number(course_id)]
    );
    const course = courseRes.rows[0];

    // Fetch instructor name
    const instructorRes = await client.query(
      `SELECT full_name FROM users WHERE id = $1`,
      [instructorId]
    );
    const instructorName = instructorRes.rows[0]?.full_name || "Your Instructor";

    // Fetch published students' emails & results
    const publishedStudentIds = updateResult.rows.map(r => r.student_id);
    const studentsRes = await client.query(
      `SELECT s.student_id, s.full_name, s.email,
              se.total_score, se.letter_grade, se.grade_point,
              se.continuous_assessment, se.mid_exam, se.final_exam, se.feedback
       FROM students s
       JOIN student_evaluations se ON se.student_id = s.student_id
       WHERE s.student_id = ANY($1) AND se.course_id = $2 AND se.section = $3`,
      [publishedStudentIds, Number(course_id), section]
    );

    // Also post an official announcement so it appears in the student announcements feed
    try {
      let deptIdToUse = department_id;
      if (!deptIdToUse) {
        const deptLookup = await client.query(
          `SELECT department_id FROM course WHERE course_id = $1`,
          [Number(course_id)]
        );
        deptIdToUse = deptLookup.rows[0]?.department_id || null;
      }

      if (deptIdToUse) {
        const announcementTitle = `📢 Results Released: ${course?.course_code || "Course"} - ${course?.course_name || ""} (Sec. ${section})`;
        const announcementContent = `Academic evaluation results for ${course?.course_code || ""} - ${course?.course_name || ""} (Section ${section}) have been published by ${instructorName}. All enrolled students can now log in to the student portal and view their detailed scores, grade breakdown, and remarks under the "My Results" tab.`;

        await client.query(
          `INSERT INTO announcements (title, content, author_id, department_id, priority, is_published, publish_at)
           VALUES ($1, $2, $3, $4, 'high', true, NOW())`,
          [announcementTitle, announcementContent, instructorRes.rows[0] ? instructorId : null, deptIdToUse]
        );
      }
    } catch (annError) {
      console.warn("Could not create announcement record:", annError.message);
    }

    await client.query("COMMIT");

    // Send email notifications to each student
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resultsUrl = `${frontendUrl}/dashboard/student/results`;

    for (const student of studentsRes.rows) {
      const gradeColor = student.total_score >= 50 ? '#16a34a' : '#dc2626';
      const passText = student.total_score >= 50 ? 'PASSED ✓' : 'FAILED ✗';

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Debre Berhan University" <dbuuniversity@gmail.com>',
        to: student.email,
        subject: `📊 Your Result for ${course?.course_code} Has Been Released`,
        html: `
        <div style="background:#f3f4f6;padding:20px;font-family:Arial,Helvetica,sans-serif">
          <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#1e40af,#4f46e5);color:#fff;padding:28px;text-align:center">
              <h2 style="margin:0;font-size:22px">📊 Result Release Notification</h2>
              <p style="margin:8px 0 0;font-size:14px;opacity:0.9">Debre Berhan University</p>
            </div>
            <div style="padding:28px;color:#111827">
              <p style="font-size:16px">Hello <strong>${student.full_name}</strong>,</p>
              <p style="font-size:14px;color:#374151">Your result for the following course has been officially released by <strong>${instructorName}</strong>.</p>
              <div style="background:#f9fafb;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #e5e7eb">
                <h3 style="margin:0 0 16px;color:#1e40af;font-size:16px">${course?.course_code} – ${course?.course_name}</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr style="background:#eff6ff">
                    <td style="padding:8px 12px;font-weight:600;color:#374151">Continuous Assessment</td>
                    <td style="padding:8px 12px;text-align:right">${Number(student.continuous_assessment).toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;font-weight:600;color:#374151">Mid Exam</td>
                    <td style="padding:8px 12px;text-align:right">${Number(student.mid_exam).toFixed(1)}</td>
                  </tr>
                  <tr style="background:#eff6ff">
                    <td style="padding:8px 12px;font-weight:600;color:#374151">Final Exam</td>
                    <td style="padding:8px 12px;text-align:right">${Number(student.final_exam).toFixed(1)}</td>
                  </tr>
                  <tr style="border-top:2px solid #e5e7eb">
                    <td style="padding:10px 12px;font-weight:700;color:#111827;font-size:15px">Total Score</td>
                    <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:15px;color:${gradeColor}">${Number(student.total_score).toFixed(1)} / 100</td>
                  </tr>
                  <tr style="background:#eff6ff">
                    <td style="padding:8px 12px;font-weight:600;color:#374151">Letter Grade</td>
                    <td style="padding:8px 12px;text-align:right;font-weight:700;color:${gradeColor}">${student.letter_grade}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 12px;font-weight:600;color:#374151">Grade Points</td>
                    <td style="padding:8px 12px;text-align:right">${Number(student.grade_point).toFixed(2)}</td>
                  </tr>
                  <tr style="background:#eff6ff">
                    <td style="padding:8px 12px;font-weight:600;color:#374151">Status</td>
                    <td style="padding:8px 12px;text-align:right;font-weight:700;color:${gradeColor}">${passText}</td>
                  </tr>
                  ${student.feedback ? `<tr><td style="padding:8px 12px;font-weight:600;color:#374151">Instructor Remarks</td><td style="padding:8px 12px;text-align:right;font-style:italic;color:#6b7280">${student.feedback}</td></tr>` : ''}
                </table>
              </div>
              <div style="text-align:center;margin:24px 0">
                <a href="${resultsUrl}" style="background:linear-gradient(135deg,#1e40af,#4f46e5);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">View All My Results</a>
              </div>
              <p style="font-size:12px;color:#9ca3af;text-align:center">If the button does not work, visit: <a href="${resultsUrl}" style="color:#1e40af">${resultsUrl}</a></p>
            </div>
            <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#6b7280">
              © ${new Date().getFullYear()} Debre Berhan University – This is an automated message, please do not reply.
            </div>
          </div>
        </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Result email sent to: ${student.email}`);
      } catch (emailErr) {
        console.error(`Failed to send email to ${student.email}:`, emailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Results published and email notifications sent to ${studentsRes.rows.length} student(s).`,
      published_count: updateResult.rowCount,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("publishResults error:", err);
    res.status(500).json({ success: false, error: "Failed to publish results" });
  } finally {
    client.release();
  }
};

// 6. Get a student's own published results (for student dashboard)
const getStudentResults = async (req, res) => {
  try {
    const studentId =
      req.user?.student_id ||
      req.user?.id ||
      req.session?.user?.student_id ||
      req.session?.user?.id ||
      req.query.student_id;

    if (!studentId) {
      return res.status(400).json({ success: false, error: "Student ID is required" });
    }

    const query = `
      SELECT
        se.id,
        se.course_id,
        c.course_code,
        c.course_name,
        c.credit_hour,
        se.section,
        d.department_name,
        b.batch_year,
        sem.semester as semester_name,
        ay.academic_year as academic_year_name,
        u.full_name as instructor_name,
        se.continuous_assessment,
        se.mid_exam,
        se.final_exam,
        se.total_score,
        se.letter_grade,
        se.grade_point,
        se.feedback,
        se.status,
        se.is_result_published,
        se.result_published_at,
        se.updated_at
      FROM student_evaluations se
      JOIN course c ON se.course_id = c.course_id
      LEFT JOIN departments d ON se.department_id = d.department_id
      LEFT JOIN batches b ON se.batch_id = b.batch_id
      LEFT JOIN semesters sem ON se.semester_id = sem.id
      LEFT JOIN academic_year ay ON se.academic_year_id = ay.id
      LEFT JOIN users u ON se.instructor_id = u.id
      WHERE se.student_id = $1
        AND se.is_result_published = TRUE
      ORDER BY se.result_published_at DESC
    `;

    const { rows } = await pool.query(query, [Number(studentId)]);

    res.json({ success: true, results: rows });
  } catch (err) {
    console.error("getStudentResults error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch student results" });
  }
};

// 7. Export evaluations data for Excel export (returns JSON with full details)
const exportEvaluations = async (req, res) => {
  try {
    const { course_id, section, department_id, batch_id, semester_id, academic_year_id } = req.query;

    if (!course_id || !section) {
      return res.status(400).json({ success: false, error: "course_id and section are required" });
    }

    let query = `
      SELECT
        s.student_number,
        s.full_name,
        s.gender,
        s.email,
        d.department_name,
        b.batch_year,
        sem.semester as semester_name,
        ay.academic_year as academic_year_name,
        se.section,
        c.course_code,
        c.course_name,
        c.credit_hour,
        u.full_name as instructor_name,
        COALESCE(se.continuous_assessment, 0) as continuous_assessment,
        COALESCE(se.mid_exam, 0) as mid_exam,
        COALESCE(se.final_exam, 0) as final_exam,
        COALESCE(se.total_score, 0) as total_score,
        COALESCE(se.letter_grade, 'F') as letter_grade,
        COALESCE(se.grade_point, 0.00) as grade_point,
        COALESCE(se.feedback, '') as feedback,
        COALESCE(se.status, 'draft') as evaluation_status,
        se.updated_at as evaluated_at
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN batches b ON s.batch_id = b.batch_id
      LEFT JOIN semesters sem ON s.semester_id = sem.id
      LEFT JOIN student_evaluations se ON se.student_id = s.student_id
        AND se.course_id = $1
        AND se.section = $2
      LEFT JOIN academic_year ay ON se.academic_year_id = ay.id
      LEFT JOIN course c ON se.course_id = c.course_id
      LEFT JOIN users u ON se.instructor_id = u.id
      WHERE s.status = 'Active'
        AND s.section = $2
    `;

    const queryParams = [Number(course_id), section];
    let paramIndex = 3;

    if (department_id) {
      query += ` AND s.department_id = $${paramIndex++}`;
      queryParams.push(Number(department_id));
    }
    if (batch_id) {
      query += ` AND s.batch_id = $${paramIndex++}`;
      queryParams.push(Number(batch_id));
    }
    if (academic_year_id) {
      query += ` AND (se.academic_year_id = $${paramIndex++} OR se.academic_year_id IS NULL)`;
      queryParams.push(Number(academic_year_id));
    }

    query += ` ORDER BY s.student_number ASC`;

    const { rows } = await pool.query(query, queryParams);

    // Fetch course info for header
    const courseRes = await pool.query(
      `SELECT course_id, course_code, course_name, credit_hour FROM course WHERE course_id = $1`,
      [Number(course_id)]
    );

    // Fetch academic year info if provided
    let academicYearInfo = null;
    if (academic_year_id) {
      const ayRes = await pool.query(
        `SELECT ay.academic_year, s.semester, b.batch_year FROM academic_year ay
         LEFT JOIN semesters s ON s.id = ay.semester_id
         LEFT JOIN batches b ON b.batch_id = ay.batch_id
         WHERE ay.id = $1`,
        [Number(academic_year_id)]
      );
      academicYearInfo = ayRes.rows[0] || null;
    }

    res.json({
      success: true,
      course: courseRes.rows[0] || null,
      academic_year: academicYearInfo,
      students: rows,
      exported_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("exportEvaluations error:", err);
    res.status(500).json({ success: false, error: "Failed to export evaluations" });
  }
};

// 8. Department Head: Get all assigned course sections in the department with evaluation stats and statuses
const getDepartmentEvaluationSections = async (req, res) => {
  try {
    const departmentId = req.user?.department_id || req.query.department_id || null;
    const { semester_id, batch_id, status } = req.query;

    const query = `
      WITH dept_sections AS (
        SELECT DISTINCT
          cb.course_id,
          csia.section,
          cb.batch as batch_id,
          cb.semester_id,
          cb.department_id,
          csia.instructor_id
        FROM course_section_instructor_assign csia
        JOIN course_batch cb ON csia.course_batch_id = cb.id
        WHERE csia.section IS NOT NULL
          AND ($1::int IS NULL OR cb.department_id = $1)

        UNION

        SELECT DISTINCT
          dc.course_id,
          s.section,
          s.batch_id,
          s.semester_id,
          s.department_id,
          dc.instructor_id
        FROM day_courses dc
        JOIN day_schedules ds ON dc.day_schedule_id = ds.id
        JOIN schedules s ON ds.schedule_id = s.id
        WHERE s.section IS NOT NULL
          AND ($1::int IS NULL OR s.department_id = $1)

        UNION

        SELECT DISTINCT
          se.course_id,
          se.section,
          se.batch_id,
          se.semester_id,
          se.department_id,
          se.instructor_id
        FROM student_evaluations se
        WHERE se.section IS NOT NULL
          AND ($1::int IS NULL OR se.department_id = $1)
      )
      SELECT 
        ds.course_id,
        c.course_code,
        c.course_name,
        c.credit_hour,
        ds.section,
        ds.batch_id,
        b.batch_year,
        ds.semester_id,
        sem.semester as semester_name,
        ds.department_id,
        d.department_name,
        ds.instructor_id,
        u.full_name as instructor_name,
        u.email as instructor_email,
        COALESCE((
          SELECT COUNT(*)::int FROM students stu 
          WHERE stu.status = 'Active' 
            AND (stu.department_id = ds.department_id OR ds.department_id IS NULL)
            AND (stu.batch_id = ds.batch_id OR ds.batch_id IS NULL)
            AND stu.section = ds.section
        ), 0) as total_enrolled,
        COUNT(se.id)::int as evaluated_count,
        ROUND(AVG(se.total_score), 1) as average_score,
        MAX(se.total_score) as highest_score,
        MIN(se.total_score) as lowest_score,
        COUNT(CASE WHEN se.total_score >= 50 THEN 1 END)::int as passed_count,
        COUNT(CASE WHEN se.total_score < 50 THEN 1 END)::int as failed_count,
        ROUND(COUNT(CASE WHEN se.total_score >= 50 THEN 1 END) * 100.0 / NULLIF(COUNT(se.id), 0), 1) as pass_rate,
        CASE 
          WHEN COUNT(se.id) = 0 THEN 'not_started'
          WHEN BOOL_OR(se.status = 'locked') THEN 'locked'
          WHEN BOOL_OR(se.status = 'approved') THEN 'approved'
          WHEN BOOL_OR(se.status = 'published') THEN 'published'
          WHEN BOOL_OR(se.status = 'submitted') THEN 'submitted'
          ELSE 'draft'
        END as overall_status,
        MAX(se.approved_at) as approved_at,
        MAX(u_app.full_name) as approved_by_name,
        MAX(se.locked_at) as locked_at,
        MAX(u_lock.full_name) as locked_by_name,
        MAX(se.remarks) as remarks,
        MAX(se.updated_at) as last_updated
      FROM dept_sections ds
      JOIN course c ON ds.course_id = c.course_id
      LEFT JOIN departments d ON ds.department_id = d.department_id
      LEFT JOIN batches b ON ds.batch_id = b.batch_id
      LEFT JOIN semesters sem ON ds.semester_id = sem.id
      LEFT JOIN users u ON ds.instructor_id = u.id
      LEFT JOIN student_evaluations se ON se.course_id = ds.course_id AND se.section = ds.section
      LEFT JOIN users u_app ON se.approved_by = u_app.id
      LEFT JOIN users u_lock ON se.locked_by = u_lock.id
      WHERE ($1::int IS NULL OR ds.department_id = $1)
      GROUP BY 
        ds.course_id, c.course_code, c.course_name, c.credit_hour, ds.section,
        ds.batch_id, b.batch_year, ds.semester_id, sem.semester,
        ds.department_id, d.department_name, ds.instructor_id, u.full_name, u.email
      ORDER BY c.course_code, ds.section;
    `;

    const deptParam = departmentId ? Number(departmentId) : null;
    const { rows } = await pool.query(query, [deptParam]);

    // Apply optional client query filters
    let filtered = rows;
    if (semester_id && semester_id !== "ALL") {
      filtered = filtered.filter((r) => String(r.semester_id) === String(semester_id));
    }
    if (batch_id && batch_id !== "ALL") {
      filtered = filtered.filter((r) => String(r.batch_id) === String(batch_id));
    }
    if (status && status !== "ALL") {
      filtered = filtered.filter((r) => r.overall_status === status);
    }

    // Deduplicate: if same course+section+batch+semester appears multiple times
    // (e.g. assigned via both course_section_instructor_assign and day_courses),
    // keep the row with the most evaluations (or the first one).
    const seen = new Map();
    filtered = filtered.filter((r) => {
      const key = `${r.course_id}-${r.section}-${r.batch_id}-${r.semester_id}-${r.department_id}`;
      if (seen.has(key)) {
        // Keep the one with more evaluated students
        const existing = seen.get(key);
        if (Number(r.evaluated_count) > Number(existing.evaluated_count)) {
          seen.set(key, r);
          return true; // Replace — handled by splice below
        }
        return false;
      }
      seen.set(key, r);
      return true;
    });

    // Compute department summary stats
    const totalSections = filtered.length;
    const submittedCount = filtered.filter((r) => r.overall_status === "submitted").length;
    const approvedCount = filtered.filter((r) => r.overall_status === "approved").length;
    const lockedCount = filtered.filter((r) => r.overall_status === "locked").length;
    const draftCount = filtered.filter((r) => r.overall_status === "draft").length;
    const publishedCount = filtered.filter((r) => r.overall_status === "published").length;
    const notStartedCount = filtered.filter((r) => r.overall_status === "not_started").length;

    res.json({
      success: true,
      stats: {
        total_sections: totalSections,
        submitted: submittedCount,
        approved: approvedCount,
        locked: lockedCount,
        draft: draftCount,
        published: publishedCount,
        not_started: notStartedCount,
      },
      sections: filtered,
    });
  } catch (err) {
    console.error("getDepartmentEvaluationSections error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch department evaluation sections" });
  }
};

// 9. Department Head: Update evaluation status (approve, lock, or revert to draft)
const updateDepartmentEvaluationStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const headId = req.user?.id || req.body.head_id;
    const { course_id, section, status, remarks } = req.body;

    if (!course_id || !section || !status) {
      return res.status(400).json({
        success: false,
        error: "course_id, section, and status are required",
      });
    }

    if (!["approved", "locked", "draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Allowed values: approved, locked, draft",
      });
    }

    await client.query("BEGIN");

    // Check if any evaluations exist
    const checkRes = await client.query(
      `SELECT COUNT(*)::int as count FROM student_evaluations WHERE course_id = $1 AND section = $2`,
      [Number(course_id), section]
    );

    if (checkRes.rows[0].count === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        error: "No student evaluations found for this course and section to update",
      });
    }

    let updateQuery = "";
    let params = [];

    if (status === "approved") {
      updateQuery = `
        UPDATE student_evaluations
        SET status = 'approved',
            approved_by = $3,
            approved_at = NOW(),
            remarks = COALESCE($4, remarks),
            updated_at = NOW()
        WHERE course_id = $1 AND section = $2
        RETURNING id, student_id, status, approved_at;
      `;
      params = [Number(course_id), section, headId || null, remarks || null];
    } else if (status === "locked") {
      updateQuery = `
        UPDATE student_evaluations
        SET status = 'locked',
            locked_by = $3,
            locked_at = NOW(),
            remarks = COALESCE($4, remarks),
            updated_at = NOW()
        WHERE course_id = $1 AND section = $2
        RETURNING id, student_id, status, locked_at;
      `;
      params = [Number(course_id), section, headId || null, remarks || null];
    } else if (status === "draft") {
      // Revert to draft (send back for instructor revision)
      updateQuery = `
        UPDATE student_evaluations
        SET status = 'draft',
            approved_by = NULL,
            approved_at = NULL,
            locked_by = NULL,
            locked_at = NULL,
            remarks = $3,
            updated_at = NOW()
        WHERE course_id = $1 AND section = $2
        RETURNING id, student_id, status;
      `;
      params = [Number(course_id), section, remarks || "Reverted to draft by Department Head for revision"];
    }

    const result = await client.query(updateQuery, params);
    await client.query("COMMIT");

    const statusMessages = {
      approved: "Results successfully approved by Department Head.",
      locked: "Results officially locked. Grade records are now frozen.",
      draft: "Results reverted to draft and unlocked for instructor revision.",
    };

    res.json({
      success: true,
      message: statusMessages[status],
      status,
      updated_count: result.rowCount,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateDepartmentEvaluationStatus error:", err);
    res.status(500).json({ success: false, error: "Failed to update evaluation status" });
  } finally {
    client.release();
  }
};

// 10. Department Head: Get all assigned courses & sections within their department (for grading directly)
const getDeptHeadCourses = async (req, res) => {
  try {
    const departmentId = req.user?.department_id || req.query.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: "Department ID is required" });
    }

    const query = `
      WITH dept_courses AS (
        SELECT 
          c.course_id,
          c.course_code,
          c.course_name,
          c.credit_hour,
          csia.section,
          cb.batch as batch_id,
          b.batch_year,
          cb.semester_id,
          sem.semester as semester_name,
          cb.department_id,
          d.department_name,
          u.id as instructor_id,
          u.full_name as instructor_name
        FROM course_section_instructor_assign csia
        JOIN course_batch cb ON csia.course_batch_id = cb.id
        JOIN course c ON cb.course_id = c.course_id
        JOIN departments d ON cb.department_id = d.department_id
        LEFT JOIN batches b ON cb.batch = b.batch_id
        LEFT JOIN semesters sem ON cb.semester_id = sem.id
        LEFT JOIN users u ON csia.instructor_id = u.id
        WHERE cb.department_id = $1

        UNION

        SELECT 
          c.course_id,
          c.course_code,
          c.course_name,
          c.credit_hour,
          s.section,
          s.batch_id,
          ba.batch_year,
          s.semester_id,
          sem.semester as semester_name,
          s.department_id,
          d.department_name,
          u.id as instructor_id,
          u.full_name as instructor_name
        FROM day_courses dc
        JOIN day_schedules ds ON dc.day_schedule_id = ds.id
        JOIN schedules s ON ds.schedule_id = s.id
        JOIN course c ON dc.course_id = c.course_id
        JOIN departments d ON s.department_id = d.department_id
        LEFT JOIN batches ba ON s.batch_id = ba.batch_id
        LEFT JOIN semesters sem ON s.semester_id = sem.id
        LEFT JOIN users u ON dc.instructor_id = u.id
        WHERE s.department_id = $1
      )
      SELECT DISTINCT
        course_id, course_code, course_name, credit_hour,
        section, batch_id, batch_year, semester_id, semester_name,
        department_id, department_name, instructor_id, instructor_name
      FROM dept_courses
      ORDER BY course_code, section;
    `;

    const { rows } = await pool.query(query, [Number(departmentId)]);
    res.json({ success: true, courses: rows });
  } catch (err) {
    console.error("getDeptHeadCourses error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch department courses" });
  }
};

module.exports = {
  getInstructorCourses,
  getCourseEvaluations,
  saveEvaluations,
  getEvaluationSummary,
  publishResults,
  getStudentResults,
  exportEvaluations,
  getDepartmentEvaluationSections,
  updateDepartmentEvaluationStatus,
  getDeptHeadCourses,
  calculateGrade,
};
