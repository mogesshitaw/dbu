const pool = require("../db");

// Helper function to format time
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', timeString, error);
    return timeString;
  }
};
// Helper function to calculate classes per day
const getClassesPerDay = (schedules) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const classesPerDay = {};
  
  days.forEach(day => {
    classesPerDay[day] = schedules.filter(s => s.day === day).length;
  });
  
  return classesPerDay;
};
// get today schedule 
const getTodaySchedule = async (req, res) => {
  const { day } = req.query;
  
  try {
    const today = day || new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const query = `
      SELECT 
        dc.id,
        ds.day_of_week,
        c.course_name,
        c.course_code,
        dc.start_time,
        dc.end_time,
        b.block_name,
        b.block_code,
        f.floor_number,
        r.room_number,
        r.room_type,
        u.full_name AS instructor_name,
        d.department_name,
        s.batch_id,
        s.semester_id,
        ba.batch_year as batch,
        sem.semester,
        s.section
      FROM day_courses dc
      JOIN day_schedules ds ON dc.day_schedule_id = ds.id
      JOIN schedules s ON ds.schedule_id = s.id
      JOIN course c ON dc.course_id = c.course_id
      JOIN users u ON dc.instructor_id = u.id
      JOIN rooms r ON dc.room_id = r.room_id
      JOIN floors f ON r.floor_id = f.floor_id
      JOIN blocks b ON f.block_id = b.block_id
      JOIN departments d ON s.department_id = d.department_id
      JOIN semesters sem ON s.semester_id = sem.id
      JOIN batches ba ON s.batch_id= ba.batch_id
      WHERE LOWER(ds.day_of_week) = LOWER($1)
        AND s.status = 'published'
      ORDER BY dc.start_time
    `;

    const result = await pool.query(query, [today]);

    const formattedSchedules = result.rows.map(row => ({
      id: row.id,
      course_name: row.course_name,
      course_code: row.course_code,
      start_time: row.start_time,
      end_time: row.end_time,
      location: `${row.block_code} - ${row.room_number}`,
      block_name: row.block_name,
      block_code: row.block_code,
      floor_number: row.floor_number,
      room_number: row.room_number,
      room_type: row.room_type,
      day_of_week: row.day_of_week,
      instructor_name: row.instructor_name,
      department_name: row.department_name,
      batch: row.batch,
      semester: row.semester,
      section: row.section
    }));

    res.json(formattedSchedules);
  } catch (err) {
    console.error("Error fetching today's schedule:", err);
    res.status(500).json({ error: "Failed to fetch today's schedule" });
  }
};
// create new schedule
const create = async (req, res) => {
  const { batch, semester, department_id, section, status, schedule } = req.body;
  if (!batch || !semester || !section || !department_id || !status || !schedule) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }
  const client = await pool.connect();
  let found = false;
  
  try {
    // Enhanced duplicate checking with room details
    for (const day of schedule) {
      for (const course1 of day.courses) {
        let countRepeat = 0;
        for (const course2 of day.courses) {
           if (course1.startTime == course2.startTime && course1.endTime == course2.endTime) {
             countRepeat += 1;
          }
        }
        if (countRepeat > 1) {
          // ✅ Do NOT call client.release() here — finally block handles it
          return res.status(400).json({
            message: `Schedule are repeated on ${day.day_of_week} between ${course1.startTime}-${course1.endTime}.`,
          });
        } 
      }
    }

      for (const day of schedule) {
        const dayResult = await client.query(
          "SELECT * FROM day_schedules WHERE day_of_week = $1",
          [day.day_of_week]
        );
        if (dayResult.rows.length > 0) {

          for (const course of day.courses) {
            // Check for prayer/break time conflict (overlap between 06:00 and 07:30)
            if (course.startTime < "07:30" && course.endTime > "06:00") {
              return res.status(400).json({
                message: `Cannot schedule between 06:00 and 07:30 (prayer/break time).`,
              });
            }

            // ✅ Room overlap conflict check (excludes self if re-publishing same section)
            const roomConflict = await client.query(
              `SELECT dc.start_time, dc.end_time, c.course_name,
                b.block_code, r.room_number
               FROM day_courses dc
               JOIN course c ON dc.course_id = c.course_id
               JOIN day_schedules dw ON dc.day_schedule_id = dw.id
               JOIN schedules s ON dw.schedule_id = s.id
               JOIN rooms r ON dc.room_id = r.room_id
               JOIN floors f ON r.floor_id = f.floor_id
               JOIN blocks b ON f.block_id = b.block_id
               WHERE dc.room_id = $1
                 AND dw.day_of_week = $2
                 AND dc.start_time < $3
                 AND dc.end_time   > $4
                 AND s.status = 'published'
                 AND NOT (s.batch_id = $5 AND s.semester_id = $6 AND s.section = $7 AND s.department_id = $8)`,
              [course.room_id, day.day_of_week, course.endTime, course.startTime, batch, semester, section, department_id]
            );
            if (roomConflict.rows.length > 0) {
              return res.status(400).json({
                message: `Room ${roomConflict.rows[0].block_code} - ${roomConflict.rows[0].room_number} is already booked on ${day.day_of_week} from ${roomConflict.rows[0].start_time} to ${roomConflict.rows[0].end_time}.`,
              });
            }

            // ✅ Instructor overlap conflict check (across ALL rooms — catches cross-room double-booking)
            const instrConflict = await client.query(
              `SELECT dc.start_time, dc.end_time, u.full_name
               FROM day_courses dc
               JOIN day_schedules dw ON dc.day_schedule_id = dw.id
               JOIN schedules s ON dw.schedule_id = s.id
               JOIN users u ON dc.instructor_id = u.id
               WHERE dc.instructor_id = $1
                 AND dw.day_of_week = $2
                 AND dc.start_time < $3
                 AND dc.end_time   > $4
                 AND s.status = 'published'
                 AND NOT (s.batch_id = $5 AND s.semester_id = $6 AND s.section = $7 AND s.department_id = $8)`,
              [course.instructor_id, day.day_of_week, course.endTime, course.startTime, batch, semester, section, department_id]
            );
            if (instrConflict.rows.length > 0) {
              return res.status(400).json({
                message: `Instructor ${instrConflict.rows[0].full_name} is already scheduled on ${day.day_of_week} from ${instrConflict.rows[0].start_time} to ${instrConflict.rows[0].end_time}.`,
              });
            }
          }
        }
      }
    

    // Create the new schedule
    await client.query('BEGIN');

    // Update existing schedules to draft
    await client.query(
      "UPDATE schedules SET status='draft' WHERE batch_id=$1 and semester_id=$2 and section=$3 and status='published' and department_id=$4",
      [batch, semester, section, department_id]
    ); 

    // Insert into schedules
    const schedResult = await client.query(
      "INSERT INTO schedules (batch_id, semester_id, section, status, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [batch, semester, section, status, department_id]
    );

    const scheduleId = schedResult.rows[0].id;

    // Insert day_schedules and day_courses
    for (const day of schedule) {
      const dayResult = await client.query(
        "INSERT INTO day_schedules (schedule_id, day_of_week) VALUES ($1, $2) RETURNING id",
        [scheduleId, day.day_of_week]
      );

      const dayId = dayResult.rows[0].id;

      for (const course of day.courses) {
        await client.query(
          `INSERT INTO day_courses 
           (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            dayId,
            course.course_id,
            course.room_id,
            course.instructor_id,
            course.startTime,
            course.endTime,
            course.color,
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: "Schedule created successfully." });
  } catch (err) {
    console.error("Schedule creation failed:", err);
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Failed to save schedule." });
  } finally {
    client.release();
  }
};
// get all schedule
const getAll = async (req, res) => {
  try {
    const schedulesResult = await pool.query(`SELECT 
      s.*, b.batch_year as batch, sem.semester
       FROM schedules s
      JOIN semesters sem ON s.semester_id = sem.id
      JOIN batches b ON s.batch_id= b.batch_id
      ORDER BY created_at DESC`);
    const schedules = schedulesResult.rows;
    
    if (!schedules || schedules.length === 0) {
      return res.json([]);
    }

    const scheduleIds = schedules.map(s => s.id);

    const daysResult = await pool.query(
      "SELECT * FROM day_schedules WHERE schedule_id = ANY($1) ORDER BY id",
      [scheduleIds]
    );
    const days = daysResult.rows;

    const dayIds = days.map(d => d.id);

    let dayCourses = [];
    if (dayIds.length > 0) {
      const dayCoursesResult = await pool.query(
        `SELECT 
           dc.*,
           c.course_name, c.course_code,
           b.block_name, b.block_code,
          'G'||f.floor_number || '-' || r.room_number AS room_number,
            r.room_type, r.capacity,
           i.full_name AS instructor_name
         FROM day_courses dc
         LEFT JOIN course c ON dc.course_id = c.course_id
         LEFT JOIN rooms r ON dc.room_id = r.room_id
         LEFT JOIN floors f ON r.floor_id = f.floor_id
         LEFT JOIN blocks b ON f.block_id = b.block_id
         LEFT JOIN users i ON dc.instructor_id = i.id
         WHERE dc.day_schedule_id = ANY($1)
         ORDER BY dc.start_time`,
        [dayIds]
      );
      dayCourses = dayCoursesResult.rows;
    }

    const daysById = {};
    days.forEach(d => {
      daysById[d.id] = { ...d, courses: [] };
    });

    dayCourses.forEach(c => {
      const parent = daysById[c.day_schedule_id];
      if (parent) {
        parent.courses.push({
          id: c.id,
          course_id: c.course_id,
          course_code: c.course_code,
          course_name: c.course_name,
          room_id: c.room_id,
          block_name: c.block_name,
          block_code: c.block_code,
          floor_number: c.floor_number,
          room_number: c.room_number,
          room_type: c.room_type,
          room_capacity: c.capacity,
          instructor_id: c.instructor_id,
          instructor_name: c.instructor_name,
          startTime: c.start_time,
          endTime: c.end_time,
          color: c.color,
          location: `${c.block_code} - ${c.room_number}`,
          created_at: c.created_at,
          updated_at: c.updated_at
        });
      }
    });

    const daysByScheduleId = {};
    days.forEach(d => {
      daysByScheduleId[d.schedule_id] = daysByScheduleId[d.schedule_id] || [];
      daysByScheduleId[d.schedule_id].push(daysById[d.id]);
    });

    const result = schedules.map(s => ({
      id: s.id,
      batch: s.batch,
      semester: s.semester,
      section: s.section,
      department_id: s.department_id,
      status: s.status,
      created_at: s.created_at,
      updated_at: s.updated_at,
      days: daysByScheduleId[s.id] || []
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};
const Delete = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query("DELETE FROM schedules WHERE id = $1", [id]);
    res.json({ message: "Schedule deleted", affectedRows: result.rowCount });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};
const permission = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!["draft", "published"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value. Must be 'draft' or 'published'." });
  }

  try {
    // 1. Fetch existing schedule with related metadata
    const existingResult = await pool.query(
      `SELECT s.*, b.batch_year, sem.semester, d.department_name
       FROM schedules s
       JOIN batches b ON s.batch_id = b.batch_id
       JOIN semesters sem ON s.semester_id = sem.id
       JOIN departments d ON s.department_id = d.department_id
       WHERE s.id = $1`,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found." });
    }

    const schedule = existingResult.rows[0];

    // If publishing, perform exhaustive validation and conflict checks
    if (status === 'published') {
      // Fetch all sessions belonging to this schedule
      const sessionsRes = await pool.query(
        `SELECT dc.id, dc.room_id, dc.instructor_id, dc.start_time, dc.end_time, dc.color,
                ds.day_of_week,
                c.course_name, c.course_code,
                u.full_name AS instructor_name,
                r.room_number, r.room_type,
                b.block_code
         FROM day_courses dc
         JOIN day_schedules ds ON dc.day_schedule_id = ds.id
         JOIN course c ON dc.course_id = c.course_id
         JOIN users u ON dc.instructor_id = u.id
         JOIN rooms r ON dc.room_id = r.room_id
         JOIN floors f ON r.floor_id = f.floor_id
         JOIN blocks b ON f.block_id = b.block_id
         WHERE ds.schedule_id = $1
         ORDER BY ds.day_of_week, dc.start_time`,
        [id]
      );

      if (sessionsRes.rows.length === 0) {
        return res.status(400).json({
          error: "Cannot publish an empty schedule. Please add or generate sessions first."
        });
      }

      // Check for any unresolved/conflicted sessions marked in red
      const redSessions = sessionsRes.rows.filter(s => s.color === '#ef4444');
      if (redSessions.length > 0) {
        const details = redSessions.map(s => `${s.course_code || s.course_name} on ${s.day_of_week} (${s.start_time}-${s.end_time})`).join("; ");
        return res.status(400).json({
          error: `Cannot publish: schedule has ${redSessions.length} unresolved conflict session(s): ${details}. Please resolve them before publishing.`
        });
      }

      // Internal schedule overlap check (between sessions in this same schedule)
      const conflictsFound = [];
      const sessions = sessionsRes.rows;
      for (let i = 0; i < sessions.length; i++) {
        for (let j = i + 1; j < sessions.length; j++) {
          const s1 = sessions[i];
          const s2 = sessions[j];
          if (s1.day_of_week === s2.day_of_week && isTimeOverlap(s1.start_time, s1.end_time, s2.start_time, s2.end_time)) {
            if (s1.room_id === s2.room_id) {
              conflictsFound.push(`Internal room conflict: Room ${s1.block_code}-${s1.room_number} is assigned to both ${s1.course_code} and ${s2.course_code} on ${s1.day_of_week} between ${s1.start_time} and ${s1.end_time}.`);
            }
            if (s1.instructor_id === s2.instructor_id) {
              conflictsFound.push(`Internal instructor conflict: Instructor ${s1.instructor_name} is assigned to both ${s1.course_code} and ${s2.course_code} on ${s1.day_of_week} between ${s1.start_time} and ${s1.end_time}.`);
            }
            conflictsFound.push(`Internal section conflict: Multiple courses (${s1.course_code} and ${s2.course_code}) scheduled simultaneously on ${s1.day_of_week} between ${s1.start_time} and ${s1.end_time}.`);
          }
        }
      }

      // Cross-schedule conflict check against other published schedules
      for (const session of sessions) {
        // 1. Room conflict check against other published schedules
        const roomConflict = await pool.query(
          `SELECT dc.start_time, dc.end_time,
                  c.course_name, c.course_code,
                  u.full_name AS instructor_name,
                  bat.batch_year, sem.semester, s.section, dep.department_name,
                  r.room_number, b.block_code
           FROM day_courses dc
           JOIN day_schedules ds ON dc.day_schedule_id = ds.id
           JOIN schedules s ON ds.schedule_id = s.id
           JOIN course c ON dc.course_id = c.course_id
           JOIN users u ON dc.instructor_id = u.id
           JOIN rooms r ON dc.room_id = r.room_id
           JOIN floors f ON r.floor_id = f.floor_id
           JOIN blocks b ON f.block_id = b.block_id
           JOIN batches bat ON s.batch_id = bat.batch_id
           JOIN semesters sem ON s.semester_id = sem.id
           JOIN departments dep ON s.department_id = dep.department_id
           WHERE s.status = 'published'
             AND s.id != $1
             AND ds.day_of_week = $2
             AND dc.room_id = $3
             AND dc.start_time < $4
             AND dc.end_time > $5
           LIMIT 1`,
          [id, session.day_of_week, session.room_id, session.end_time, session.start_time]
        );

        if (roomConflict.rowCount > 0) {
          const c = roomConflict.rows[0];
          conflictsFound.push(
            `Room conflict: Room ${c.block_code}-${c.room_number} is already booked on ${session.day_of_week} (${c.start_time}-${c.end_time}) by ${c.department_name} ${c.batch_year} Section ${c.section} (${c.course_code}).`
          );
        }

        // 2. Instructor conflict check against other published schedules
        const instrConflict = await pool.query(
          `SELECT dc.start_time, dc.end_time,
                  c.course_name, c.course_code,
                  u.full_name AS instructor_name,
                  bat.batch_year, sem.semester, s.section, dep.department_name
           FROM day_courses dc
           JOIN day_schedules ds ON dc.day_schedule_id = ds.id
           JOIN schedules s ON ds.schedule_id = s.id
           JOIN course c ON dc.course_id = c.course_id
           JOIN users u ON dc.instructor_id = u.id
           JOIN batches bat ON s.batch_id = bat.batch_id
           JOIN semesters sem ON s.semester_id = sem.id
           JOIN departments dep ON s.department_id = dep.department_id
           WHERE s.status = 'published'
             AND s.id != $1
             AND ds.day_of_week = $2
             AND dc.instructor_id = $3
             AND dc.start_time < $4
             AND dc.end_time > $5
           LIMIT 1`,
          [id, session.day_of_week, session.instructor_id, session.end_time, session.start_time]
        );

        if (instrConflict.rowCount > 0) {
          const c = instrConflict.rows[0];
          conflictsFound.push(
            `Instructor conflict: ${c.instructor_name} is already teaching on ${session.day_of_week} (${c.start_time}-${c.end_time}) for ${c.department_name} ${c.batch_year} Section ${c.section} (${c.course_code}).`
          );
        }
      }

      // If any conflicts found, halt and return clear error
      if (conflictsFound.length > 0) {
        const uniqueConflicts = [...new Set(conflictsFound)];
        return res.status(400).json({
          error: uniqueConflicts[0],
          message: `Cannot publish: ${uniqueConflicts.length} conflict(s) detected.`,
          conflicts: uniqueConflicts
        });
      }

      // If setting to published, set other published schedules with same criteria to draft
      await pool.query(
        `UPDATE schedules 
         SET status = 'draft', updated_at = NOW() 
         WHERE batch_id = $1 
           AND semester_id = $2 
           AND section = $3 
           AND status = 'published' 
           AND department_id = $4 
           AND id != $5`,
        [schedule.batch_id, schedule.semester_id, schedule.section, schedule.department_id, id]
      );
    }

    // Update the current schedule status
    await pool.query(
      "UPDATE schedules SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, id]
    );

    res.json({
      message: `Schedule status updated to ${status} successfully.`,
      status
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({
      error: "Failed to update schedule status",
      message: err.message || "Failed to update status"
    });
  }
};
const update = async (req, res) => {
  const scheduleId = req.params.id;
  const { batch, semester, section, department_id, status, schedule } = req.body;

  // Add validation for numeric fields
  if (isNaN(Number(batch)) || isNaN(Number(semester)) || isNaN(Number(department_id))) {
    return res.status(400).json({ message: "Batch, semester, and department_id must be numeric IDs" });
  }
  const client = await pool.connect();
  try {
    // Convert to numbers
    const batchId = Number(batch);
    const semesterId = Number(semester);
    const deptId = Number(department_id);

    if (!batchId || !semesterId || !section || !deptId || !status || !schedule) {
      return res.status(400).json({ message: "Failed to update. Please fill all required fields" });
    }

    await client.query('BEGIN');

    // Check if schedule exists
    const existing = await client.query("SELECT * FROM schedules WHERE id = $1", [scheduleId]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Update main schedule info
     await client.query(
      `UPDATE schedules 
       SET batch_id = $1, semester_id = $2, section = $3, department_id = $4, status = $5, updated_at = NOW() 
       WHERE id = $6`,
      [batchId, semesterId, section, deptId, status, scheduleId]
    );
    // Delete old day_schedules and day_courses
    const oldDays = await client.query("SELECT id FROM day_schedules WHERE schedule_id = $1", [scheduleId]);
    const oldDayIds = oldDays.rows.map(r => r.id);
    if (oldDayIds.length > 0) {
      await client.query("DELETE FROM day_courses WHERE day_schedule_id = ANY($1)", [oldDayIds]);
      await client.query("DELETE FROM day_schedules WHERE id = ANY($1)", [oldDayIds]);
    }

    // Validate duplicate rooms and instructors before inserting new ones
    for (const day of schedule) {
      for (const course1 of day.courses) {
        let countRepeat = 0, instfound = 0;
        for (const course2 of day.courses) {
          if (course1.startTime == course2.startTime && course1.endTime == course2.endTime) {
            countRepeat += 1;
          }
        }
         if (countRepeat > 1) {
          // ✅ ROLLBACK before early return — transaction was already started
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Duplicate time slot on ${day.day_of_week} between ${course1.startTime}-${course1.endTime}.`,
          });
        }
      }
    }
    
    // ✅ Cross-schedule room and instructor conflict checks for update
    for (const day of schedule) {
      for (const course of day.courses) {
        // Check for prayer/break time conflict (overlap between 06:00 and 07:30)
        if (course.startTime < "07:30" && course.endTime > "06:00") {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Cannot schedule between 06:00 and 07:30 (prayer/break time).`,
          });
        }

        const roomConflictU = await client.query(
          `SELECT dc.start_time, dc.end_time, b.block_code, r.room_number
           FROM day_courses dc
           JOIN day_schedules dw ON dc.day_schedule_id = dw.id
           JOIN schedules s ON dw.schedule_id = s.id
           JOIN rooms r ON dc.room_id = r.room_id
           JOIN floors f ON r.floor_id = f.floor_id
           JOIN blocks b ON f.block_id = b.block_id
           WHERE dc.room_id = $1 AND dw.day_of_week = $2
             AND dc.start_time < $3 AND dc.end_time > $4
             AND s.status = 'published' AND s.id != $5`,
          [course.room_id, day.day_of_week, course.endTime, course.startTime, scheduleId]
        );
        if (roomConflictU.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Room ${roomConflictU.rows[0].block_code}-${roomConflictU.rows[0].room_number} is already booked on ${day.day_of_week} from ${roomConflictU.rows[0].start_time} to ${roomConflictU.rows[0].end_time}.`,
          });
        }
        const instrConflictU = await client.query(
          `SELECT dc.start_time, dc.end_time, u.full_name
           FROM day_courses dc
           JOIN day_schedules dw ON dc.day_schedule_id = dw.id
           JOIN schedules s ON dw.schedule_id = s.id
           JOIN users u ON dc.instructor_id = u.id
           WHERE dc.instructor_id = $1 AND dw.day_of_week = $2
             AND dc.start_time < $3 AND dc.end_time > $4
             AND s.status = 'published' AND s.id != $5`,
          [course.instructor_id, day.day_of_week, course.endTime, course.startTime, scheduleId]
        );
        if (instrConflictU.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Instructor ${instrConflictU.rows[0].full_name} is already scheduled on ${day.day_of_week} from ${instrConflictU.rows[0].start_time} to ${instrConflictU.rows[0].end_time}.`,
          });
        }
      }
    }

    // Insert updated day_schedules and day_courses
    for (const day of schedule) {
      const dayResult = await client.query(
        "INSERT INTO day_schedules (schedule_id, day_of_week) VALUES ($1, $2) RETURNING id",
        [scheduleId, day.day_of_week]
      );

      const dayId = dayResult.rows[0].id;

      for (const course of day.courses) {
        await client.query(
          `INSERT INTO day_courses 
           (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time, color)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            dayId,
            course.course_id,
            course.room_id,
            course.instructor_id,
            course.startTime,
            course.endTime,
            course.color,
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: "Schedule updated successfully." });

  } catch (err) {
    console.error("Schedule update failed:", err);
    await client.query('ROLLBACK');
    res.status(500).json({ message: "Failed to update schedule." });
  } finally {
    client.release();
  }
};
const Batch = async (req, res) => {
  const { batch, semester, section, department_id } = req.query;

  try {
    let query = `
      SELECT 
        dc.id, 
        ds.day_of_week, 
        c.course_name, 
        i.full_name AS instructor_name,
        b.block_name,
        b.block_code,
       'G'||f.floor_number || '-' || r.room_number AS room_number,
        dc.start_time, 
        dc.end_time, 
        d.department_name
      FROM day_courses dc
      JOIN day_schedules ds ON dc.day_schedule_id = ds.id
      JOIN schedules s ON ds.schedule_id = s.id
      JOIN course c ON dc.course_id = c.course_id
      JOIN users i ON dc.instructor_id = i.id
      JOIN rooms r ON dc.room_id = r.room_id
      JOIN floors f ON r.floor_id = f.floor_id
      JOIN blocks b ON f.block_id = b.block_id
      JOIN departments d ON s.department_id = d.department_id
      WHERE s.status='published' 
        AND s.batch_id = $1 
        AND s.semester_id = $2 
        AND s.section = $3
    `;

    const params = [batch, semester, section];

    if (department_id) {
      query += ` AND d.department_id = $4`;
      params.push(department_id);
    }

    query += ` ORDER BY 
      CASE ds.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
      END, dc.start_time`;

    const result = await pool.query(query, params);

    const formattedResults = result.rows.map(row => ({
      ...row,
      location: `${row.block_code} - Floor ${row.floor_number} - Room ${row.room_number}`,
      start_time: formatTime(row.start_time),
      end_time: formatTime(row.end_time)
    }));

    res.json(formattedResults);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};
// GET /api/instructors/:id/schedule - Get instructor's teaching schedule
const getInstructorSchedule = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log('Fetching schedule for instructor:', id);
    
    const query = `
      SELECT 
        dc.id,
        c.course_name,
        c.course_code,
        ba.batch_year as batch,
        sem.semester,
        s.section,
        ds.day_of_week as day,
        dc.start_time,
        dc.end_time,
        b.block_code,
        r.room_type,
       'G'|| f.floor_number || '-' || r.room_number AS room_number,
        d.department_name,
        u.full_name as instructor_name,
        u.id_number as instructor_id
      FROM day_courses dc
      JOIN day_schedules ds ON dc.day_schedule_id = ds.id
      JOIN schedules s ON ds.schedule_id = s.id
      JOIN course c ON dc.course_id = c.course_id
      JOIN users u ON dc.instructor_id = u.id
      JOIN rooms r ON dc.room_id = r.room_id
      JOIN floors f ON r.floor_id = f.floor_id
      JOIN blocks b ON f.block_id = b.block_id
      JOIN departments d ON s.department_id = d.department_id
      JOIN semesters sem ON s.semester_id = sem.id
      JOIN batches ba ON s.batch_id= ba.batch_id
      WHERE (u.id = $1)
        AND s.status = 'published'
        AND (u.role = 'instructor' OR u.role = 'department_head')
      ORDER BY 
        CASE ds.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        dc.start_time
    `;

    const result = await pool.query(query, [id]);

    const formattedSchedules = result.rows.map(row => ({
      id: row.id,
      course_name: row.course_name,
      course_code: row.course_code,
      batch: row.batch,
      semester: row.semester,
      section: row.section,
      day: row.day,
      start_time: formatTime(row.start_time),
      end_time: formatTime(row.end_time),
      time_slot: `${formatTime(row.start_time)}-${formatTime(row.end_time)}`,
      room: `${row.block_code} - ${row.room_number}-${row.room_type}`,
      department_name: row.department_name,
      instructor_name: row.instructor_name,
      instructor_id: row.instructor_id
    }));

    console.log(`Found ${formattedSchedules.length} classes for instructor ${id}`);
    res.json(formattedSchedules);

  } catch (err) {
    console.error("Error fetching instructor schedule:", err);
    res.status(500).json({ error: "Failed to fetch instructor schedule" });
  }
};
// GET /api/instructors/:id - Get instructor information
const getInstructorInfo = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log('Fetching info for instructor:', id);
    
    const query = `
      SELECT 
        u.id,
        u.id_number,
        u.full_name,
        u.email,
        u.role,
        d.department_name,
        u.created_at,
        u.updatd_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE (u.id_number = $1 OR u.id = $1 :: int) 
        AND (u.role = 'instructor' OR u.role = 'department_head')
        AND u.status = 'Active'
    `;

  const result = await pool.query(query, [
      Number(id)// integer comparison
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    const instructor = result.rows[0];
    console.log('Found instructor:', instructor.full_name);
    res.json(instructor);

  } catch (err) {
    console.error('Error fetching instructor info:', err);
    res.status(500).json({ error: 'Failed to fetch instructor info' });
  }
};
// GET /api/instructors/me/schedule - Get current instructor's schedule (from session)
const getMySchedule = async (req, res) => {
  try {
    // ✅ Allow both instructor and department_head roles (SQL filters both)
    if (!req.user || !['instructor', 'department_head'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Instructor or Department Head role required.' });
    }

    const instructorId = req.user.id;
    console.log('Fetching schedule for current instructor:', instructorId, req.user.full_name);

    const query = `
      SELECT 
        dc.id,
        c.course_name,
        c.course_code,
        ba.batch_year as batch,
        sem.semester,
        s.section,
        ds.day_of_week as day,
        dc.start_time,
        dc.end_time,
        b.block_code,
       'G'||f.floor_number || '-' || r.room_number AS room_number,
        d.department_name,
        u.full_name as instructor_name,
        u.id_number as instructor_id,
        s.status as schedule_status
      FROM day_courses dc
      JOIN day_schedules ds ON dc.day_schedule_id = ds.id
      JOIN schedules s ON ds.schedule_id = s.id
      JOIN course c ON dc.course_id = c.course_id
      JOIN users u ON dc.instructor_id = u.id
      JOIN rooms r ON dc.room_id = r.room_id
      JOIN floors f ON r.floor_id = f.floor_id
      JOIN blocks b ON f.block_id = b.block_id
      JOIN departments d ON s.department_id = d.department_id
      JOIN semesters sem ON s.semester_id = sem.id
      JOIN batches ba ON s.batch_id= ba.batch_id
      WHERE (u.id_number = $1 OR u.id = $1 ::integer)
        AND s.status = 'published'
        AND (u.role = 'instructor' OR u.role = 'department_head')
        AND u.status = 'Active'
      ORDER BY 
        CASE ds.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        dc.start_time
    `;

    const result = await pool.query(query, [instructorId]);

    const formattedSchedules = result.rows.map(row => ({
      id: row.id,
      course_name: row.course_name,
      course_code: row.course_code,
      batch: row.batch,
      semester: row.semester,
      section: row.section,
      day: row.day,
      start_time: formatTime(row.start_time),
      end_time: formatTime(row.end_time),
      time_slot: `${formatTime(row.start_time)}-${formatTime(row.end_time)}`,
      room: `${row.block_code}-${row.room_number}`,
      department_name: row.department_name,
      instructor_name: row.instructor_name,
      instructor_id: row.instructor_id,
      schedule_status: row.schedule_status
    }));

    console.log(`Found ${formattedSchedules.length} classes for instructor ${instructorId}`);
    
    res.json({
      instructor: {
        id: req.user.id,
        id_number: req.user.id_number,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
        department_name: req.user.department_name,
        department_id: req.user.department_id
      },
      schedules: formattedSchedules,
      stats: {
        total_classes: formattedSchedules.length,
        classes_per_day: getClassesPerDay(formattedSchedules),
        unique_courses: [...new Set(formattedSchedules.map(s => s.course_name))].length,
        unique_batches: [...new Set(formattedSchedules.map(s => s.batch))].length
      }
    });

  } catch (err) {
    console.error("Error fetching my schedule:", err);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};
// GET /api/instructors - Get all instructors (for admin use)
const getAllInstructors = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.id_number,
        u.full_name,
        u.email,
        u.role,
        d.department_name,
        u.created_at,
        u.status
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      WHERE u.role = 'instructor'
        AND u.status = 'Active'
      ORDER BY u.full_name
    `;

    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} instructors`);
    res.json(result.rows);

  } catch (err) {
    console.error('Error fetching instructors:', err);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
};
// Get available rooms for a specific time slot (without floors)
const getAvailableRooms = async (req, res) => {
  const { day, start_time, end_time, room_type, capacity } = req.query;
  
  try {
    let query = `
      SELECT 
        r.room_id,
        'G'|| f.floor_number || '-' || r.room_number AS room_number,
        r.room_type,
        r.capacity,
        r.is_available,
        b.block_name,
        b.block_code,
        CONCAT(b.block_code, ' - Floor ', f.floor_number, ' - Room ', r.room_number) as location
      FROM rooms r
      JOIN floors f ON r.floor_id = f.floor_id
      JOIN blocks b ON f.block_id = b.block_id
      WHERE r.is_available = true
        AND r.room_id NOT IN (
          SELECT dc.room_id 
          FROM day_courses dc
          JOIN day_schedules ds ON dc.day_schedule_id = ds.id
          WHERE ds.day_of_week = $1
            AND dc.start_time < $3
            AND dc.end_time   > $2
        )
    `;

    const params = [day, start_time, end_time];

    if (room_type) {
      query += ` AND r.room_type = $${params.length + 1}`;
      params.push(room_type);
    }

    if (capacity) {
      query += ` AND r.capacity >= $${params.length + 1}`;
      params.push(parseInt(capacity));
    }

    query += ` ORDER BY b.block_name, f.floor_number, r.room_number`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching available rooms:", err);
    res.status(500).json({ error: "Failed to fetch available rooms" });
  }
};
// Get room hierarchy (blocks -> rooms)
const getRoomHierarchy = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.block_id,
        b.block_name,
        b.block_code,
        b.description as block_description,
        b.floor_capacity,
        f.floor_id,
        f.floor_number,
        f.room_capacity as floor_room_capacity,
        r.room_id,
        r.room_number,
        r.room_type,
        r.capacity as room_capacity,
        r.is_available,
        r.created_at as room_created_at
      FROM blocks b
      LEFT JOIN floors f ON b.block_id = f.block_id
      LEFT JOIN rooms r ON f.floor_id = r.floor_id
      ORDER BY b.block_name, f.floor_number::INTEGER, r.room_number
    `;

    const result = await pool.query(query);
    
    const hierarchy = result.rows.reduce((acc, row) => {
      let block = acc.find(b => b.block_id === row.block_id);
      if (!block) {
        block = {
          block_id: row.block_id,
          block_name: row.block_name,
          block_code: row.block_code,
          block_description: row.block_description,
          floor_capacity: row.floor_capacity,
          floors: []
        };
        acc.push(block);
      }

      if (row.floor_id) {
        let floor = block.floors.find(f => f.floor_id === row.floor_id);
        if (!floor) {
          floor = {
            floor_id: row.floor_id,
            floor_number: row.floor_number,
            floor_room_capacity: row.floor_room_capacity,
            rooms: []
          };
          block.floors.push(floor);
        }

        if (row.room_id) {
          floor.rooms.push({
            room_id: row.room_id,
            room_number: row.room_number,
            room_type: row.room_type,
            room_capacity: row.room_capacity,
            is_available: row.is_available,
            room_created_at: row.room_created_at
          });
        }
      }

      return acc;
    }, []);

    res.json(hierarchy);
  } catch (err) {
    console.error("Error fetching room hierarchy:", err);
    res.status(500).json({ error: "Failed to fetch room hierarchy" });
  }
}
const autoGenerateSchedule = async (req, res) => {
  // Guard: ensure scheduleData was sent
  if (!req.body || !req.body.scheduleData) {
    return res.status(400).json({ error: "Missing scheduleData in request body" });
  }

  const { batch_id, semester_id, section, department_id } = req.body.scheduleData;

  if (!batch_id || !semester_id || !section || !department_id) {
    return res.status(400).json({
      error: `Missing required fields: ${
        [!batch_id && 'batch_id', !semester_id && 'semester_id', !section && 'section', !department_id && 'department_id']
          .filter(Boolean).join(', ')
      }`
    });
  }

  const client = await pool.connect();
  const MAX_INSTRUCTOR_LOAD = 3;
  const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const conflictReport = [];
  const assignments = [];

  try {
    await client.query("BEGIN");
      await client.query(
      "UPDATE schedules SET status='draft' WHERE batch_id=$1 and semester_id=$2 and section=$3 and status='published' and department_id=$4",
      [batch_id, semester_id, section, department_id]
    ); 

    /* ---------------- CREATE SCHEDULE ---------------- */
    const schedRes = await client.query(
      `INSERT INTO schedules (department_id, batch_id, semester_id, section, status)
       VALUES ($1,$2,$3,$4,'draft')
       RETURNING id`,
      [department_id, batch_id, semester_id, section]
    );
    const scheduleId = schedRes.rows[0].id;

    /* ---------------- DAYS ---------------- */
    const dayMap = {};
    for (const day of DAYS) {
      const d = await client.query(
        `INSERT INTO day_schedules (schedule_id, day_of_week)
         VALUES ($1,$2) RETURNING id`,
        [scheduleId, day]
      );
      dayMap[day] = d.rows[0].id;
    }
   const timslot = await client.query(
    `SELECT * FROM time_slots
     WHERE department_id = $1`,
    [department_id]
    );
    /* ---------------- SLOTS ---------------- */
    const slots = await generateTimeSlots(timslot); // smart + break included
    const candidateSlots = slots;
    console.log('time slote', slots);
    
    /* ---------------- COURSES ---------------- */
          const coursesRes = await client.query(
          `SELECT 
            c.course_id,
            c.lec_hr,
            c.tut_hr,
            c.lab_hr
          FROM course_batch cb
          JOIN course c ON cb.course_id = c.course_id
          WHERE cb.department_id = $1
            AND cb.batch = $2
            AND cb.semester_id = $3`,
          [department_id, batch_id, semester_id]
    );
  
    /* ---------------- ROOMS (STRICTLY FROM section_rooms) ---------------- */
    // 1. Fetch rooms specifically assigned to this section from section_rooms
    const roomsRes = await client.query(
      `SELECT r.room_id, r.room_type, r.room_number, b.block_code,
              CONCAT(b.block_code, ' - Room ', r.room_number) as location
       FROM section_rooms sr
       JOIN rooms r ON sr.room_id = r.room_id
       LEFT JOIN floors f ON r.floor_id = f.floor_id
       LEFT JOIN blocks b ON f.block_id = b.block_id
       WHERE sr.department_id = $1
         AND sr.batch_id = $2
         AND LOWER(TRIM(sr.section)) = LOWER(TRIM($3))
         AND r.is_available = true`,
      [department_id, batch_id, section]
    );

    let availableRooms = [...roomsRes.rows];

    // Check what types of rooms are assigned to this section strictly from section_rooms
    let hasClassroom = availableRooms.some(r => r.room_type === "classroom");
    let hasLab = availableRooms.some(r => r.room_type === "lab");

    console.log(`[autoGenerate] Section ${section} (Batch ${batch_id}, Dept ${department_id}) detected rooms strictly from section_rooms:`, availableRooms.map(r => `${r.room_number} (${r.room_type})`));
    console.log(`[autoGenerate] hasClassroom: ${hasClassroom}, hasLab: ${hasLab}`);

    /* ---------------- PREPARE SESSIONS ---------------- */
    const allSessions = [];
    for (const course of coursesRes.rows) {
      allSessions.push(...calculateCourseSessions(course, timslot));
    }
    const totalLectureTutorial = allSessions.filter(s => s.type === 'LEC').length;
    const totalLab = allSessions.filter(s => s.type === 'LAB').length;

    console.log("Total Lecture + Tutorial class :", totalLectureTutorial);
    console.log("Total Lab class:", totalLab);
    console.log("All sessions count:", allSessions.length);
    
    const courseDayUsage = {};
    let k = 0;

    /* ---------------- PHASE 1: CLEAN SCHEDULING (WITHOUT CONFLICT) ---------------- */
    const unplacedSessions = [];

    for (const session of allSessions) {
      // 1. Check section-specific assignment in course_section_instructor_assign
      let instRes = await client.query(
        `SELECT i.instructor_id, u.full_name
         FROM course_section_instructor_assign i
         JOIN course_batch cb ON i.course_batch_id=cb.id
         JOIN users u ON i.instructor_id=u.id
         WHERE cb.course_id=$1
           AND cb.department_id=$2
           AND cb.batch=$3
           AND LOWER(TRIM(i.section)) = LOWER(TRIM($4))`, 
        [session.course_id, department_id, batch_id, section]
      );

      let instructorId = instRes.rowCount > 0 ? instRes.rows[0].instructor_id : null;
      let instructorFullName = instRes.rowCount > 0 ? instRes.rows[0].full_name : null;
      let hasSectionInstructor = !!instructorId;

      session.instructorId = instructorId;
      session.instructorName = instructorFullName;
      session.hasSectionInstructor = hasSectionInstructor;

      // 2. Check if section has required room type in availableRooms (from section_rooms)
      const hasClassroomForSection = availableRooms.some(r => r.room_type === 'classroom');
      const hasLabForSection = availableRooms.some(r => r.room_type === 'lab');
      const hasRoomForSession = session.type === 'LAB' ? hasLabForSection : hasClassroomForSection;
      session.hasRoomForSession = hasRoomForSession;

      // If either instructor or room is missing for this section, record exact root cause
      if (!hasSectionInstructor || !hasRoomForSession) {
        const failureReasons = [];
        if (!hasSectionInstructor) {
          failureReasons.push(`No instructor assigned to Section ${section} for course ID ${session.course_id}`);
        }
        if (!hasRoomForSession) {
          failureReasons.push(`No ${session.type === 'LAB' ? 'lab room' : 'classroom'} assigned to Section ${section} in section_rooms`);
        }
        unplacedSessions.push({
          session,
          missingInstructor: !hasSectionInstructor,
          missingRoom: !hasRoomForSession,
          reason: failureReasons.join("; ")
        });
        continue;
      }

      let placed = false;
      const candidateSlots = slots;
      const sessionKey = `${session.course_id}_${session.type}`;

      // Two-pass clean placement:
      // Pass 1: Try placing on a day where this session type hasn't been placed yet
      // Pass 2: Allow placing on any day as long as time/room/instructor does not conflict
      for (const relaxDayLimit of [false, true]) {
        if (placed) break;

        for (const [dayName, dayScheduleId] of Object.entries(dayMap)) {
          if (placed) break;

          courseDayUsage[dayScheduleId] ??= new Set();
          if (!relaxDayLimit && courseDayUsage[dayScheduleId].has(sessionKey)) continue;

          for (const slot of candidateSlots) {
            if (placed) break;

            const sessionStartTime = slot.start_time;
            const sessionEndTime = addHours(sessionStartTime, session.duration);

            // Ensure session fits within the department day end time
            const dayEndMin = (timslot?.rows?.[0]?.end_time) ? timeToMinutes(timslot.rows[0].end_time) : timeToMinutes("18:00");
            if (timeToMinutes(sessionEndTime) > dayEndMin) continue;

            // Ensure session does not overlap the lunch/prayer break (06:30 - 07:30)
            if (isTimeOverlap(sessionStartTime, sessionEndTime, "06:30", "07:30")) continue;

            for (const room of availableRooms) {
              // Room type compatibility
              if (session.type === "LAB" && room.room_type !== "lab" && hasLab) continue;
              if (session.type === "LEC" && room.room_type === "lab") continue;

              // Max instructor load per day
              const loadRes = await client.query(
                `SELECT COUNT(*) as count
                 FROM day_courses dc
                 JOIN day_schedules ds ON dc.day_schedule_id=ds.id
                 JOIN schedules s ON ds.schedule_id=s.id
                 WHERE dc.instructor_id=$1
                   AND ds.day_of_week=$2
                   AND s.status='published'
                   AND s.id != $3`,
                [instructorId, dayName, scheduleId]
              );
              if (parseInt(loadRes.rows[0].count) >= MAX_INSTRUCTOR_LOAD) continue;

              // Global instructor interval overlap check
              const globalConflict = await client.query(
                `SELECT 1
                 FROM day_courses dc
                 JOIN day_schedules ds ON dc.day_schedule_id=ds.id
                 JOIN schedules s ON ds.schedule_id=s.id
                 WHERE dc.instructor_id=$1
                   AND ds.day_of_week=$2
                   AND dc.start_time < $3
                   AND dc.end_time > $4
                   AND s.status='published'
                   AND s.id != $5
                 LIMIT 1`,
                [instructorId, dayName, sessionEndTime, sessionStartTime, scheduleId]
              );
              if (globalConflict.rowCount > 0) continue;

              // Global room interval overlap check
              const roomGlobalConflict = await client.query(
                `SELECT 1
                 FROM day_courses dc
                 JOIN day_schedules ds ON dc.day_schedule_id=ds.id
                 JOIN schedules s ON ds.schedule_id=s.id
                 WHERE dc.room_id=$1
                   AND ds.day_of_week=$2
                   AND dc.start_time < $3
                   AND dc.end_time > $4
                   AND s.status='published'
                   AND s.id != $5
                 LIMIT 1`,
                [room.room_id, dayName, sessionEndTime, sessionStartTime, scheduleId]
              );
              if (roomGlobalConflict.rowCount > 0) continue;

              // Local conflict: check interval overlap for room, instructor, or same section (dayScheduleId)
              const localConflict = assignments.find(a =>
                a.day === dayName &&
                isTimeOverlap(a.start, a.end, sessionStartTime, sessionEndTime) &&
                (a.room === room.room_id || a.instructor === instructorId || a.dayScheduleId === dayScheduleId)
              );
              if (localConflict) continue;

              // INSERT Clean session with standard BLUE color #3b82f6
              const insClean = await client.query(
                `INSERT INTO day_courses
                 (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time, color)
                 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
                [
                  dayScheduleId,
                  session.course_id,
                  room.room_id,
                  instructorId,
                  sessionStartTime,
                  sessionEndTime,
                  '#3b82f6',
                ]
              );

              assignments.push({
                dayCourseId: insClean.rows[0].id,
                dayScheduleId: dayScheduleId,
                course_id: session.course_id,
                type: session.type,
                day: dayName,
                start: sessionStartTime,
                end: sessionEndTime,
                room: room.room_id,
                instructor: instructorId,
                is_conflicted: false,
              });

              courseDayUsage[dayScheduleId].add(sessionKey);
              placed = true;
              break;
            }
          }
        }
      }

      if (!placed) {
        // Build a specific reason for why this session could NOT be placed
        const whyUnplaced = [];
        if (!session.instructorId) {
          whyUnplaced.push(`No instructor assigned to Section ${section} for course ID ${session.course_id}`);
        } else {
          whyUnplaced.push(`Instructor ${session.instructorName || ''} has no free ${session.type} slot across all ${DAYS.length} days (schedule fully booked)`);
        }
        const needsLab = session.type === 'LAB';
        const labRooms = availableRooms.filter(r => r.room_type === 'lab');
        const classRooms = availableRooms.filter(r => r.room_type !== 'lab');
        if (needsLab && labRooms.length === 0) {
          whyUnplaced.push(`No lab room assigned to Section ${section} in section_rooms`);
        } else if (!needsLab && classRooms.length === 0) {
          whyUnplaced.push(`No classroom assigned to Section ${section} in section_rooms`);
        } else {
          whyUnplaced.push(`All ${session.type === 'LAB' ? 'lab' : 'classroom'} rooms are fully booked in all time slots`);
        }
        unplacedSessions.push({
          session,
          missingInstructor: !session.instructorId,
          missingRoom: needsLab ? labRooms.length === 0 : classRooms.length === 0,
          reason: whyUnplaced.join('; ')
        });
      }
    }

    /* ---------------- PHASE 2: OPTION 2 - AUTOMATIC FREE-SLOT SEARCH & PLACEMENT ---------------- */
    // For any unplaced session that has an instructor and room,
    // search all available free time slots across the entire week in this schedule.
    // If a free time slot is found, assign the conflicted course to it cleanly (#3b82f6)!
    const trulyConflictedSessions = [];

    for (const item of unplacedSessions) {
      const session = item.session;

      // If either instructor or room is missing, it cannot be assigned to a free slot
      if (item.missingInstructor || item.missingRoom) {
        trulyConflictedSessions.push(item);
        continue;
      }

      let placedInFreeSlot = false;

      // Scan all days and candidate slots for an open free window
      for (const [dayName, dayScheduleId] of Object.entries(dayMap)) {
        if (placedInFreeSlot) break;

        for (const slot of slots) {
          if (placedInFreeSlot) break;

          const sessionStartTime = slot.start_time;
          const sessionEndTime = addHours(sessionStartTime, session.duration);

          // Fit within department day bounds
          const dayEndMin = (timslot?.rows?.[0]?.end_time) ? timeToMinutes(timslot.rows[0].end_time) : timeToMinutes("18:00");
          if (timeToMinutes(sessionEndTime) > dayEndMin) continue;

          // Avoid break (06:30 - 07:30)
          if (isTimeOverlap(sessionStartTime, sessionEndTime, "06:30", "07:30")) continue;

          // 1. Is this section already busy in this slot?
          const sectionBusy = assignments.some(a =>
            a.dayScheduleId === dayScheduleId &&
            isTimeOverlap(a.start, a.end, sessionStartTime, sessionEndTime)
          );
          if (sectionBusy) continue;

          for (const room of availableRooms) {
            if (session.type === "LAB" && room.room_type !== "lab") continue;
            if (session.type === "LEC" && room.room_type === "lab") continue;

            // 2. Instructor daily load check
            const loadRes = await client.query(
              `SELECT COUNT(*) as count
               FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id=ds.id
               JOIN schedules s ON ds.schedule_id=s.id
               WHERE dc.instructor_id=$1
                 AND ds.day_of_week=$2
                 AND s.status='published'
                 AND s.id != $3`,
              [session.instructorId, dayName, scheduleId]
            );
            if (parseInt(loadRes.rows[0].count) >= MAX_INSTRUCTOR_LOAD) continue;

            // 3. Global instructor collision check
            const globalConflict = await client.query(
              `SELECT 1
               FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id=ds.id
               JOIN schedules s ON ds.schedule_id=s.id
               WHERE dc.instructor_id=$1
                 AND ds.day_of_week=$2
                 AND dc.start_time < $3
                 AND dc.end_time > $4
                 AND s.status='published'
                 AND s.id != $5
               LIMIT 1`,
              [session.instructorId, dayName, sessionEndTime, sessionStartTime, scheduleId]
            );
            if (globalConflict.rowCount > 0) continue;

            // 4. Global room collision check
            const roomGlobalConflict = await client.query(
              `SELECT 1
               FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id=ds.id
               JOIN schedules s ON ds.schedule_id=s.id
               WHERE dc.room_id=$1
                 AND ds.day_of_week=$2
                 AND dc.start_time < $3
                 AND dc.end_time > $4
                 AND s.status='published'
                 AND s.id != $5
               LIMIT 1`,
              [room.room_id, dayName, sessionEndTime, sessionStartTime, scheduleId]
            );
            if (roomGlobalConflict.rowCount > 0) continue;

            // 5. Local collision check in this schedule
            const localConflict = assignments.find(a =>
              a.day === dayName &&
              isTimeOverlap(a.start, a.end, sessionStartTime, sessionEndTime) &&
              (a.room === room.room_id || a.instructor === session.instructorId || a.dayScheduleId === dayScheduleId)
            );
            if (localConflict) continue;

            // Free slot found! Assign cleanly into this free slot with standard BLUE #3b82f6
            const insFit = await client.query(
              `INSERT INTO day_courses
               (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time, color)
               VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
              [
                dayScheduleId,
                session.course_id,
                room.room_id,
                session.instructorId,
                sessionStartTime,
                sessionEndTime,
                '#3b82f6',
              ]
            );

            assignments.push({
              dayCourseId: insFit.rows[0].id,
              dayScheduleId: dayScheduleId,
              course_id: session.course_id,
              type: session.type,
              day: dayName,
              start: sessionStartTime,
              end: sessionEndTime,
              room: room.room_id,
              instructor: session.instructorId,
              is_conflicted: false,
            });

            placedInFreeSlot = true;
            console.log(`[Option 2 Auto-Fit] Successfully assigned conflicted ${session.type} of Course ID ${session.course_id} into free slot on ${dayName} (${sessionStartTime}-${sessionEndTime}) in Room ${room.room_number}`);
            break;
          }
        }
      }

      if (!placedInFreeSlot) {
        // 🔄 Ejection Chain Swap Relocation
        const swapRes = await attemptEjectionChainSwap({
          client,
          scheduleId,
          dayMap,
          slots,
          timslot,
          availableRooms,
          assignments,
          conflictedCourse: {
            id: null,
            course_id: session.course_id,
            durationHours: session.duration,
            sessionType: session.type,
            instructorId: session.instructorId,
          },
          MAX_INSTRUCTOR_LOAD,
        });

        if (swapRes.success) {
          placedInFreeSlot = true;
          console.log(`[Ejection Swap Auto-Fit] Successfully resolved conflicted Course ID ${session.course_id} via swap relocation!`);
        }
      }

      if (!placedInFreeSlot) {
        trulyConflictedSessions.push(item);
      }
    }

    /* ---------------- PHASE 3: REGISTER UNRESOLVED CONFLICTED SESSIONS ---------------- */
    for (const item of trulyConflictedSessions) {
      const session = item.session;
      
      // Fetch course name and code
      let courseName = `Course ID ${session.course_id}`;
      let courseCode = '';
      const courseInfo = await client.query(
        `SELECT course_name, course_code FROM course WHERE course_id = $1`,
        [session.course_id]
      );
      if (courseInfo.rowCount > 0) {
        courseName = courseInfo.rows[0].course_name;
        courseCode = courseInfo.rows[0].course_code;
      }

      // Safe DB fallback IDs for insertion into day_courses (foreign key requirements)
      let dbInstructorId = session.instructorId;
      if (!dbInstructorId) {
        const anyInst = await client.query(`SELECT id FROM users WHERE role = 'instructor' LIMIT 1`);
        dbInstructorId = anyInst.rowCount > 0 ? anyInst.rows[0].id : 1;
      }

      const defaultRoom = availableRooms.find(r => session.type === 'LAB' ? r.room_type === 'lab' : r.room_type !== 'lab')
        || availableRooms[0]
        || { room_id: 1, room_type: "classroom", room_number: "TBD" };

      // Find a slot where this section isn't already occupied
      let chosenDayName = "Monday";
      let chosenDayId = dayMap["Monday"];
      let chosenSlot = slots[0] || { start_time: "08:00", end_time: "10:00" };
      let chosenRoom = defaultRoom;
      let placedForSection = false;

      for (const [dayName, dayScheduleId] of Object.entries(dayMap)) {
        if (placedForSection) break;
        for (const slot of slots) {
          const sectionBusy = assignments.some(a =>
            a.dayScheduleId === dayScheduleId &&
            isTimeOverlap(a.start, a.end, slot.start_time, slot.end_time)
          );
          if (!sectionBusy) {
            chosenDayName = dayName;
            chosenDayId = dayScheduleId;
            chosenSlot = slot;
            placedForSection = true;
            break;
          }
        }
      }

      if (!placedForSection) {
        const firstEntry = Object.entries(dayMap)[0];
        chosenDayName = firstEntry[0];
        chosenDayId = firstEntry[1];
        chosenSlot = slots[slots.length - 1] || { start_time: "07:30", end_time: "09:30" };
      }

      // BUILD ACCURATE ERROR REASON & SUGGESTED ACTION
      let conflictReasonText = item.reason;
      let suggestedActionText = '';

      if (item.missingInstructor || item.missingRoom) {
        // True root cause: Missing instructor or missing room!
        const specificConflicts = [];
        if (item.missingInstructor) {
          specificConflicts.push(`No instructor assigned to Section ${section} for ${courseCode || courseName}`);
        }
        if (item.missingRoom) {
          specificConflicts.push(`No ${session.type === 'LAB' ? 'lab room' : 'classroom'} assigned to Section ${section} in section_rooms`);
        }
        conflictReasonText = specificConflicts.join("; ");

        if (item.missingInstructor && item.missingRoom) {
          suggestedActionText = `Assign an instructor to Section ${section} and assign a ${session.type === 'LAB' ? 'lab room' : 'classroom'} in section_rooms`;
        } else if (item.missingInstructor) {
          suggestedActionText = `Assign an instructor to Section ${section} for ${courseCode || courseName} in Course Section Instructor Assignment`;
        } else if (item.missingRoom) {
          suggestedActionText = `Assign a ${session.type === 'LAB' ? 'lab room' : 'classroom'} to Section ${section} in Section Room Management`;
        }
      } else {
        // True timetable conflict (Instructor or room booked elsewhere in all free slots)
        const specificConflicts = [];

        const instrOverlap = await client.query(
          `SELECT u.full_name, dc.start_time, dc.end_time FROM day_courses dc
           JOIN day_schedules ds ON dc.day_schedule_id=ds.id
           JOIN users u ON dc.instructor_id=u.id
           WHERE dc.instructor_id=$1 AND ds.day_of_week=$2
             AND dc.start_time < $3 AND dc.end_time > $4
           LIMIT 1`,
          [dbInstructorId, chosenDayName, chosenSlot.end_time, chosenSlot.start_time]
        );
        if (instrOverlap.rowCount > 0) {
          specificConflicts.push(`Instructor ${instrOverlap.rows[0].full_name} is already booked on ${chosenDayName} (${instrOverlap.rows[0].start_time}-${instrOverlap.rows[0].end_time})`);
        }

        const roomOverlap = await client.query(
          `SELECT b.block_code, r.room_number, dc.start_time, dc.end_time FROM day_courses dc
           JOIN day_schedules ds ON dc.day_schedule_id=ds.id
           JOIN rooms r ON dc.room_id=r.room_id
           JOIN floors f ON r.floor_id=f.floor_id
           JOIN blocks b ON f.block_id=b.block_id
           WHERE dc.room_id=$1 AND ds.day_of_week=$2
             AND dc.start_time < $3 AND dc.end_time > $4
           LIMIT 1`,
          [chosenRoom.room_id, chosenDayName, chosenSlot.end_time, chosenSlot.start_time]
        );
        if (roomOverlap.rowCount > 0) {
          specificConflicts.push(`Room ${roomOverlap.rows[0].block_code}-${roomOverlap.rows[0].room_number} is already booked on ${chosenDayName} (${roomOverlap.rows[0].start_time}-${roomOverlap.rows[0].end_time})`);
        }

        if (specificConflicts.length === 0) {
          specificConflicts.push(item.reason || "No free time slots available across all timetable days");
        }

        conflictReasonText = specificConflicts.join("; ");
        suggestedActionText = session.type === 'LAB'
          ? 'Free up a lab room slot or adjust course timetable manually'
          : 'Free up a classroom slot or reassign the instructor manually';
      }

      // INSERT Conflicted session with RED WARNING COLOR #ef4444
      await client.query(
        `INSERT INTO day_courses
         (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          chosenDayId,
          session.course_id,
          chosenRoom.room_id,
          dbInstructorId,
          chosenSlot.start_time,
          chosenSlot.end_time,
          '#ef4444', // 🔴 Red Warning Color
        ]
      );

      assignments.push({
        dayScheduleId: chosenDayId,
        course_id: session.course_id,
        type: session.type,
        
        day: chosenDayName,
        start: chosenSlot.start_time,
        end: chosenSlot.end_time,
        room: chosenRoom.room_id,
        instructor: dbInstructorId,
        is_conflicted: true,
      });

      // User-facing conflict report with accurate instructor and room status
      conflictReport.push({
        course_id:       session.course_id,
        course_name:     courseName,
        course_code:     courseCode,
        session_type:    session.type,            // LEC or LAB
        type:            session.type,            // for frontend compatibility
        instructor_id:   item.missingInstructor ? null : dbInstructorId,
        instructor_name: item.missingInstructor ? "Not Assigned" : (session.instructorName || `Instructor ID ${dbInstructorId}`),
        day:             chosenDayName,
        start_time:      chosenSlot.start_time,
        end_time:        chosenSlot.end_time,
        timestamp:       new Date().toISOString(),
        room_id:         item.missingRoom ? null : chosenRoom.room_id,
        room_number:     item.missingRoom ? "Not Assigned" : (chosenRoom.room_number || 'TBD'),
        room_type:       item.missingRoom ? "Not Assigned" : (chosenRoom.room_type   || 'unknown'),
        reason:          conflictReasonText,      // human-readable cause
        color:           '#ef4444',               // 🔴 red in UI
        suggested_action: suggestedActionText,
        suggested_fix:   suggestedActionText,
      });
    }

    /* ---------------- FINAL STATUS ---------------- */
    const hasConflicts = conflictReport.length > 0;
    // Database schema constraint restricts status to 'draft' or 'published'
    const finalStatus = hasConflicts ? "draft" : "published";

    await client.query(
      `UPDATE schedules
       SET status=$1, updated_at=NOW()
       WHERE id=$2`,
      [finalStatus, scheduleId]
    );

    await client.query("COMMIT");

    /* ---------------- RESPONSE ---------------- */
    return res.json({
      success: !hasConflicts,
      schedule_id: scheduleId,
      status: finalStatus,
      total_sessions: allSessions.length,
      scheduled_sessions: assignments.length,
      clean_sessions: assignments.filter(a => !a.is_conflicted).length,
      conflicted_sessions: conflictReport.length,
      conflicts: conflictReport,
      message: !hasConflicts
        ? "Schedule generated successfully without conflicts"
        : `Schedule registered with ${conflictReport.length} conflict(s) highlighted in red. Status is set to 'draft'. Please review with AI suggestions and resolve conflicts before publishing.`
    });

  } catch (err) {
    console.error("❌ autoGenerateSchedule error:", err);
    await client.query("ROLLBACK");
    // Always return a string so the frontend can display it
    const errorMsg =
      (err && err.message)
        ? err.message
        : (typeof err === 'string' ? err : JSON.stringify(err) || 'Unknown server error');
    return res.status(400).json({ error: errorMsg });
  } finally {
    client.release();
  }
};

/* ---------------- TIME AND SESSION HELPERS ---------------- */
function normalizeTime(t) {
  if (!t) return "00:00";
  const parts = t.toString().trim().split(":");
  const h = (parts[0] || "0").padStart(2, "0");
  const m = (parts[1] || "00").padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMinutes(t) {
  const [h, m] = normalizeTime(t).split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isTimeOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

function addHours(time, hours) {
  const mins = timeToMinutes(time) + Math.round(hours * 60);
  return minutesToTime(mins);
}

function diffHours(start, end) {
  return (timeToMinutes(end) - timeToMinutes(start)) / 60;
}

function timeLessThan(t1, t2) {
  return timeToMinutes(t1) <= timeToMinutes(t2);
}

function generateTimeSlots(timslot) {
  const slots = [];
  const BREAK_START = "06:30";
  const BREAK_END   = "07:30";
  const breakStartMin = timeToMinutes(BREAK_START);
  const breakEndMin   = timeToMinutes(BREAK_END);

  const rows = (timslot && timslot.rows && timslot.rows.length > 0)
    ? timslot.rows
    : [{ start_time: "08:00", end_time: "18:00", lecture_duration: 2, labratory_duration: 3 }];

  for (const row of rows) {
    const dayStartMin = timeToMinutes(row.start_time || "08:00");
    const dayEndMin   = timeToMinutes(row.end_time   || "18:00");
    // Use the SMALLEST duration so every slot fits both LEC and LAB
    const lecDurMin   = Math.max((Number(row.lecture_duration)   || 2) * 60, 60);
    const labDurMin   = Math.max((Number(row.labratory_duration) || 3) * 60, 60);
    const slotDurMin  = Math.min(lecDurMin, labDurMin); // smallest unit

    /* --- Generate ALL slots across the full day (skip prayer/break window) --- */
    let cur = dayStartMin;
    while (cur < dayEndMin) {
      const slotEnd = cur + slotDurMin;

      // Skip slots that overlap with the prayer/break window
      const overlapsBreak = cur < breakEndMin && slotEnd > breakStartMin;
      if (overlapsBreak) {
        // Jump to after the break
        cur = breakEndMin;
        continue;
      }

      if (slotEnd <= dayEndMin) {
        // slot_type = "ANY" — both LEC and LAB can use any slot
        // Room-type matching (lab room vs classroom) is handled during placement
        slots.push({
          start_time: minutesToTime(cur),
          end_time:   minutesToTime(slotEnd),
          slot_type:  "ANY"
        });
      }
      cur += slotDurMin;
    }
  }

  return slots;
}

function calculateCourseSessions(course, timslot) {
  const sessions = [];
  const row = (timslot && timslot.rows && timslot.rows.length > 0)
    ? timslot.rows[0]
    : { lecture_duration: 2, labratory_duration: 3 };

  const lecDur = Math.max(Number(row.lecture_duration)   || 2, 1);
  const labDur = Math.max(Number(row.labratory_duration) || 3, 1); // ✅ use actual lab duration

  const totalLecHours = (Number(course.lec_hr) || 0) + (Number(course.tut_hr) || 0);
  const totalLabHours = Number(course.lab_hr) || 0;

  const lecSlots = lecDur > 0 ? Math.ceil(totalLecHours / lecDur) : 0;
  const labSlots = labDur > 0 ? Math.ceil(totalLabHours / labDur) : 0;

  for (let i = 0; i < lecSlots; i++) {
    sessions.push({ course_id: course.course_id, type: "LEC", duration: lecDur });
  }
  for (let i = 0; i < labSlots; i++) {
    sessions.push({ course_id: course.course_id, type: "LAB", duration: labDur, is_lab: true });
  }

  return sessions;
}


/* ======================================================================
   🤖 AI SCHEDULE SUGGESTION (Optional — requires GEMINI_API_KEY in .env)
   GET /api/schedules/:id/ai-suggest
   ====================================================================== */
const aiScheduleSuggestion = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      success: false,
      enabled: false,
      message: "AI integration is not configured. Add GEMINI_API_KEY to your .env file to enable this feature.",
      howTo: "Get a free API key at https://aistudio.google.com/app/apikey"
    });
  }

  const { id } = req.params;
  try {
    // Fetch schedule metadata
    const schedRes = await pool.query(
      `SELECT s.*, b.batch_year, sem.semester, d.department_name
       FROM schedules s
       JOIN batches b ON s.batch_id = b.batch_id
       JOIN semesters sem ON s.semester_id = sem.id
       JOIN departments d ON s.department_id = d.department_id
       WHERE s.id = $1`,
      [id]
    );
    if (schedRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }
    const schedule = schedRes.rows[0];

    // Fetch all class sessions
    const daysRes = await pool.query(
      `SELECT ds.day_of_week,
              c.course_name, c.course_code, c.lec_hr, c.lab_hr,
              u.full_name AS instructor_name,
              b.block_code, r.room_number, r.room_type, r.capacity,
              dc.start_time, dc.end_time
       FROM day_schedules ds
       JOIN day_courses dc ON dc.day_schedule_id = ds.id
       JOIN course c ON dc.course_id = c.course_id
       JOIN users u ON dc.instructor_id = u.id
       JOIN rooms r ON dc.room_id = r.room_id
       JOIN floors f ON r.floor_id = f.floor_id
       JOIN blocks b ON f.block_id = b.block_id
       WHERE ds.schedule_id = $1
       ORDER BY
         CASE ds.day_of_week
           WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 ELSE 6
         END, dc.start_time`,
      [id]
    );

    if (daysRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Schedule has no class sessions to analyse." });
    }

    // Build human-readable schedule text for the prompt
    const byDay = {};
    daysRes.rows.forEach(row => {
      if (!byDay[row.day_of_week]) byDay[row.day_of_week] = [];
      byDay[row.day_of_week].push(
        `  ${row.start_time}–${row.end_time}: ${row.course_code} (${row.course_name}) | Instructor: ${row.instructor_name} | Room: ${row.block_code}-${row.room_number} (${row.room_type}, cap:${row.capacity})`
      );
    });
    const scheduleText = Object.entries(byDay)
      .map(([day, entries]) => `${day}:\n${entries.join("\n")}`)
      .join("\n\n");

    const prompt = `You are an expert academic scheduler for Debre Berhan University (DBU), an Ethiopian higher education institution.

Analyse the following weekly class schedule:
• Department : ${schedule.department_name}
• Year/Batch : ${schedule.batch_year}
• Semester   : ${schedule.semester}
• Section    : ${schedule.section}
• Status     : ${schedule.status}

${scheduleText}

Provide a comprehensive, detailed, and structured analysis for the Department Head:
1. **Schedule Quality Score (1–10)**:
   - Provide a numerical score from 1 to 10.
   - Give an in-depth justification detailing strengths, structural bottlenecks, and feasibility.
2. **Issues Detected & Risk Analysis**:
   - Instructor Fatigue & Overload: Highlight instructors with >3 sessions/day or heavy back-to-back lectures.
   - Student Learning Experience: Identify long gaps/dead hours between classes or exhausting consecutive lab blocks.
   - Facility & Room Allocation: Verify if practical lab sessions are correctly placed in computer/hardware labs vs general lecture halls, and check room capacity matching.
3. **Actionable Optimisation Suggestions**:
   - Provide clear, specific improvements naming exact courses, recommended days, and rooms to relocate.
4. **Ethiopian Higher Education Context (DBU Guidelines)**:
   - Check strict compliance with DBU working hours (08:00 – 17:00).
   - Ensure the university lunch break (12:00 – 13:30) and morning prayer window (06:00 – 07:30) are free of classes.

Provide full, thorough explanations with detailed bullet points so the Department Head has clear, actionable guidance.`;

    const geminiResult = await callGemini(apiKey, prompt, 4096);

    if (!geminiResult) {
      return res.status(502).json({ success: false, message: "AI service returned an error. Check your GEMINI_API_KEY." });
    }

    return res.json({
      success: true,
      enabled: true,
      schedule_id: Number(id),
      schedule_info: {
        department: schedule.department_name,
        batch: schedule.batch_year,
        semester: schedule.semester,
        section: schedule.section,
        status: schedule.status,
        total_classes: daysRes.rows.length
      },
      ai_suggestion: geminiResult.text,
      model: geminiResult.model,
      disclaimer: "AI-generated suggestion — always verify against your institution's scheduling policies."
    });

  } catch (err) {
    console.error("aiScheduleSuggestion error:", err);
    res.status(500).json({ success: false, error: "Failed to generate AI suggestion" });
  }
};

