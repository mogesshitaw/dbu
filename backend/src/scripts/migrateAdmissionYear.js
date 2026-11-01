require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const pool = require("../db");

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration for admission_year and admission_years table...");
    await client.query("BEGIN");

    // 1. Add admission_year to students if it doesn't exist
    await client.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS admission_year VARCHAR(10) DEFAULT '2014';
    `);
    console.log("✅ Column 'admission_year' ensured on 'students' table.");

    // Update existing null admission_year values to default '2014'
    await client.query(`
      UPDATE students 
      SET admission_year = '2014' 
      WHERE admission_year IS NULL;
    `);
    console.log("✅ Existing students populated with default '2014' admission_year.");

    // 2. Create index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_batch_admission 
      ON students(batch_id, admission_year);
    `);
    console.log("✅ Index 'idx_students_batch_admission' ensured.");

    // 3. Create admission_years table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admission_years (
        id SERIAL PRIMARY KEY,
        year VARCHAR(10) NOT NULL UNIQUE,
        description VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Table 'admission_years' ensured.");

    // 4. Seed initial entrance years
    await client.query(`
      INSERT INTO admission_years (year, description) VALUES
      ('2011', 'Entrance Year 2011 E.C.'),
      ('2012', 'Entrance Year 2012 E.C.'),
      ('2013', 'Entrance Year 2013 E.C.'),
      ('2014', 'Entrance Year 2014 E.C.'),
      ('2015', 'Entrance Year 2015 E.C.'),
      ('2016', 'Entrance Year 2016 E.C.'),
      ('2017', 'Entrance Year 2017 E.C.'),
      ('2018', 'Entrance Year 2018 E.C.')
      ON CONFLICT (year) DO NOTHING;
    `);
    console.log("✅ Initial entrance years seeded.");

    // 5. Create or replace view
    await client.query(`
      CREATE OR REPLACE VIEW view_students_with_batch AS
      SELECT 
          s.*,
          d.department_name,
          b.batch_year AS study_level,
          sem.semester AS semester_name,
          CONCAT(COALESCE(b.batch_year, 'Unassigned'), ' / ', COALESCE(s.admission_year, 'N/A')) AS batch_full_label
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN batches b ON s.batch_id = b.batch_id
      LEFT JOIN semesters sem ON s.semester_id = sem.id;
    `);
    console.log("✅ View 'view_students_with_batch' created.");

    await client.query("COMMIT");
    console.log("🎉 Migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
