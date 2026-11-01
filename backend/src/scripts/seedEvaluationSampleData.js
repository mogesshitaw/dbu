/**
 * Seed Script: Student Evaluation Sample Data
 * Debre Berhan University - Class Schedule System
 *
 * Run with:  node src/scripts/seedEvaluationSampleData.js
 *
 * Safe to re-run: uses ON CONFLICT DO UPDATE
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const pool = require("../db");

// Ethiopian grading scale
const calculateGrade = (total) => {
  const score = Math.round(Number(total) * 100) / 100;
  if (score >= 90) return { grade: "A+", gradePoint: 4.0 };
  if (score >= 85) return { grade: "A",  gradePoint: 4.0 };
  if (score >= 80) return { grade: "A-", gradePoint: 3.75 };
  if (score >= 75) return { grade: "B+", gradePoint: 3.5 };
  if (score >= 70) return { grade: "B",  gradePoint: 3.0 };
  if (score >= 65) return { grade: "B-", gradePoint: 2.75 };
  if (score >= 60) return { grade: "C+", gradePoint: 2.5 };
  if (score >= 50) return { grade: "C",  gradePoint: 2.0 };
  if (score >= 45) return { grade: "C-", gradePoint: 1.75 };
  if (score >= 40) return { grade: "D",  gradePoint: 1.0 };
  return             { grade: "F",  gradePoint: 0.0 };
};

const rand  = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
const randI = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const FEEDBACK_POOL = [
  "Good performance overall. Keep it up!",
  "Needs improvement in final exam preparation.",
  "Excellent consistency throughout the semester.",
  "Should participate more in class discussions.",
  "Strong analytical skills demonstrated.",
  "Mid-exam performance needs attention.",
  "Outstanding dedication to coursework.",
  "Continuous assessment scores reflect good effort.",
  "Final exam could be strengthened with more practice.",
  "",   // no comment (realistic - most rows have no feedback)
  "",
  "",
];
const pickFeedback = () => FEEDBACK_POOL[randI(0, FEEDBACK_POOL.length - 1)];

async function seed() {
  const client = await pool.connect();
  try {
    console.log("==========================================================");
    console.log("  Debre Berhan University - Evaluation Data Seeder");
    console.log("==========================================================\n");

    // 1. Ensure table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_evaluations (
        id                    SERIAL PRIMARY KEY,
        student_id            INT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        course_id             INT NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
        instructor_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id         INT REFERENCES departments(department_id) ON DELETE CASCADE,
        batch_id              INT REFERENCES batches(batch_id) ON DELETE SET NULL,
        semester_id           INT REFERENCES semesters(id) ON DELETE SET NULL,
        section               VARCHAR(10) NOT NULL,
        continuous_assessment NUMERIC(5,2) DEFAULT 0,
        mid_exam              NUMERIC(5,2) DEFAULT 0,
        final_exam            NUMERIC(5,2) DEFAULT 0,
        total_score           NUMERIC(5,2) DEFAULT 0,
        letter_grade          VARCHAR(5) DEFAULT 'F',
        grade_point           NUMERIC(3,2) DEFAULT 0.00,
        status                VARCHAR(20) DEFAULT 'draft'
          CHECK (status IN ('draft','submitted','approved')),
        feedback              TEXT,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, course_id, section)
      );
    `);
    console.log("[1/5] student_evaluations table ensured.\n");

    // 2. Fetch instructors
    const instrRes = await client.query(
      `SELECT id, full_name FROM users WHERE role = 'instructor' LIMIT 10`
    );
    if (instrRes.rows.length === 0) {
      console.warn("WARNING: No instructors found. Add instructor accounts first.");
      return;
    }
    console.log(`[2/5] Found ${instrRes.rows.length} instructor(s):`);
    instrRes.rows.forEach(i => console.log(`       [ID:${i.id}] ${i.full_name}`));

    // 3. Fetch active students
    const studRes = await client.query(`
      SELECT s.student_id, s.full_name, s.student_number, s.section,
             s.department_id, s.batch_id, s.semester_id
      FROM students s
      WHERE s.status = 'Active'
      ORDER BY s.section, s.student_number
      LIMIT 80
    `);
    if (studRes.rows.length === 0) {
      console.warn("WARNING: No active students found.");
      return;
    }
    console.log(`\n[3/5] Found ${studRes.rows.length} active student(s).`);

    // 4. Fetch courses
    const courseRes = await client.query(
      `SELECT course_id, course_code, course_name, credit_hour FROM course LIMIT 10`
    );
    if (courseRes.rows.length === 0) {
      console.warn("WARNING: No courses found.");
      return;
    }
    console.log(`[4/5] Found ${courseRes.rows.length} course(s).`);

    // 5. Group students by section
    const sections = {};
    studRes.rows.forEach(s => {
      const key = (s.section || "A").trim();
      if (!sections[key]) sections[key] = [];
      sections[key].push(s);
    });

    await client.query("BEGIN");
    let insertCount = 0;
    let skipCount   = 0;

    const sectionKeys   = Object.keys(sections).slice(0, 5);
    const statusOptions = ["submitted", "submitted", "draft", "approved", "draft"];

    console.log(`\n[5/5] Inserting evaluations across ${sectionKeys.length} section(s)...\n`);

    for (let si = 0; si < sectionKeys.length; si++) {
      const section    = sectionKeys[si];
      const sectionStu = sections[section];
      const course     = courseRes.rows[si % courseRes.rows.length];
      const instructor = instrRes.rows[si % instrRes.rows.length];
      const evalStatus = statusOptions[si % statusOptions.length];

      const firstStu = sectionStu[0];
      const deptId   = firstStu.department_id;
      const batchId  = firstStu.batch_id;
      const semId    = firstStu.semester_id;

      console.log(`  Section ${section}: ${course.course_code} (${course.course_name})`);
      console.log(`    Instructor : ${instructor.full_name}`);
      console.log(`    Students   : ${sectionStu.length}`);
      console.log(`    Status     : ${evalStatus}`);

      for (const student of sectionStu) {
        // Realistic marks (section A tends to score higher, last sections lower)
        const bias  = 1 - si * 0.08; // small decreasing bias per section
        const ca    = rand(Math.round(10 * bias), Math.round(28 * bias));
        const mid   = rand(Math.round(12 * bias), Math.round(28 * bias));
        const final = rand(Math.round(15 * bias), Math.round(38 * bias));
        const total = Math.min(100, Math.round((ca + mid + final) * 10) / 10);
        const { grade, gradePoint } = calculateGrade(total);
        const feedback = pickFeedback();

        try {
          await client.query(`
            INSERT INTO student_evaluations (
              student_id, course_id, instructor_id,
              department_id, batch_id, semester_id, section,
              continuous_assessment, mid_exam, final_exam,
              total_score, letter_grade, grade_point, status, feedback
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            ON CONFLICT (student_id, course_id, section) DO UPDATE SET
              continuous_assessment = EXCLUDED.continuous_assessment,
              mid_exam              = EXCLUDED.mid_exam,
              final_exam            = EXCLUDED.final_exam,
              total_score           = EXCLUDED.total_score,
              letter_grade          = EXCLUDED.letter_grade,
              grade_point           = EXCLUDED.grade_point,
              status                = EXCLUDED.status,
              feedback              = EXCLUDED.feedback,
              updated_at            = NOW();
          `, [
            student.student_id, course.course_id, instructor.id,
            deptId, batchId, semId, section,
            ca, mid, final, total, grade, gradePoint,
            evalStatus, feedback || null,
          ]);
          insertCount++;
        } catch (err) {
          console.warn(`    Skipped ${student.student_number}: ${err.message}`);
          skipCount++;
        }
      }
      console.log(`    -> Done (${sectionStu.length - skipCount} records)\n`);
      skipCount = 0; // reset per section for log readability
    }

    await client.query("COMMIT");

    console.log("==========================================================");
    console.log(`  Seeding complete!`);
    console.log(`  Inserted / updated : ${insertCount} evaluation record(s)`);
    console.log(`  Skipped            : ${skipCount}`);
    console.log("==========================================================\n");

  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Seeding FAILED:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
