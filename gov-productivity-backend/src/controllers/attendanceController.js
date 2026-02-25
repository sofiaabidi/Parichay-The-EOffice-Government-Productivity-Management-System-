const attendanceService = require('../services/attendanceService');

const checkIn = async (req, res, next) => {
  try {
    const record = await attendanceService.checkIn(req.user.id, req.body.date);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const record = await attendanceService.checkOut(req.user.id, req.body.date);
    res.json(record);
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const records = await attendanceService.getAttendance(req.user.id, req.query.month, req.query.year);
    res.json(records);
  } catch (error) {
    next(error);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await attendanceService.updateAttendanceRecord(
      Number(req.params.id),
      req.body,
      req.user,
    );
    res.json(record);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  updateRecord,
};

