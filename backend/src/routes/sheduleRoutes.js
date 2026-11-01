// src/routes/sheduleRoutes.js
const express = require("express");
const router = express.Router();
const { sessionAuth } = require('../middleware/sessionAuth');
const {
  getInstructorSchedule,
  getInstructorInfo,
  getMySchedule,
  getTodaySchedule,
  getAllInstructors,
  create,
  getAll,
  Delete,
  permission,
  Batch,
  update,
  getAvailableRooms,
  getRoomHierarchy,
  autoGenerateSchedule,
  reGenerateConflictedSchedule,
  aiScheduleSuggestion,   // 🤖 optional AI feature
  aiConflictResolution,   // 🤖 AI conflict resolution
} = require("../controllers/scheduleController");

// Schedule CRUD routes
router.post("/", create);
router.get("/", getAll);
router.delete("/:id", Delete);
router.patch("/:id", permission);
router.put("/:id", update);
router.get("/batch", Batch);

// Room management routes
router.get("/rooms/available", getAvailableRooms);
router.get("/rooms/hierarchy", getRoomHierarchy);
router.post("/autogenerate", autoGenerateSchedule);
router.post("/regenerate-conflicts", reGenerateConflictedSchedule);
router.post("/:id/regenerate-conflicts", reGenerateConflictedSchedule);

// Today's schedule routes
router.get("/today", getTodaySchedule);
router.get("/today/:day", getTodaySchedule);

// Instructor routes
router.get("/instructors", getAllInstructors);
router.get("/instructors/:id", getInstructorInfo);
router.get("/instructors/:id/schedule", getInstructorSchedule);

// Protected routes — require instructor session
router.get("/me/schedule", sessionAuth, getMySchedule);
router.get("/me/today", sessionAuth, getTodaySchedule);

// 🤖 AI Schedule Suggestion (optional — requires GEMINI_API_KEY in .env)
// GET /api/schedules/:id/ai-suggest
router.get("/:id/ai-suggest", aiScheduleSuggestion);
// POST /api/schedules/ai-resolve-conflicts
router.post("/ai-resolve-conflicts", aiConflictResolution);

module.exports = router;