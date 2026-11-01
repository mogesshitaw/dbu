// routes/batches.js
const express = require('express');
const router = express.Router();
const {
  getAllBatches, 
  getBatchById, 
  createBatch, 
  updateBatch, 
  deleteBatch, 
  getAdmissionYears
} = require('../controllers/batchController');

router.get('/admission-years', getAdmissionYears);
router.get('/', getAllBatches);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

module.exports = router;