/* ======================================================================
   🤖 AI CONFLICT RESOLUTION (Requires GEMINI_API_KEY in .env)
   POST /api/schedules/ai-resolve-conflicts
   ====================================================================== */
const aiConflictResolution = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(501).json({
      success: false,
      message: "AI integration is not configured. Add GEMINI_API_KEY to your .env file to enable this feature.",
      howTo: "Get a free API key at https://aistudio.google.com/app/apikey"
    });  
  }

  const { schedule_id, conflicts, batch_id, semester_id, section, department_id } = req.body;

  if (!conflicts || !Array.isArray(conflicts) || conflicts.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No conflicts provided to analyze."
    });
  }

  try {
    // Gather context: course info, department rooms, department time slots
    const courseIds = conflicts.map(c => c.course_id).filter(Boolean);
    let coursesInfo = [];
    if (courseIds.length > 0) {
      const cRes = await pool.query(
        `SELECT course_id, course_code, course_name, lec_hr, lab_hr, tut_hr
         FROM course WHERE course_id = ANY($1)`,
        [courseIds]
      );
      coursesInfo = cRes.rows;
    }

    // Get rooms available in this department/section
    const roomsRes = await pool.query(
      `SELECT r.room_number, r.room_type, r.capacity, b.block_code, b.block_name
       FROM rooms r
       JOIN floors f ON r.floor_id = f.floor_id
       JOIN blocks b ON f.block_id = b.block_id
       WHERE r.is_available = true
       LIMIT 20`
    );

    const conflictDetails = conflicts.map((c, idx) => {
      const course = coursesInfo.find(co => co.course_id === c.course_id);
      return `${idx + 1}. Course: ${course ? `${course.course_code} (${course.course_name})` : `Course ID ${c.course_id}`} | Session Type: ${c.type || 'LEC'} | Reason: ${c.reason || 'No available slot / instructor / room'}`;
    }).join('\n');

    const roomSummary = roomsRes.rows.map(r => `${r.block_code}-${r.room_number} (${r.room_type}, cap: ${r.capacity})`).join(', ');

    const prompt = `You are an expert university schedule optimizer for Debre Berhan University (DBU).
The automated scheduling algorithm encountered the following unplaced sessions/conflicts for Section ${section || 'A'}:

Unscheduled Sessions & Conflicts:
${conflictDetails}

Available Campus Rooms:
${roomSummary || 'Standard departmental classrooms and computer laboratories'}

Operational Constraints & Rules at DBU:
- Working hours: 08:00 – 17:00 (East Africa Time).
- Prayer/Break window: 06:00 – 07:30 (or lunch break 12:00-13:30). No classes in this window.
- Lecture sessions (LEC) are typically 2 hours in morning slots; Laboratory sessions (LAB) are 2–3 hours in afternoon slots.
- Maximum teaching load per instructor per day is 3 sessions.
- Room type matching: LAB courses require computer/hardware labs, LEC courses use standard classrooms or lecture halls.

Provide a structured, actionable Conflict Resolution Plan for the Department Head:
1. **Root Cause Analysis** — Why did each conflict happen?
2. **Actionable Step-by-Step Fixes** — Exactly which day, time slot, room, or instructor can be used.
3. **Alternative Workarounds** — If room or instructor capacity is tight, recommend practical adjustments (e.g., swapping with another section, pairing lecture hours, or scheduling on Friday/Saturday).
4. **Immediate Next Step** — 2-3 specific edits to make in the schedule builder.

Provide full, thorough explanations and detailed step-by-step instructions so the Department Head can resolve every clash without guesswork.`;

    const geminiResult = await callGemini(apiKey, prompt, 4096);
    if (!geminiResult) {
      return res.status(502).json({
        success: false,
        message: "AI service was unable to generate recommendations. Check your GEMINI_API_KEY."
      });
    }

    return res.json({
      success: true,
      conflicts_count: conflicts.length,
      ai_recommendations: geminiResult.text,
      model: geminiResult.model,
      disclaimer: "AI-generated resolution plan — verify against department instructor assignments and room policies."
    });

  } catch (err) {
    console.error("aiConflictResolution error:", err);
    res.status(500).json({ success: false, error: "Failed to generate AI conflict resolution" });
  }
};

