const express = require("express");
const router = express.Router();
const {
  getInstructorCourses,
  getCourseEvaluations,
  saveEvaluations,
  getEvaluationSummary,
  publishResults,
  getStudentResults,
  exportEvaluations,
  getDepartmentEvaluationSections,
  updateDepartmentEvaluationStatus,
} = require("../controllers/evaluationController");

// Authentication middleware wrapper (supports both session and user query for flexibility)
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

router.use(optionalAuth);

// 1. Get instructor assigned courses/sections
router.get("/instructor/courses", getInstructorCourses);

// 2. Get students and their evaluations for a course and section
router.get("/course-students", getCourseEvaluations);

// 3. Batch save/update student evaluations
router.post("/save", saveEvaluations);

// 4. Get class analytics summary
router.get("/summary", getEvaluationSummary);

// 5. Instructor: Publish/share results for a course section (sends email to students)
router.post("/publish", publishResults);

// 6. Student: View their own published results
router.get("/student/results", getStudentResults);

// 7. Export evaluations as Excel-ready JSON data
router.get("/export", exportEvaluations);

// 8. Department Head: Get all assigned course sections with evaluation statuses
router.get("/department/sections", getDepartmentEvaluationSections);

// 9. Department Head: Approve, lock, or unlock (revert to draft) course section evaluations
router.put("/department/status", updateDepartmentEvaluationStatus);

module.exports = router;
