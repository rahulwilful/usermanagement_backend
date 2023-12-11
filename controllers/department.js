const logger = require("../config/logger.js");
const { validationResult, matchedData } = require("express-validator");
const Department = require("../models/Department");

const testDepartmentAPI = async (req, res) => {
  return res.status(200).send("Department API test successfull");
};

//@desc Get All Departments API
//@route GET /api/v1/department/getall
//@access Public
const GetAllDepts = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    const allDepts = await Department.find({ active: true });
    /* console.log(allDepts); */
    logger.info(`${ip}: API /api/v1/department/getalldepts | responnded with "Fetched all the departments" `);
    return res.status(200).json({ result: allDepts });
  } catch (err) {
    logger.error(`${ip}: API /api/v1/department/getalldepts  responnded with Error  " somethung went wrong" `);
    return res.status(500).json({ error: err, message: "Something went wrong" });
  }
};

//@desc Get Department By Name API
//@route GET /api/v1/department/getdeptbyname
//@access Public
const GetDeptByName = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/department/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }
  const data = matchedData(req);

  try {
    const deptName = await Department.findOne({ name: data.name });
    /* console.log(allDepts); */
    logger.info(`${ip}: API /api/v1/department/getalldepts | responnded with "Fetched all the departments" `);
    return res.status(200).json({ result: deptName });
  } catch (err) {
    logger.error(`${ip}: API /api/v1/department/getalldepts responnded with Error  " somethung went wrong" `);
    return res.status(500).json({ error: err, message: "Something went wrong" });
  }
};

module.exports = {
  testDepartmentAPI,
  GetAllDepts,
  GetDeptByName,
};