// Reusable Gemini API helper with automatic fallback across models
const callGemini = async (apiKey, prompt, maxTokens = 4096) => {
  const models = ["gemini-2.5-flash", "gemini-2.5-pro"];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              maxOutputTokens: maxTokens,
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, model };
      } else {
        const err = await res.text();
        console.warn(`Gemini model ${model} error:`, err);
      }
    } catch (e) {
      console.warn(`Failed calling ${model}:`, e.message);
    }
  }
  return null;
};

/**
 * 🔄 EJECTION CHAIN SWAP RELOCATION ALGORITHM
 * 
 * When a conflicted course (Course A) has no 100% empty slot:
 * 1. Iterates through existing non-conflicted placed courses (Candidate Course B).
 * 2. Checks if Course A can take Course B's slot without instructor, room, or section clash.
 * 3. Checks if Course B can be relocated into an alternative slot on the timetable without conflict.
 * 4. If a valid swap pair is found, executes the atomic swap in `day_courses` and updates in-memory `assignments`.
 */
const attemptEjectionChainSwap = async ({
  client,
  scheduleId,
  dayMap,
  slots,
  timslot,
  availableRooms,
  assignments,
  conflictedCourse,
  MAX_INSTRUCTOR_LOAD,
}) => {
  const courseA_dayCourseId = conflictedCourse.id || null;
  const courseA_id = conflictedCourse.course_id;
  const durA = conflictedCourse.durationHours || 2;
  const typeA = conflictedCourse.sessionType || 'LEC';
  const instA = conflictedCourse.instructorId;

  if (!instA) return { success: false };

  const dayEndMin = (timslot?.rows?.[0]?.end_time) ? timeToMinutes(timslot.rows[0].end_time) : timeToMinutes("18:00");

  for (const placedB of assignments) {
    if (placedB.is_conflicted) continue;
    if (placedB.course_id === courseA_id) continue;
    if (!placedB.dayCourseId) continue;

    const dayNameB = placedB.day;
    const dayScheduleIdB = placedB.dayScheduleId;
    const startB = placedB.start;
    const endB = placedB.end;
    const durB = diffHours(startB, endB) || 2;

    // Condition 1: Course A must fit into Course B's duration
    if (durA > durB) continue;

    const endA_in_slotB = addHours(startB, durA);
    if (timeToMinutes(endA_in_slotB) > dayEndMin) continue;
    if (isTimeOverlap(startB, endA_in_slotB, "06:30", "07:30")) continue;

    // Check 1a: Instructor A global conflict at (dayNameB, startB, endA_in_slotB)
    const instAGlobal = await client.query(
      `SELECT 1 FROM day_courses dc
       JOIN day_schedules ds ON dc.day_schedule_id = ds.id
       JOIN schedules s ON ds.schedule_id = s.id
       WHERE dc.instructor_id = $1 AND ds.day_of_week = $2 AND dc.start_time < $3 AND dc.end_time > $4 
         AND s.status = 'published' AND s.id != $5 LIMIT 1`,
      [instA, dayNameB, endA_in_slotB, startB, scheduleId]
    );
    if (instAGlobal.rowCount > 0) continue;

    // Check 1b: Instructor A daily load
    const instALoad = await client.query(
      `SELECT COUNT(*) as count FROM day_courses dc
       JOIN day_schedules ds ON dc.day_schedule_id = ds.id
       JOIN schedules s ON ds.schedule_id = s.id
       WHERE dc.instructor_id = $1 AND ds.day_of_week = $2 AND s.status = 'published' AND s.id != $3`,
      [instA, dayNameB, scheduleId]
    );
    if (parseInt(instALoad.rows[0].count) >= MAX_INSTRUCTOR_LOAD) continue;

    // Check 1c: Suitable Room for Course A in Course B's slot
    let suitableRoomA = null;
    for (const rm of availableRooms) {
      if (typeA === 'LAB' && rm.room_type !== 'lab') continue;
      if (typeA === 'LEC' && rm.room_type === 'lab') continue;

      const rmGlobal = await client.query(
        `SELECT 1 FROM day_courses dc
         JOIN day_schedules ds ON dc.day_schedule_id = ds.id
         JOIN schedules s ON ds.schedule_id = s.id
         WHERE dc.room_id = $1 AND ds.day_of_week = $2 AND dc.start_time < $3 AND dc.end_time > $4 
           AND s.status = 'published' AND s.id != $5 LIMIT 1`,
        [rm.room_id, dayNameB, endA_in_slotB, startB, scheduleId]
      );
      if (rmGlobal.rowCount > 0) continue;

      // Local room collision (excluding Course B)
      const localRoomColl = assignments.some(a =>
        a !== placedB &&
        a.day === dayNameB &&
        isTimeOverlap(a.start, a.end, startB, endA_in_slotB) &&
        a.room === rm.room_id
      );
      if (localRoomColl) continue;

      suitableRoomA = rm;
      break;
    }
    if (!suitableRoomA) continue;

    // Condition 2: Find alternative relocation slot for Course B
    let foundRelocationB = null;

    for (const [dayNameAlt, dayScheduleIdAlt] of Object.entries(dayMap)) {
      if (foundRelocationB) break;

      for (const slotAlt of slots) {
        if (foundRelocationB) break;

        const startAlt = slotAlt.start_time;
        const endAlt = addHours(startAlt, durB);

        if (dayNameAlt === dayNameB && startAlt === startB) continue;
        if (timeToMinutes(endAlt) > dayEndMin) continue;
        if (isTimeOverlap(startAlt, endAlt, "06:30", "07:30")) continue;

        // Section busy (excluding Course B)
        const secBusyAlt = assignments.some(a =>
          a !== placedB &&
          a.dayScheduleId === dayScheduleIdAlt &&
          isTimeOverlap(a.start, a.end, startAlt, endAlt)
        );
        if (secBusyAlt) continue;

        // Course B instructor global conflict
        const instBGlobal = await client.query(
          `SELECT 1 FROM day_courses dc
           JOIN day_schedules ds ON dc.day_schedule_id = ds.id
           JOIN schedules s ON ds.schedule_id = s.id
           WHERE dc.instructor_id = $1 AND ds.day_of_week = $2 AND dc.start_time < $3 AND dc.end_time > $4 
             AND s.status = 'published' AND s.id != $5 LIMIT 1`,
          [placedB.instructor, dayNameAlt, endAlt, startAlt, scheduleId]
        );
        if (instBGlobal.rowCount > 0) continue;

        // Course B instructor daily load
        if (dayNameAlt !== dayNameB) {
          const instBLoad = await client.query(
            `SELECT COUNT(*) as count FROM day_courses dc
             JOIN day_schedules ds ON dc.day_schedule_id = ds.id
             JOIN schedules s ON ds.schedule_id = s.id
             WHERE dc.instructor_id = $1 AND ds.day_of_week = $2 AND s.status = 'published' AND s.id != $3`,
            [placedB.instructor, dayNameAlt, scheduleId]
          );
          if (parseInt(instBLoad.rows[0].count) >= MAX_INSTRUCTOR_LOAD) continue;
        }

        // Room for Course B at alternative slot
        let suitableRoomB = null;
        for (const rm of availableRooms) {
          const bIsLab = (durB >= 3);
          if (bIsLab && rm.room_type !== 'lab') continue;
          if (!bIsLab && rm.room_type === 'lab') continue;

          const rmGlobalAlt = await client.query(
            `SELECT 1 FROM day_courses dc
             JOIN day_schedules ds ON dc.day_schedule_id = ds.id
             JOIN schedules s ON ds.schedule_id = s.id
             WHERE dc.room_id = $1 AND ds.day_of_week = $2 AND dc.start_time < $3 AND dc.end_time > $4 
               AND s.status = 'published' AND s.id != $5 LIMIT 1`,
            [rm.room_id, dayNameAlt, endAlt, startAlt, scheduleId]
          );
          if (rmGlobalAlt.rowCount > 0) continue;

          const localRmCollAlt = assignments.some(a =>
            a !== placedB &&
            a.day === dayNameAlt &&
            isTimeOverlap(a.start, a.end, startAlt, endAlt) &&
            a.room === rm.room_id
          );
          if (localRmCollAlt) continue;

          suitableRoomB = rm;
          break;
        }
        if (!suitableRoomB) continue;

        foundRelocationB = {
          dayName: dayNameAlt,
          dayScheduleId: dayScheduleIdAlt,
          start: startAlt,
          end: endAlt,
          room: suitableRoomB,
        };
      }
    }

    if (foundRelocationB) {
      // Step 3: EXECUTE ATOMIC SWAP
      // Relocate Course B
      await client.query(
        `UPDATE day_courses
         SET day_schedule_id = $1,
             room_id = $2,
             start_time = $3,
             end_time = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [
          foundRelocationB.dayScheduleId,
          foundRelocationB.room.room_id,
          foundRelocationB.start,
          foundRelocationB.end,
          placedB.dayCourseId,
        ]
      );

      // Place Course A into Course B's former slot with clean blue color '#3b82f6'
      let finalCourseADayCourseId = courseA_dayCourseId;
      if (courseA_dayCourseId) {
        await client.query(
          `UPDATE day_courses
           SET day_schedule_id = $1,
               room_id = $2,
               instructor_id = $3,
               start_time = $4,
               end_time = $5,
               color = '#3b82f6',
               updated_at = NOW()
           WHERE id = $6`,
          [
            dayScheduleIdB,
            suitableRoomA.room_id,
            instA,
            startB,
            endA_in_slotB,
            courseA_dayCourseId,
          ]
        );
      } else {
        const insA = await client.query(
          `INSERT INTO day_courses
           (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time, color)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [
            dayScheduleIdB,
            courseA_id,
            suitableRoomA.room_id,
            instA,
            startB,
            endA_in_slotB,
            '#3b82f6',
          ]
        );
        finalCourseADayCourseId = insA.rows[0].id;
      }

      // Update in-memory assignments array
      placedB.day = foundRelocationB.dayName;
      placedB.dayScheduleId = foundRelocationB.dayScheduleId;
      placedB.start = foundRelocationB.start;
      placedB.end = foundRelocationB.end;
      placedB.room = foundRelocationB.room.room_id;

      assignments.push({
        id: finalCourseADayCourseId,
        dayCourseId: finalCourseADayCourseId,
        course_id: courseA_id,
        dayScheduleId: dayScheduleIdB,
        day: dayNameB,
        start: startB,
        end: endA_in_slotB,
        room: suitableRoomA.room_id,
        instructor: instA,
        is_conflicted: false,
      });

      console.log(`[Ejection Swap SUCCESS] Swapped Course A (ID ${courseA_id}) into ${dayNameB} (${startB}-${endA_in_slotB}) and relocated Course B (ID ${placedB.course_id}) to ${foundRelocationB.dayName} (${foundRelocationB.start}-${foundRelocationB.end})`);

      return {
        success: true,
        swappedCourseBId: placedB.course_id,
        courseASlot: { day: dayNameB, start: startB, end: endA_in_slotB },
        courseBSlot: { day: foundRelocationB.dayName, start: foundRelocationB.start, end: foundRelocationB.end },
      };
    }
  }

  return { success: false };
};

