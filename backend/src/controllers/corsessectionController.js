const pool = require("../db");

const getAllSectionAssignments = async (req, res) => {
  try {
    const query = `
      SELECT 
        csi.id,
        csi.course_batch_id,
        csi.instructor_id,
        csi.section,
        csi.created_at,
        csi.updated_at,
        u.full_name ,
        u.email ,
        cb.batch,
        s.semester,
        s.academic_year,
        d.department_id,
        d.department_name,
        c.course_id,
        c.course_code,
        c.course_name,
        c.credit_hour,
        c.category,
        cia.course_status
      FROM course_section_instructor_assign csi
      LEFT JOIN users u ON csi.instructor_id = u.id
      LEFT JOIN course_batch cb ON csi.course_batch_id = cb.id
      LEFT JOIN semesters s ON cb.semester_id = s.id
      LEFT JOIN departments d ON cb.department_id = d.department_id
      LEFT JOIN Course c ON cb.course_id = c.course_id
      LEFT JOIN course_instructor_assign cia ON 
        cia.course_id = c.course_id AND 
        cia.instructor_id = u.id
      ORDER BY csi.section, c.course_code, cb.batch
    `;
    
    const result = await pool.query(query);
    
    // Format the response
    const formattedResults = result.rows.map(row => ({
      id: row.id,
      course_batch_id: row.course_batch_id,
      instructor_id: row.instructor_id,
      section: row.section,
      created_at: row.created_at,
      updated_at: row.updated_at,
      instructor: {
        instructor_id: row.instructor_id,
        full_name: row.instructor_full_name,
        first_name: row.instructor_first_name,
        last_name: row.instructor_last_name,
        email: row.instructor_email,
        course_status: row.course_status
      },
      course_batch: {
        batch: row.batch,
        semester_name: row.semester_name,
        academic_year: row.academic_year,
        department: {
          department_id: row.department_id,
          department_name: row.department_name
        },
        course: {
          course_id: row.course_id,
          course_code: row.course_code,
          course_name: row.course_name,
          credit_hour: row.credit_hour,
          category: row.category
        }
      }
    }));
    
    res.json({
      success: true,
      count: formattedResults.length,
      data: formattedResults
    });
  } catch (error) {
    console.error('Error fetching section assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
const getSectionAssignmentsByCourseBatch = async (req, res) => {
  try {
    const { courseBatchId } = req.params;
    
    if (!courseBatchId) {
      return res.status(400).json({
        success: false,
        message: 'Course batch ID is required'
      });
    }
    
    // Convert courseBatchId to integer
    const courseBatchIdInt = parseInt(courseBatchId, 10);
    
    if (isNaN(courseBatchIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course batch ID'
      });
    }
    
    // First, verify the course batch exists
    const courseBatchCheck = await pool.query(
      'SELECT id FROM course_batch WHERE id = $1',
      [courseBatchIdInt]
    );
    
    if (courseBatchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course batch not found'
      });
    }
    
    const query = `
      SELECT 
        csi.id,
        csi.course_batch_id,
        csi.instructor_id,
        csi.section,
        csi.created_at,
        csi.updated_at,
        u.full_name as instructor_full_name,
        u.email as instructor_email,
        cb.batch,
        s.semester as semester_name,
        d.department_name,
        c.course_id,
        c.course_code,
        c.course_name,
        cia.course_status
      FROM course_section_instructor_assign csi
      LEFT JOIN users u ON csi.instructor_id = u.id
      LEFT JOIN course_batch cb ON csi.course_batch_id = cb.id
      LEFT JOIN semesters s ON cb.semester_id  = s.id
      LEFT JOIN departments d ON cb.department_id = d.department_id
      LEFT JOIN Course c ON cb.course_id = c.course_id
      LEFT JOIN course_instructor_assign cia ON 
          cia.course_id = c.course_id
          AND cia.instructor_id = u.id
      WHERE csi.course_batch_id = $1
      ORDER BY csi.section
    `;
    
    const result = await pool.query(query, [courseBatchIdInt]);
    
    // Format the response
    const formattedResults = result.rows.map(row => ({
      id: row.id,
      course_batch_id: row.course_batch_id,
      instructor_id: row.instructor_id,
      section: row.section,
      created_at: row.created_at,
      updated_at: row.updated_at,
      instructor: {
        instructor_id: row.instructor_id,
        full_name: row.instructor_full_name,
        email: row.instructor_email,
        course_status: row.course_status
      },
      course_batch: {
        batch: row.batch,
        semester_name: row.semester_name,
        department_name: row.department_name,
        
          course_id: row.course_id,
          course_code: row.course_code,
          course_name: row.course_name
        
      }
    }));
    console.log("all" ,formattedResults)
    res.json({
      success: true,
      count: formattedResults.length,
      data: formattedResults
    });
  } catch (error) {
    console.error('Error fetching section assignments by course batch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Option B: Calculate exact weekly contact hours and sessions for an instructor
 * and check whether adding sections causes an overload.
 *
 * Formula:
 * - Lecture Sessions per Section = Math.ceil((lec_hr + tut_hr) / lecture_duration)
 * - Lab Sessions per Section = Math.ceil(lab_hr / labratory_duration)
 * - Weekly Contact Hours per Section = (lec_hr + tut_hr + lab_hr)
 * - Weekly Sessions per Section = Lecture Sessions + Lab Sessions
 */
async function checkInstructorWorkloadOverload(course_batch_id, instructor_id, additional_sections_count = 1) {
  try {
    // 1. Get course_batch details including course details, department settings & instructor name
    const cbRes = await pool.query(
      `SELECT cb.id, cb.department_id, cb.semester_id, cb.course_id,
              c.course_code, c.course_name, c.lec_hr, c.tut_hr, c.lab_hr, c.credit_hour,
              COALESCE(d.max_weekly_hours_per_instructor, 16) AS max_weekly_hours,
              COALESCE(d.max_sections_per_instructor, 4) AS max_sections,
              u.full_name AS instructor_name
       FROM course_batch cb
       JOIN course c ON cb.course_id = c.course_id
       LEFT JOIN departments d ON cb.department_id = d.department_id
       LEFT JOIN users u ON u.id = $1
       WHERE cb.id = $2`,
      [instructor_id, course_batch_id]
    );

    if (cbRes.rows.length === 0) return { error: 'Course batch not found', isOverload: false };

    const {
      department_id,
      semester_id,
      course_code,
      course_name,
      lec_hr,
      tut_hr,
      lab_hr,
      max_weekly_hours,
      max_sections,
      instructor_name
    } = cbRes.rows[0];

    const maxWeeklyHoursLimit = parseInt(max_weekly_hours) || 16;
    const maxSectionsLimit = parseInt(max_sections) || 4;

    // 2. Fetch time_slots for department (for lecture and lab duration)
    const timeSlotRes = await pool.query(
      `SELECT lecture_duration, labratory_duration FROM time_slots WHERE department_id = $1 LIMIT 1`,
      [department_id]
    );
    const lecDur = Math.max(Number(timeSlotRes.rows[0]?.lecture_duration) || 2, 1);
    const labDur = Math.max(Number(timeSlotRes.rows[0]?.labratory_duration) || 2, 1);

    // 3. Calculate hours and sessions for the incoming section
    const incomingLecTutHours = (Number(lec_hr) || 0) + (Number(tut_hr) || 0);
    const incomingLabHours = Number(lab_hr) || 0;
    const incomingContactHoursPerSection = incomingLecTutHours + incomingLabHours;

    const incomingLecSessions = Math.ceil(incomingLecTutHours / lecDur);
    const incomingLabSessions = Math.ceil(incomingLabHours / labDur);
    const incomingSessionsPerSection = incomingLecSessions + incomingLabSessions;

    const newSectionsToAdd = Number(additional_sections_count) || 1;
    const additionalHours = incomingContactHoursPerSection * newSectionsToAdd;
    const additionalSessions = incomingSessionsPerSection * newSectionsToAdd;

    // 4. Fetch all existing section assignments for this instructor in this semester & department
    const existingAssignmentsRes = await pool.query(
      `SELECT csi.id, csi.section, c.course_code, c.course_name,
              c.lec_hr, c.tut_hr, c.lab_hr, c.credit_hour
       FROM course_section_instructor_assign csi
       JOIN course_batch cb ON csi.course_batch_id = cb.id
       JOIN course c ON cb.course_id = c.course_id
       WHERE csi.instructor_id = $1
         AND cb.semester_id = $2
         AND cb.department_id = $3`,
      [instructor_id, semester_id, department_id]
    );

    let currentContactHours = 0;
    let currentWeeklySessions = 0;
    const currentSectionsCount = existingAssignmentsRes.rows.length;

    for (const row of existingAssignmentsRes.rows) {
      const rowLecTut = (Number(row.lec_hr) || 0) + (Number(row.tut_hr) || 0);
      const rowLab = Number(row.lab_hr) || 0;
      currentContactHours += (rowLecTut + rowLab);
      currentWeeklySessions += (Math.ceil(rowLecTut / lecDur) + Math.ceil(rowLab / labDur));
    }

    const projectedWeeklyHours = currentContactHours + additionalHours;
    const projectedWeeklySessions = currentWeeklySessions + additionalSessions;
    const projectedSectionsCount = currentSectionsCount + newSectionsToAdd;

    // Overload checks: Option B focuses on weekly contact hours, while also honoring max section limit
    const isHoursOverload = projectedWeeklyHours > maxWeeklyHoursLimit;
    const isSectionsOverload = projectedSectionsCount > maxSectionsLimit;
    const isOverload = isHoursOverload || isSectionsOverload;

    return {
      isOverload,
      isHoursOverload,
      isSectionsOverload,
      instructorName: instructor_name || `Instructor #${instructor_id}`,
      courseCode: course_code,
      courseName: course_name,
      currentContactHours,
      currentWeeklySessions,
      currentSectionsCount,
      additionalHours,
      additionalSessions,
      additionalSectionsCount: newSectionsToAdd,
      projectedWeeklyHours,
      projectedWeeklySessions,
      projectedSectionsCount,
      maxWeeklyHoursLimit,
      maxSectionsLimit,
      remainingHours: Math.max(0, maxWeeklyHoursLimit - currentContactHours),
      remainingSections: Math.max(0, maxSectionsLimit - currentSectionsCount),
      details: {
        lecDuration: lecDur,
        labDuration: labDur,
        incomingContactHoursPerSection,
        incomingSessionsPerSection
      }
    };
  } catch (err) {
    console.error('checkInstructorWorkloadOverload error:', err);
    return { isOverload: false };
  }
}

// Retain alias for backward compatibility
const checkInstructorOverload = checkInstructorWorkloadOverload;

const createSectionAssignment = async (req, res) => {
  try {
    const { course_batch_id, instructor_id, section } = req.body;
    
    // Validate required fields
    if (!course_batch_id || !instructor_id || !section) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course_batch_id, instructor_id, and section'
      });
    }
    
    // Validate section format (A-Z)
    if (!/^[A-Z]$/.test(section)) {
      return res.status(400).json({
        success: false,
        message: 'Section must be a single capital letter (A-Z)'
      });
    }
    
    // Check if course batch exists
    const courseBatchCheck = await pool.query(
      `SELECT cb.id, cb.department_id, cb.semester_id, cb.course_id 
       FROM course_batch cb WHERE cb.id = $1`,
      [course_batch_id]
    );
    if (courseBatchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course batch not found'
      });
    }

    const courseId = courseBatchCheck.rows[0].course_id;

    // Check if instructor is assigned to the course by admin
    const instructorCheck = await pool.query(`
      SELECT cia.*, u.full_name, u.email
      FROM course_instructor_assign cia
      JOIN users u ON cia.instructor_id = u.id
      WHERE cia.course_id = $1 AND cia.instructor_id = $2
    `, [courseId, instructor_id]);
    
    if (instructorCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Instructor is not assigned to this course by admin'
      });
    }
    
    // Check if section is already assigned for this course batch
    const existingSection = await pool.query(
      `SELECT * FROM course_section_instructor_assign 
       WHERE course_batch_id = $1 AND section = $2`,
      [course_batch_id, section]
    );
    
    if (existingSection.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Section ${section} is already assigned for this course batch`
      });
    }

    // Check for instructor workload overload (Option B: Weekly Contact Hours & Sessions)
    const overloadCheck = await checkInstructorWorkloadOverload(course_batch_id, instructor_id, 1);
    if (overloadCheck.isOverload) {
      const reason = overloadCheck.isHoursOverload 
        ? `Weekly contact hours limit exceeded (${overloadCheck.projectedWeeklyHours} hrs > max ${overloadCheck.maxWeeklyHoursLimit} hrs/week)`
        : `Maximum sections limit exceeded (${overloadCheck.projectedSectionsCount} sections > max ${overloadCheck.maxSectionsLimit})`;
      return res.status(400).json({
        success: false,
        isOverload: true,
        workload: overloadCheck,
        message: `Instructor Overload: ${overloadCheck.instructorName} — ${reason}. Current workload: ${overloadCheck.currentContactHours} hrs (${overloadCheck.currentWeeklySessions} sessions across ${overloadCheck.currentSectionsCount} section(s)). Adding Section ${section} requires +${overloadCheck.additionalHours} hrs (+${overloadCheck.additionalSessions} sessions).`
      });
    }
    
    // Create the section assignment
    const createQuery = `
      INSERT INTO course_section_instructor_assign 
      (course_batch_id, instructor_id, section) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const createResult = await pool.query(createQuery, [
      course_batch_id,
      instructor_id,
      section
    ]);
    
    const newAssignment = createResult.rows[0].id;
    
    // Get full details with joins
    const fullQuery = `
      SELECT 
        csi.id,
        csi.course_batch_id,
        csi.instructor_id,
        csi.section,
        csi.created_at,
        csi.updated_at,
        u.full_name as instructor_full_name,
        u.email as instructor_email,
        cb.batch,
        s.semester,
        d.department_name,
        c.course_id,
        c.course_code,
        c.course_name,
        cia.course_status
      FROM course_section_instructor_assign csi
      LEFT JOIN users u ON csi.instructor_id = u.id
      LEFT JOIN course_batch cb ON csi.course_batch_id = cb.id
      LEFT JOIN semesters s ON cb.semester_id = s.id
      LEFT JOIN departments d ON cb.department_id = d.department_id
      LEFT JOIN course c ON cb.course_id = c.course_id
      LEFT JOIN course_instructor_assign cia ON 
        c.course_id = cia.course_id AND 
        u.id = cia.instructor_id
      WHERE csi.id = $1
    `;
    
    const fullResult = await pool.query(fullQuery, [newAssignment]);
    
    res.status(201).json({
      success: true,
      message: 'Section assignment created successfully',
      data: {
        id: fullResult.rows[0].id,
        course_batch_id: fullResult.rows[0].course_batch_id,
        instructor_id: fullResult.rows[0].instructor_id,
        section: fullResult.rows[0].section,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at,
        instructor: {
          instructor_id: fullResult.rows[0].instructor_id,
          full_name: fullResult.rows[0].instructor_full_name,
          email: fullResult.rows[0].instructor_email,
          course_status: fullResult.rows[0].course_status
        },
        course_batch: {
          batch: fullResult.rows[0].batch,
          semester: fullResult.rows[0].semester,
          department_name: fullResult.rows[0].department_name,
          course: {
            course_id: fullResult.rows[0].course_id,
            course_code: fullResult.rows[0].course_code,
            course_name: fullResult.rows[0].course_name
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error creating section assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
function calculateCourseSessions(course, timslot) {
  const sessions = [];
  let lecSlots, labSlots;
  for (const row of timslot.rows) {
    lecSlots = Math.ceil((course.lec_hr + course.tut_hr) / row.lecture_duration);
    labSlots = Math.ceil(course.lab_hr / row.labratory_duration);
  
    for (let i = 0; i < lecSlots; i++) {
      sessions.push({ course_id: course.course_id, type: "LEC", course_name:course.course_name});
    }
    for (let i = 0; i < labSlots; i++) {
      sessions.push({ course_id: course.course_id, type: "LAB" , course_name:course.course_name });
    }
  }

  return sessions;
}
function diffHours(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh + em / 60) - (sh + sm / 60);
}
function courselength(courses, coursename) {
  return courses.rows.filter(l => l.course_name === coursename).length;
}



const createMultipleSectionAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;
    
    // Validate required fields
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of assignments'
      });
    }

    // Pre-validate instructor overloads before inserting
    const instructorCounts = {};
    for (const a of assignments) {
      if (a.course_batch_id && a.instructor_id) {
        const key = `${a.course_batch_id}_${a.instructor_id}`;
        instructorCounts[key] = (instructorCounts[key] || 0) + 1;
      }
    }

    for (const [key, count] of Object.entries(instructorCounts)) {
      const [cbId, instId] = key.split('_');
      const overloadCheck = await checkInstructorWorkloadOverload(cbId, instId, count);
      if (overloadCheck.isOverload) {
        const reason = overloadCheck.isHoursOverload 
          ? `Weekly contact hours limit exceeded (${overloadCheck.projectedWeeklyHours} hrs > max ${overloadCheck.maxWeeklyHoursLimit} hrs/week)`
          : `Maximum sections limit exceeded (${overloadCheck.projectedSectionsCount} sections > max ${overloadCheck.maxSectionsLimit})`;
        return res.status(400).json({
          success: false,
          isOverload: true,
          workload: overloadCheck,
          message: `Instructor Overload: ${overloadCheck.instructorName} — ${reason}. Current workload: ${overloadCheck.currentContactHours} hrs (${overloadCheck.currentWeeklySessions} sessions across ${overloadCheck.currentSectionsCount} section(s)). Adding ${count} section(s) requires +${overloadCheck.additionalHours} hrs (+${overloadCheck.additionalSessions} sessions).`
        });
      }
    }
    
    const results = [];
    const errors = [];
    
    for (const assignment of assignments) {
      const { course_batch_id, instructor_id, section } = assignment;
      
      try {
        // Validate required fields for each assignment
        if (!course_batch_id || !instructor_id || !section) {
          errors.push({
            section,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Validate section format (A-Z)
        if (!/^[A-Z]$/.test(section)) {
          errors.push({
            section,
            error: 'Section must be a single capital letter (A-Z)'
          });
          continue;
        }
        
        // Check if course batch exists
        const courseBatchCheck = await pool.query(
          'SELECT id FROM course_batch WHERE id = $1',
          [course_batch_id]
        );
        
        if (courseBatchCheck.rows.length === 0) {
          errors.push({
            section,
            error: 'Course batch not found'
          });
          continue;
        }
        
        // Check if instructor exists and is assigned to the course
        const courseBatchDetails = await pool.query(`
          SELECT cb.course_id 
          FROM course_batch cb 
          WHERE cb.id = $1
        `, [course_batch_id]);
        
        const courseId = courseBatchDetails.rows[0]?.course_id;
        
        if (!courseId) {
          errors.push({
            section,
            error: 'Course not found for this batch'
          });
          continue;
        }
        
        // Check if instructor is assigned to the course
        const instructorCheck = await pool.query(`
          SELECT cia.*, u.full_name, u.email
          FROM course_instructor_assign cia
          JOIN users u ON cia.instructor_id = u.id
          WHERE cia.course_id = $1 AND cia.instructor_id = $2
        `, [courseId, instructor_id]);
        
        if (instructorCheck.rows.length === 0) {
          errors.push({
            section,
            error: 'Instructor is not assigned to this course by admin'
          });
          continue;
        }
        
        // Check if section is already assigned for this course batch
        const existingSection = await pool.query(
          `SELECT * FROM course_section_instructor_assign 
           WHERE course_batch_id = $1 AND section = $2`,
          [course_batch_id, section]
        );
        
        if (existingSection.rows.length > 0) {
          errors.push({
            section,
            error: `Section ${section} is already assigned`
          });
          continue;
        }
        
        // Create the section assignment
        const createQuery = `
          INSERT INTO course_section_instructor_assign 
          (course_batch_id, instructor_id, section) 
          VALUES ($1, $2, $3) 
          RETURNING *
        `;
        
        const createResult = await pool.query(createQuery, [
          course_batch_id,
          instructor_id,
          section
        ]);
        
        const newAssignment = createResult.rows[0].id;
        
        // Get full details with joins
        const fullQuery = `
          SELECT 
            csi.id,
            csi.course_batch_id,
            csi.instructor_id,
            csi.section,
            csi.created_at,
            csi.updated_at,
            u.full_name as instructor_full_name,
            u.email as instructor_email,
            cb.batch,
            s.semester,
            d.department_name,
            c.course_id,
            c.course_code,
            c.course_name,
            cia.course_status
          FROM course_section_instructor_assign csi
          LEFT JOIN users u ON csi.instructor_id = u.id
          LEFT JOIN course_batch cb ON csi.course_batch_id = cb.id
          LEFT JOIN semesters s ON cb.semester_id = s.id
          LEFT JOIN department d ON cb.department_id = d.department_id
          LEFT JOIN course c ON cb.course_id = c.course_id
          LEFT JOIN course_instructor_assign cia ON 
            c.course_id = cia.course_id AND 
            u.id = cia.instructor_id
          WHERE csi.id = $1
        `;
        
        const fullResult = await pool.query(fullQuery, [newAssignment]);
        
        results.push({
          id: fullResult.rows[0].id,
          course_batch_id: fullResult.rows[0].course_batch_id,
          instructor_id: fullResult.rows[0].instructor_id,
          section: fullResult.rows[0].section,
          instructor: {
            instructor_id: fullResult.rows[0].instructor_id,
            full_name: fullResult.rows[0].instructor_full_name,
            email: fullResult.rows[0].instructor_email,
            course_status: fullResult.rows[0].course_status
          }
        });
        
      } catch (error) {
        errors.push({
          section,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${results.length} section assignment(s) created successfully`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error creating multiple section assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
const updateSectionAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructor_id, section } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Section assignment ID is required'
      });
    }

    // Validate at least one field to update
    if (!instructor_id && !section) {
      return res.status(400).json({
        success: false,
        message: 'Please provide instructor_id or section to update'
      });
    }

    // Check if section assignment exists
    const existingAssignment = await pool.query(
      'SELECT * FROM course_section_instructor_assign WHERE id = $1',
      [id]
    );

    if (existingAssignment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Section assignment not found'
      });
    }

    const currentAssignment = existingAssignment.rows[0];
    const course_batch_id = currentAssignment.course_batch_id;

    // Build dynamic update query
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    if (instructor_id) {
      // Verify the new instructor is assigned to the course
      const courseBatchDetails = await pool.query(`
        SELECT cb.course_id 
        FROM course_batch cb 
        WHERE cb.id = $1
      `, [course_batch_id]);

      const courseId = courseBatchDetails.rows[0]?.course_id;

      if (courseId) {
        const instructorCheck = await pool.query(`
          SELECT * FROM course_instructor_assign 
          WHERE course_id = $1 AND instructor_id = $2
        `, [courseId, instructor_id]);

        if (instructorCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'New instructor is not assigned to this course by admin'
          });
        }

        // Check if new instructor is already assigned to another section in this course batch
        const existingInstructorAssignment = await pool.query(
          `SELECT * FROM course_section_instructor_assign 
           WHERE course_batch_id = $1 AND instructor_id = $2 AND id != $3`,
          [course_batch_id, instructor_id, id]
        );

        if (existingInstructorAssignment.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Instructor is already assigned to another section in this course batch'
          });
        }

        // Check for instructor section overload if instructor is changed
        if (instructor_id != currentAssignment.instructor_id) {
          const overloadCheck = await checkInstructorOverload(course_batch_id, instructor_id, 1);
          if (overloadCheck.isOverload) {
            return res.status(400).json({
              success: false,
              isOverload: true,
              message: `Instructor Overload: ${overloadCheck.instructorName} already has ${overloadCheck.currentSections} section(s) assigned. Maximum allowed limit is ${overloadCheck.maxLimit} sections per semester.`
            });
          }
        }
      }

      updateFields.push(`instructor_id = $${paramCount}`);
      updateValues.push(instructor_id);
      paramCount++;
    }

    if (section) {
      // Validate section format
      if (!/^[A-Z]$/.test(section)) {
        return res.status(400).json({
          success: false,
          message: 'Section must be a single capital letter (A-Z)'
        });
      }

      // Check if new section is already assigned for this course batch
      const existingSection = await pool.query(
        `SELECT * FROM course_section_instructor_assign 
         WHERE course_batch_id = $1 AND section = $2 AND id != $3`,
        [course_batch_id, section, id]
      );

      if (existingSection.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Section ${section} is already assigned for this course batch`
        });
      }

      updateFields.push(`section = $${paramCount}`);
      updateValues.push(section);
      paramCount++;
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add the ID parameter
    updateValues.push(id);

    const updateQuery = `
      UPDATE course_section_instructor_assign 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, updateValues);

    const updatedAssignment = updateResult.rows[0];

    // Get full details with joins
    const fullQuery = `
      SELECT 
        csi.id,
        csi.course_batch_id,
        csi.instructor_id,
        csi.section,
        csi.created_at,
        csi.updated_at,
        u.full_name as instructor_full_name,
        u.email as instructor_email,
        cb.batch,
        s.semester as semester_name,
        d.department_name,
        c.course_id,
        c.course_code,
        c.course_name,
        cia.course_status
      FROM course_section_instructor_assign csi
      LEFT JOIN users u ON csi.instructor_id = u.id
      LEFT JOIN course_batch cb ON csi.course_batch_id = cb.id
      LEFT JOIN semesters s ON cb.semester_id = s.id
      LEFT JOIN departments d ON cb.department_id = d.department_id
      LEFT JOIN course c ON cb.course_id = c.course_id
      LEFT JOIN course_instructor_assign cia ON 
        cia.course_id = c.course_id AND 
        cia.instructor_id = u.id
      WHERE csi.id = $1
    `;

    const fullResult = await pool.query(fullQuery, [updatedAssignment.id]);

    res.json({
      success: true,
      message: 'Section assignment updated successfully',
      data: {
        id: fullResult.rows[0].id,
        course_batch_id: fullResult.rows[0].course_batch_id,
        instructor_id: fullResult.rows[0].instructor_id,
        section: fullResult.rows[0].section,
        created_at: fullResult.rows[0].created_at,
        updated_at: fullResult.rows[0].updated_at,
        instructor: {
          instructor_id: fullResult.rows[0].instructor_id,
          full_name: fullResult.rows[0].instructor_full_name,
          email: fullResult.rows[0].instructor_email,
          course_status: fullResult.rows[0].course_status
        },
        course_batch: {
          batch: fullResult.rows[0].batch,
          semester_name: fullResult.rows[0].semester_name,
          department_name: fullResult.rows[0].department_name,
          course: {
            course_id: fullResult.rows[0].course_id,
            course_code: fullResult.rows[0].course_code,
            course_name: fullResult.rows[0].course_name
          }
        }
      }
    });

  } catch (error) {
    console.error('Error updating section assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
const deleteSectionAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Section assignment ID is required'
      });
    }
    
    // Check if section assignment exists
    const existingAssignment = await pool.query(
      'SELECT * FROM course_section_instructor_assign WHERE id = $1',
      [id]
    );
    
    if (existingAssignment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Section assignment not found'
      });
    }
    
    // Delete the section assignment
    await pool.query('DELETE FROM course_section_instructor_assign WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Section assignment deleted successfully',
      data: { id: parseInt(id) }
    });
    
  } catch (error) {
    console.error('Error deleting section assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
const getAvailableSections = async (req, res) => {
  try {
    const { courseBatchId } = req.params;
    
    if (!courseBatchId) {
      return res.status(400).json({
        success: false,
        message: 'Course batch ID is required'
      });
    }
    
    // Define all possible sections (A-H)
    const allSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    // Get assigned sections for this course batch
    const assignedSectionsResult = await pool.query(
      'SELECT section FROM course_section_instructor_assign WHERE course_batch_id = $1',
      [courseBatchId]
    );
    
    const assignedSections = assignedSectionsResult.rows.map(row => row.section);
    
    // Calculate available sections
    const availableSections = allSections.filter(
      section => !assignedSections.includes(section)
    );
    
    res.json({
      success: true,
      data: {
        all_sections: allSections,
        assigned_sections: assignedSections,
        available_sections: availableSections
      }
    });
    
  } catch (error) {
    console.error('Error fetching available sections:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
const getAvailableInstructors = async (req, res) => {
  try {
    const { courseBatchId } = req.params;
    
    if (!courseBatchId) {
      return res.status(400).json({
        success: false,
        message: 'Course batch ID is required'
      });
    }
    
    // Get course batch details including semester and department
    const courseBatchResult = await pool.query(
      `SELECT cb.course_id, cb.department_id, cb.semester_id, 
              COALESCE(d.max_sections_per_instructor, 4) as max_sections,
              d.department_name
       FROM course_batch cb
       LEFT JOIN departments d ON cb.department_id = d.department_id
       WHERE cb.id = $1`,
      [courseBatchId]
    );
    
    if (courseBatchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course batch not found'
      });
    }
    
    const { course_id: courseId, department_id, semester_id, max_sections } = courseBatchResult.rows[0];
    const maxSectionsLimit = parseInt(max_sections) || 4;
    
    // Get all admin-assigned instructors for this course with their total sections in this semester
    const allInstructorsQuery = `
      SELECT 
        cia.instructor_id,
        cia.course_status,
        u.full_name,
        u.email,
        d.department_name,
        (
          SELECT COUNT(csi.id)
          FROM course_section_instructor_assign csi
          JOIN course_batch cb_sub ON csi.course_batch_id = cb_sub.id
          WHERE csi.instructor_id = cia.instructor_id
            AND cb_sub.semester_id = $2
            AND cb_sub.department_id = $3
        ) as total_assigned_sections
      FROM course_instructor_assign cia
      JOIN users u ON cia.instructor_id = u.id
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE cia.course_id = $1
      ORDER BY u.full_name
    `;
    
    const allInstructorsResult = await pool.query(allInstructorsQuery, [courseId, semester_id, department_id]);
    
    // Get instructors already assigned to sections in THIS specific course batch
    const assignedInstructorsQuery = `
      SELECT instructor_id, section 
      FROM course_section_instructor_assign 
      WHERE course_batch_id = $1
    `;
    
    const assignedInstructorsResult = await pool.query(assignedInstructorsQuery, [courseBatchId]);
    const assignedInstructorIds = assignedInstructorsResult.rows.map(row => row.instructor_id);
    
    // Separate available, overloaded, and assigned instructors
    const allInstructors = allInstructorsResult.rows.map(instructor => {
      const totalAssigned = parseInt(instructor.total_assigned_sections) || 0;
      const isOverloaded = totalAssigned >= maxSectionsLimit;
      const remainingSections = Math.max(0, maxSectionsLimit - totalAssigned);
      
      return {
        instructor_id: instructor.instructor_id,
        id: instructor.instructor_id,
        full_name: instructor.full_name,
        email: instructor.email,
        department_name: instructor.department_name,
        course_status: instructor.course_status,
        is_assigned: assignedInstructorIds.includes(instructor.instructor_id),
        total_assigned_sections: totalAssigned,
        max_sections: maxSectionsLimit,
        remaining_sections: remainingSections,
        is_overloaded: isOverloaded
      };
    });
    
    const availableInstructors = allInstructors.filter(instructor => !instructor.is_assigned && !instructor.is_overloaded);
    const overloadedInstructors = allInstructors.filter(instructor => instructor.is_overloaded);
    const assignedInstructors = allInstructors.filter(instructor => instructor.is_assigned);
    
    res.json({
      success: true,
      data: {
        all_instructors: allInstructors,
        available_instructors: availableInstructors,
        assigned_instructors: assignedInstructors,
        overloaded_instructors: overloadedInstructors,
        max_sections_per_instructor: maxSectionsLimit,
        total_count: allInstructors.length,
        available_count: availableInstructors.length,
        assigned_count: assignedInstructors.length,
        overloaded_count: overloadedInstructors.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching available instructors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc Get instructor section load for a semester/department
 * @route GET /api/course-sections/instructor-load/:instructorId
 */
const getInstructorSectionLoad = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { course_batch_id, department_id, semester_id } = req.query;

    let depId = department_id;
    let semId = semester_id;

    if (course_batch_id) {
      const cb = await pool.query('SELECT department_id, semester_id FROM course_batch WHERE id = $1', [course_batch_id]);
      if (cb.rows.length > 0) {
        depId = cb.rows[0].department_id;
        semId = cb.rows[0].semester_id;
      }
    }

    if (!depId || !semId) {
      return res.status(400).json({ success: false, message: 'Please provide course_batch_id or department_id and semester_id' });
    }

    // Get department limits
    const settingsRes = await pool.query(
      `SELECT COALESCE(max_sections_per_instructor, 4) as max_sections,
              COALESCE(max_weekly_hours_per_instructor, 16) as max_weekly_hours
       FROM departments WHERE department_id = $1`,
      [depId]
    );
    const maxSections = parseInt(settingsRes.rows[0]?.max_sections) || 4;
    const maxWeeklyHours = parseInt(settingsRes.rows[0]?.max_weekly_hours) || 16;

    // Get time slots duration for department
    const timeSlotRes = await pool.query(
      `SELECT lecture_duration, labratory_duration FROM time_slots WHERE department_id = $1 LIMIT 1`,
      [depId]
    );
    const lecDur = Math.max(Number(timeSlotRes.rows[0]?.lecture_duration) || 2, 1);
    const labDur = Math.max(Number(timeSlotRes.rows[0]?.labratory_duration) || 2, 1);

    // Get assigned sections for instructor in this semester
    const countRes = await pool.query(
      `SELECT csi.id, csi.section, csi.course_batch_id,
              c.course_id, c.course_name, c.course_code,
              c.lec_hr, c.tut_hr, c.lab_hr, c.credit_hour
       FROM course_section_instructor_assign csi
       JOIN course_batch cb ON csi.course_batch_id = cb.id
       JOIN course c ON cb.course_id = c.course_id
       WHERE csi.instructor_id = $1 
         AND cb.semester_id = $2 
         AND cb.department_id = $3`,
      [instructorId, semId, depId]
    );

    let totalContactHours = 0;
    let totalWeeklySessions = 0;
    const assignedSections = countRes.rows.map(row => {
      const lecTut = (Number(row.lec_hr) || 0) + (Number(row.tut_hr) || 0);
      const lab = Number(row.lab_hr) || 0;
      const contactHours = lecTut + lab;
      const lecSessions = Math.ceil(lecTut / lecDur);
      const labSessions = Math.ceil(lab / labDur);
      const totalSessions = lecSessions + labSessions;
      
      totalContactHours += contactHours;
      totalWeeklySessions += totalSessions;

      return {
        id: row.id,
        section: row.section,
        course_batch_id: row.course_batch_id,
        course_name: row.course_name,
        course_code: row.course_code,
        contact_hours: contactHours,
        weekly_sessions: totalSessions,
        credit_hour: row.credit_hour
      };
    });

    const currentSections = assignedSections.length;
    const isOverloaded = (totalContactHours >= maxWeeklyHours) || (currentSections >= maxSections);

    // Details for incoming course if course_batch_id is given
    let incomingCourseDetails = null;
    if (course_batch_id) {
      const incRes = await pool.query(
        `SELECT c.course_id, c.course_code, c.course_name, c.lec_hr, c.tut_hr, c.lab_hr, c.credit_hour
         FROM course_batch cb
         JOIN course c ON cb.course_id = c.course_id
         WHERE cb.id = $1`,
        [course_batch_id]
      );
      if (incRes.rows.length > 0) {
        const inc = incRes.rows[0];
        const incLecTut = (Number(inc.lec_hr) || 0) + (Number(inc.tut_hr) || 0);
        const incLab = Number(inc.lab_hr) || 0;
        const incHours = incLecTut + incLab;
        const incSessions = Math.ceil(incLecTut / lecDur) + Math.ceil(incLab / labDur);
        incomingCourseDetails = {
          course_id: inc.course_id,
          course_code: inc.course_code,
          course_name: inc.course_name,
          contact_hours_per_section: incHours,
          sessions_per_section: incSessions
        };
      }
    }

    res.json({
      success: true,
      instructor_id: parseInt(instructorId),
      current_sections: currentSections,
      max_sections: maxSections,
      remaining_sections: Math.max(0, maxSections - currentSections),
      current_contact_hours: totalContactHours,
      max_weekly_hours: maxWeeklyHours,
      remaining_hours: Math.max(0, maxWeeklyHours - totalContactHours),
      current_weekly_sessions: totalWeeklySessions,
      is_overloaded: isOverloaded,
      lecture_duration: lecDur,
      lab_duration: labDur,
      incoming_course: incomingCourseDetails,
      assigned_sections: assignedSections
    });
  } catch (err) {
    console.error('getInstructorSectionLoad error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch instructor load' });
  }
};

module.exports = {
  getAllSectionAssignments,
  getSectionAssignmentsByCourseBatch,
  createSectionAssignment,
  updateSectionAssignment,
  deleteSectionAssignment,
  getAvailableSections,
  getAvailableInstructors,
  createMultipleSectionAssignments,
  getInstructorSectionLoad,
  checkInstructorOverload,
  checkInstructorWorkloadOverload
};