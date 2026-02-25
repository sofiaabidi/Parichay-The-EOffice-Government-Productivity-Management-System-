const fieldEmployeeAttendanceService = require('../services/fieldEmployeeAttendanceService');

const checkIn = async (req, res, next) => {
  console.log('[CONTROLLER] Field Employee Check-In request received');
  console.log('[CONTROLLER] User:', req.user.id, req.user.email);
  console.log('[CONTROLLER] Request body:', req.body);
  
  try {
    const record = await fieldEmployeeAttendanceService.checkIn(req.user.id, req.body.date);
    console.log('[CONTROLLER] Check-in successful, sending response');
    res.status(201).json(record);
  } catch (error) {
    console.error('[CONTROLLER] Check-in error:', error.message);
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  console.log('[CONTROLLER] Field Employee Check-Out request received');
  console.log('[CONTROLLER] User:', req.user.id, req.user.email);
  console.log('[CONTROLLER] Request body:', req.body);
  
  try {
    const record = await fieldEmployeeAttendanceService.checkOut(req.user.id, req.body.date);
    console.log('[CONTROLLER] Check-out successful, sending response');
    res.json(record);
  } catch (error) {
    console.error('[CONTROLLER] Check-out error:', error.message);
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const records = await fieldEmployeeAttendanceService.getMyAttendance(req.user.id, req.query.month, req.query.year);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

const getTodayAttendance = async (req, res, next) => {
  try {
    const record = await fieldEmployeeAttendanceService.getTodayAttendance(req.user.id);
    res.json(record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
};