// Re-generate / re-schedule conflicted courses (color = '#ef4444') into free slots
const reGenerateConflictedSchedule = async (req, res) => {
  const scheduleId = req.params.id || req.body.schedule_id;
  if (!scheduleId) {
    return res.status(400).json({ error: "Missing scheduleId" });
  }

  const client = await pool.connect();
  const MAX_INSTRUCTOR_LOAD = 3;

  try {
    await client.query("BEGIN");

    // Fetch schedule info
    const schedRes = await client.query(
      `SELECT s.* FROM schedules s WHERE s.id = $1`,
      [scheduleId]
    );

    if (schedRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Schedule not found" });
    }

    const schedule = schedRes.rows[0];
    const department_id = schedule.department_id;
    const batch_id = schedule.batch_id;
    const section = schedule.section;

    // Fetch time slots & department time configuration
    const timslot = await client.query(
      `SELECT * FROM time_slots WHERE department_id = $1 ORDER BY id DESC LIMIT 1`,
      [department_id]
    );
    const slots = (timslot.rowCount > 0 && Array.isArray(timslot.rows[0].slots))
      ? timslot.rows[0].slots
      : generateTimeSlots(timslot);

    // Fetch day schedules map
    const dsRes = await client.query(
      `SELECT id, day_of_week FROM day_schedules WHERE schedule_id = $1`,
      [scheduleId]
    );
    const dayMap = {};
    for (const r of dsRes.rows) {
      dayMap[r.day_of_week] = r.id;
    }

    // Fetch available rooms strictly from section_rooms
    const roomsRes = await client.query(
      `SELECT r.room_id, r.room_type, r.room_number, b.block_code,
              CONCAT(b.block_code, ' - Room ', r.room_number) as location
       FROM section_rooms sr
       JOIN rooms r ON sr.room_id = r.room_id
       LEFT JOIN floors f ON r.floor_id = f.floor_id
       LEFT JOIN blocks b ON f.block_id = b.block_id
       WHERE sr.department_id = $1
         AND sr.batch_id = $2
         AND LOWER(TRIM(sr.section)) = LOWER(TRIM($3))
         AND r.is_available = true`,
      [department_id, batch_id, section]
    );
    const availableRooms = roomsRes.rows;

    // Fetch existing non-conflicted courses in this schedule
    const existingCourses = await client.query(
      `SELECT dc.*, ds.day_of_week
       FROM day_courses dc
       JOIN day_schedules ds ON dc.day_schedule_id = ds.id
       WHERE ds.schedule_id = $1 AND dc.color != '#ef4444'`,
      [scheduleId]
    );

    const assignments = existingCourses.rows.map(c => ({
      id: c.id,
      dayCourseId: c.id,
      course_id: c.course_id,
      dayScheduleId: c.day_schedule_id,
      day: c.day_of_week,
      start: c.start_time,
      end: c.end_time,
      room: c.room_id,
      instructor: c.instructor_id,
      is_conflicted: false
    }));

    // Fetch conflicted day_courses (color = '#ef4444')
    const conflictedCourses = await client.query(
      `SELECT dc.*, c.course_code, c.course_name, c.lec_hr, c.lab_hr
       FROM day_courses dc
       JOIN day_schedules ds ON dc.day_schedule_id = ds.id
       JOIN course c ON dc.course_id = c.course_id
       WHERE ds.schedule_id = $1 AND dc.color = '#ef4444'`,
      [scheduleId]
    );

    if (conflictedCourses.rowCount === 0) {
      await client.query("COMMIT");
      return res.json({
        success: true,
        message: "No conflicted courses found in this schedule",
        resolved_count: 0,
        remaining_conflicts: 0
      });
    }

    let resolvedCount = 0;
    const remainingConflicts = [];

    for (const cCourse of conflictedCourses.rows) {
      const durationHours = diffHours(cCourse.start_time, cCourse.end_time) || 2;
      const isLab = (cCourse.lab_hr > 0 && durationHours >= 3);
      const sessionType = isLab ? 'LAB' : 'LEC';

      // 1. Check if section-specific instructor is now assigned
      const instRes = await client.query(
        `SELECT i.instructor_id, u.full_name
         FROM course_section_instructor_assign i
         JOIN course_batch cb ON i.course_batch_id = cb.id
         JOIN users u ON i.instructor_id = u.id
         WHERE cb.course_id = $1
           AND cb.department_id = $2
           AND cb.batch = $3
           AND LOWER(TRIM(i.section)) = LOWER(TRIM($4))`,
        [cCourse.course_id, department_id, batch_id, section]
      );

      const instructorId = instRes.rowCount > 0 ? instRes.rows[0].instructor_id : null;
      const instructorName = instRes.rowCount > 0 ? instRes.rows[0].full_name : null;

      const hasClassroom = availableRooms.some(r => r.room_type === 'classroom');
      const hasLab = availableRooms.some(r => r.room_type === 'lab');
      const hasRoom = isLab ? hasLab : hasClassroom;

      if (!instructorId || !hasRoom) {
        const reasons = [];
        if (!instructorId) reasons.push(`No instructor assigned to Section ${section} for ${cCourse.course_code || cCourse.course_name}`);
        if (!hasRoom) reasons.push(`No ${isLab ? 'lab' : 'classroom'} assigned to Section ${section} in section_rooms`);
        remainingConflicts.push({
          course_id: cCourse.course_id,
          course_code: cCourse.course_code,
          course_name: cCourse.course_name,
          session_type: sessionType,
          reason: reasons.join("; ")
        });
        continue;
      }

      // Search for open free slot on this schedule
      let placedInFreeSlot = false;
      for (const [dayName, dayScheduleId] of Object.entries(dayMap)) {
        if (placedInFreeSlot) break;
        for (const slot of slots) {
          if (placedInFreeSlot) break;

          const sessionStartTime = slot.start_time;
          const sessionEndTime = addHours(sessionStartTime, durationHours);

          const dayEndMin = (timslot?.rows?.[0]?.end_time) ? timeToMinutes(timslot.rows[0].end_time) : timeToMinutes("18:00");
          if (timeToMinutes(sessionEndTime) > dayEndMin) continue;
          if (isTimeOverlap(sessionStartTime, sessionEndTime, "06:30", "07:30")) continue;

          // Check section busy
          const sectionBusy = assignments.some(a =>
            a.dayScheduleId === dayScheduleId &&
            isTimeOverlap(a.start, a.end, sessionStartTime, sessionEndTime)
          );
          if (sectionBusy) continue;

          for (const room of availableRooms) {
            if (sessionType === 'LAB' && room.room_type !== 'lab') continue;
            if (sessionType === 'LEC' && room.room_type === 'lab') continue;

            // Check instructor load
            const loadRes = await client.query(
              `SELECT COUNT(*) as count FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id = ds.id
               JOIN schedules s ON ds.schedule_id = s.id
               WHERE dc.instructor_id = $1 AND ds.day_of_week = $2 AND s.status = 'published' AND s.id != $3`,
              [instructorId, dayName, scheduleId]
            );
            if (parseInt(loadRes.rows[0].count) >= MAX_INSTRUCTOR_LOAD) continue;

            // Global instructor check
            const globalConflict = await client.query(
              `SELECT 1 FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id = ds.id
               JOIN schedules s ON ds.schedule_id = s.id
               WHERE dc.instructor_id = $1 AND ds.day_of_week = $2 AND dc.start_time < $3 AND dc.end_time > $4 AND s.status = 'published' AND s.id != $5 LIMIT 1`,
              [instructorId, dayName, sessionEndTime, sessionStartTime, scheduleId]
            );
            if (globalConflict.rowCount > 0) continue;

            // Global room check
            const roomGlobalConflict = await client.query(
              `SELECT 1 FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id = ds.id
               JOIN schedules s ON ds.schedule_id = s.id
               WHERE dc.room_id = $1 AND ds.day_of_week = $2 AND dc.start_time < $3 AND dc.end_time > $4 AND s.status = 'published' AND s.id != $5 LIMIT 1`,
              [room.room_id, dayName, sessionEndTime, sessionStartTime, scheduleId]
            );
            if (roomGlobalConflict.rowCount > 0) continue;

            // Local collision
            const localConflict = assignments.find(a =>
              a.day === dayName &&
              isTimeOverlap(a.start, a.end, sessionStartTime, sessionEndTime) &&
              (a.room === room.room_id || a.instructor === instructorId || a.dayScheduleId === dayScheduleId)
            );
            if (localConflict) continue;

            // FREE SLOT FOUND! UPDATE the conflicted course row to clean BLUE #3b82f6!
            await client.query(
              `UPDATE day_courses
               SET day_schedule_id = $1,
                   room_id = $2,
                   instructor_id = $3,
                   start_time = $4,
                   end_time = $5,
                   color = '#3b82f6',
                   updated_at = NOW()
               WHERE id = $6`,
              [dayScheduleId, room.room_id, instructorId, sessionStartTime, sessionEndTime, cCourse.id]
            );

            assignments.push({
              dayScheduleId,
              day: dayName,
              start: sessionStartTime,
              end: sessionEndTime,
              room: room.room_id,
              instructor: instructorId,
              is_conflicted: false
            });

            placedInFreeSlot = true;
            resolvedCount++;
            break;
          }
        }
      }

      if (!placedInFreeSlot) {
        // 🔄 Attempt Ejection Chain Swap Relocation!
        const swapRes = await attemptEjectionChainSwap({
          client,
          scheduleId,
          dayMap,
          slots,
          timslot,
          availableRooms,
          assignments,
          conflictedCourse: {
            id: cCourse.id,
            course_id: cCourse.course_id,
            course_code: cCourse.course_code,
            course_name: cCourse.course_name,
            durationHours,
            sessionType,
            instructorId,
          },
          MAX_INSTRUCTOR_LOAD,
        });

        if (swapRes.success) {
          placedInFreeSlot = true;
          resolvedCount++;
        }
      }

      if (!placedInFreeSlot) {
        remainingConflicts.push({
          course_id: cCourse.course_id,
          course_code: cCourse.course_code,
          course_name: cCourse.course_name,
          session_type: sessionType,
          reason: "No free time slots available and no valid swap relocation found across timetable days"
        });
      }
    }

    // If all conflicts are resolved, update schedule status to published!
    if (remainingConflicts.length === 0) {
      await client.query(
        `UPDATE schedules SET status = 'published', updated_at = NOW() WHERE id = $1`,
        [scheduleId]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      schedule_id: scheduleId,
      resolved_count: resolvedCount,
      remaining_conflicts_count: remainingConflicts.length,
      remaining_conflicts: remainingConflicts,
      message: remainingConflicts.length === 0
        ? `All ${resolvedCount} conflicted course(s) successfully re-scheduled into free slots! Status updated to 'published'.`
        : `Re-scheduled ${resolvedCount} course(s) into free slots. ${remainingConflicts.length} conflict(s) still remain.`
    });

  } catch (err) {
    console.error("reGenerateConflictedSchedule error:", err);
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message || "Failed to re-generate conflicted schedule" });
  } finally {
    client.release();
  }
};

module.exports = {
  getInstructorSchedule,
  getInstructorInfo,
  getMySchedule,
  getTodaySchedule,
  getAllInstructors,
  getAvailableRooms,
  getRoomHierarchy,
  create,
  getAll,
  Delete,
  permission,
  Batch,
  update,
  autoGenerateSchedule,
  reGenerateConflictedSchedule,
  aiScheduleSuggestion,   // 🤖 optional AI feature
  aiConflictResolution,   // 🤖 AI Conflict Resolution feature
};