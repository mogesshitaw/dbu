require('dotenv').config();
const pool = require('./src/db');

/**
 * MOCK DATA SEEDER — Student Semester Expiration & Re-registration Flow
 * 
 * Uses real IDs from the database:
 * Departments: Software Engineering (1), Computer Science (2)
 * Batches: First year (1), Second year (2), Third year (3)
 * Semesters: Semester 1 (1), Semester 2 (2), Summer Semester (3)
 * Students (dept 1): Alice (1), Emma (5), Frank (6)
 *           (dept 2): Bob (2), Carol (3), David (4), Ivy (9)
 *                     Henry (8) — already Suspended
 * Dept Head users: John Doe (2), Yonatan Ayele (10)
 */
async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding mock data for semester expiration flow...\n');

    /* ===================================================================
       STEP 1: Suspend 4 active students (simulate semester expiry)
    =================================================================== */
    console.log('📌 Step 1: Suspending students in Dept 1 (Software Engineering)...');

    // Suspend Alice Johnson (student_id=1, dept=1, batch=1, semester=1)
    await client.query(`
      UPDATE students
      SET status = 'Suspended',
          reason = 'Current semester expired. Please request batch and semester update.',
          updated_at = CURRENT_TIMESTAMP
      WHERE student_id = 1
    `);

    // Suspend Emma Brown (student_id=5, dept=1, batch=1, semester=3)
    await client.query(`
      UPDATE students
      SET status = 'Suspended',
          reason = 'Current semester expired. Please request batch and semester update.',
          updated_at = CURRENT_TIMESTAMP
      WHERE student_id = 5
    `);

    console.log('   ✅ Alice Johnson → Suspended');
    console.log('   ✅ Emma Brown → Suspended');

    console.log('\n📌 Step 2: Suspending students in Dept 2 (Computer Science)...');

    // Suspend Carol Davis (student_id=3, dept=2, batch=1, semester=1)
    await client.query(`
      UPDATE students
      SET status = 'Suspended',
          reason = 'Current semester expired. Please request batch and semester update.',
          updated_at = CURRENT_TIMESTAMP
      WHERE student_id = 3
    `);

    // Suspend David Wilson (student_id=4, dept=2, batch=1, semester=1)
    await client.query(`
      UPDATE students
      SET status = 'Suspended',
          reason = 'Current semester expired. Please request batch and semester update.',
          updated_at = CURRENT_TIMESTAMP
      WHERE student_id = 4
    `);

    console.log('   ✅ Carol Davis → Suspended');
    console.log('   ✅ David Wilson → Suspended');

    /* ===================================================================
       STEP 2: Insert mock semester requests (various statuses)
    =================================================================== */
    console.log('\n📌 Step 3: Inserting semester update requests...\n');

    // REQUEST 1 — Alice Johnson: PENDING promotion to Semester 2 / Second year
    await client.query(`
      INSERT INTO student_semester_requests
        (student_id, department_id, current_batch_id, current_semester_id,
         requested_batch_id, requested_semester_id, request_type, reason, status,
         created_at, updated_at)
      VALUES (1, 1, 1, 1, 2, 1, 'promotion',
        'I have completed all my semester 1 courses and I am ready to be promoted to the second year.',
        'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
    `);
    console.log('   ✅ Request 1 (PENDING)  — Alice Johnson: Batch 1→2, Semester 1→1 [promotion]');

    // REQUEST 2 — Emma Brown: PENDING readmission to First year / Semester 1
    await client.query(`
      INSERT INTO student_semester_requests
        (student_id, department_id, current_batch_id, current_semester_id,
         requested_batch_id, requested_semester_id, request_type, reason, status,
         created_at, updated_at)
      VALUES (5, 1, 1, 3, 1, 1, 'readmission',
        'I had to take medical leave last semester and I am requesting readmission to restart from Semester 1.',
        'pending', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours')
    `);
    console.log('   ✅ Request 2 (PENDING)  — Emma Brown: Batch 1, Semester 3→1 [readmission]');

    // REQUEST 3 — Carol Davis: APPROVED promotion (already processed)
    const approveRes = await client.query(`
      INSERT INTO student_semester_requests
        (student_id, department_id, current_batch_id, current_semester_id,
         requested_batch_id, requested_semester_id, request_type, reason, status,
         reviewed_by, reviewed_at, review_remarks,
         created_at, updated_at)
      VALUES (3, 2, 1, 1, 2, 2, 'promotion',
        'Completed all courses in batch 1 semester 1. Requesting promotion to second year semester 2.',
        'approved', 2, NOW() - INTERVAL '1 day',
        'Request approved. Welcome to Second Year Semester 2. Good luck!',
        NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
      RETURNING id
    `);
    // Restore Carol to Active with new batch/semester
    await client.query(`
      UPDATE students
      SET batch_id = 2, semester_id = 2, status = 'Active',
          reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE student_id = 3
    `);
    console.log('   ✅ Request 3 (APPROVED) — Carol Davis: Batch 1→2, Sem 1→2 [promotion] — restored Active');

    // REQUEST 4 — David Wilson: REJECTED (insufficient records provided)
    await client.query(`
      INSERT INTO student_semester_requests
        (student_id, department_id, current_batch_id, current_semester_id,
         requested_batch_id, requested_semester_id, request_type, reason, status,
         reviewed_by, reviewed_at, review_remarks,
         created_at, updated_at)
      VALUES (4, 2, 1, 1, 3, 1, 'promotion',
        'I want to skip to Third year because I have prior learning credits.',
        'rejected', 2, NOW() - INTERVAL '12 hours',
        'Request rejected. Skipping a full year requires faculty board approval. Please submit supporting documents and reapply.',
        NOW() - INTERVAL '4 days', NOW() - INTERVAL '12 hours')
    `);
    console.log('   ✅ Request 4 (REJECTED) — David Wilson: Batch 1→3 [promotion] — rejected, still Suspended');

    // REQUEST 5 — Henry Taylor: PENDING repeat semester (already suspended from before)
    await client.query(`
      INSERT INTO student_semester_requests
        (student_id, department_id, current_batch_id, current_semester_id,
         requested_batch_id, requested_semester_id, request_type, reason, status,
         created_at, updated_at)
      VALUES (8, 2, 2, 3, 2, 1, 'repeat',
        'Failed summer semester exams. Requesting to repeat from Semester 1 of Second Year.',
        'pending', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
    `);
    console.log('   ✅ Request 5 (PENDING)  — Henry Taylor: Batch 2, Summer→Sem1 [repeat]');

    // REQUEST 6 — Ivy Chen: Another PENDING from dept 2 (suspend first)
    await client.query(`
      UPDATE students SET status = 'Suspended',
        reason = 'Current semester expired. Please request batch and semester update.',
        updated_at = CURRENT_TIMESTAMP
      WHERE student_id = 9
    `);
    await client.query(`
      INSERT INTO student_semester_requests
        (student_id, department_id, current_batch_id, current_semester_id,
         requested_batch_id, requested_semester_id, request_type, reason, status,
         created_at, updated_at)
      VALUES (9, 2, 1, 3, 2, 1, 'promotion',
        'Summer semester completed. Ready to advance to Second Year Semester 1.',
        'pending', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
    `);
    console.log('   ✅ Request 6 (PENDING)  — Ivy Chen: Batch 1→2, Summer→Sem1 [promotion]');

    await client.query('COMMIT');

    console.log('\n✅ ========================================');
    console.log('   MOCK DATA SEEDED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('\nSummary:');
    console.log('  Suspended students: Alice(1), Emma(5), Carol(3)→restored, David(4), Henry(8), Ivy(9)');
    console.log('  Semester Requests:');
    console.log('    • PENDING  (3): Alice, Emma, Henry, Ivy');
    console.log('    • APPROVED (1): Carol (restored to Active)');
    console.log('    • REJECTED (1): David');
    console.log('\nLogin credentials to test:');
    console.log('  Suspended student:  alice.johnson@student.university.edu | (existing password)');
    console.log('  Dept Head (dept 1): Login as John Doe (user id=2) to see dept 1 requests');
    console.log('  Dept Head (dept 2): Login as Yonatan Ayele (user id=10) to see dept 2 requests');
    console.log('\n  Go to: Department Dashboard → View Students → "Semester Update Requests" tab');

    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
