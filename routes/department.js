const express = require("express");
const deptRouter = express.Router();
const { body } = require("express-validator");
const { testDepartmentAPI, GetAllDepts, GetDeptByName } = require("../controllers/department");
const ValidateToken = require("../middleWare/validateToken");

//@desc Test Department API
//@route GET /api/v1/department
//@access Public
deptRouter.get("/", testDepartmentAPI);

//@desc Get All Departments API
//@route GET /api/v1/department/getall
//@access Public
deptRouter.get("/getalldepts", GetAllDepts);

//@desc Get Department By Name API
//@route GET /api/v1/department/getbyname
//@access Public
deptRouter.get("/getdeptsbyname", [body("name", "Enter Valid Name").notEmpty()], GetDeptByName);

module.exports = deptRouter;
