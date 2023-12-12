const { validationResult, matchedData } = require("express-validator");
const User = require("../models/User");
const Config = require("../models/Config");
const bcrypt = require("bcryptjs");
const secret = "test";
const logger = require("../config/logger.js");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/imageDB.js").v2;
const multer = require("multer");

const testUserAPI = async (req, res) => {
  return res.status(200).send("User API test successfull");
};

const CreateUser = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  //if error return
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/add  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }
  const data = matchedData(req);
  if (data.role_type === "6552fc218c59438ef6c17cd8") {
    logger.error(`${ip}: API /api/v1/user/add  responnded with Error "Only admin can create admin" `);
    return res.status(403).json({ mesasge: "Only admin can create admin" });
  }

  const oldUser = await User.findOne({ email: data.email });

  if (oldUser) {
    logger.error(`${ip}: API /api/v1/user/add  responnded with User already registered! for email: ${data.email} `);
    return res.status(400).json({ message: "User already registered!" });
  }

  const salt = await bcrypt.genSalt(10);
  const securedPass = await bcrypt.hash(data.password, salt);

  await User.create({
    profile: "",
    name: data.name,
    email: data.email,
    mobile_no: data.mobile_no,
    password: securedPass,
    department: data.department,
    role_type: data.role_type,
    whatsapp_status: data.whatsapp_status,
    whatsapp_no: data.whatsapp_no,
    instagram: data.instagram,
    facebook: data.facebook,
  })
    .then((user) => {
      logger.info(`${ip}: API /api/v1/user/add  responnded with Success `);
      return res.status(201).json({ result: user });
    })
    .catch((err) => {
      logger.error(`${ip}: API /api/v1/user/add  responnded with Error `);
      return res.status(500).json({ message: err.message });
    });
};

//@desc LogIn User API
//@route GET /api/v1/user/Login
//@access Public
const LogInUser = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  //if error return
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email;
  const password = req.body.password;

  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      logger.error(`${ip}: API /api/v1/user/login  responded User does not 
      exist with email:  ${email} `);
      return res.status(404).json({ error: "User Does Not Exist" });
    }

    if (!oldUser.approved) {
      logger.error(`${ip}: API /api/v1/user/login  responded User approval is pending for email:  ${email} `);
      return res.status(400).json({ error: "User approval is still pending" });
    }

    const isPassCorrect = await bcrypt.compare(password, oldUser.password);

    if (!isPassCorrect) {
      logger.error(`${ip}: API /api/v1/user/login  responded password incorrect `);
      return res.status(400).json({ error: "invalid password " });
    }
    const token = jwt.sign({ user: oldUser }, secret, { expiresIn: "48h" });

    logger.info(`${ip}: API /api/v1/login | Login Successfull" `);
    return res.status(200).json({ result: oldUser, token });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(500).json(e, " Something went wrong");
  }
};

//@desc Update User API
//@route GET /api/v1/user/update
//@access Public
const UpdateUser = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  const id = req.params.id;
  const data = matchedData(req);
  console.log(data.email);
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        name: data.name,
        mobile_no: data.mobile_no,
        whatsapp_no: data.whatsapp_no,
        instagram: data.instagram,
        facebook: data.facebook,
        email: data.email,
        department: data.department,
        role_type: data.role_type,
        whatsapp_status: data.whatsapp_status,
      }
    );
    logger.info(`${ip}: API /api/v1/update | responnded with "User updated successfully" `);
    return res.status(201).json({ result: user });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/update  responnded with Error "while updating user" `);
    return res.status(500).json(e, " Something went wrong while updating data");
  }
};

//@desc Delete User API
//@route GET /api/v1/user/delete
//@access Public
const DeleteUser = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  try {
    if (req.user) {
      await User.findOneAndUpdate({ _id: req.params.id }, { active: false });
      logger.info(`${ip}: API /api/v1/user/delete | responnded with "User deleted successfully" `);
      return res.status(201).json("User deleted successfully");
    } else {
      logger.error(`${ip}: API /api/v1/user/delete  responnded with unauthorized user `);
      return res.status(500).json({ message: "Unauthorized user" });
    }
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/delete  responnded with Error for deleteing user `);
    return res.status(500).json({ e: "Somthing went wrong" });
  }
};

//@desc Get User by ID API
//@route GET /api/v1/user/get/:id
//@access Public
const GetUserById = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  const userId = req.params.id;
  if (!userId) {
    logger.error(`${ip}: API /api/v1/user/get/:id  responnded UserId required `);
    return res.status(400).json("UserId  requierd");
  }

  try {
    const user = await User.findById({ _id: userId })
      .populate({ path: "department", select: ["name", "value", "active"] })
      .populate({ path: "role_type" });

    logger.info(`${ip}: API /api/v1/user/get/:id | responnded with "Got user by ID succesfully" `);
    return res.status(201).json(user);
  } catch {
    logger.error(`${ip}: API /api/v1/user/get/:id  responnded with user not found `);
    return res.status(500).json({ e: "User not found" });
  }
};

//@desc Get Users API
//@route GET /api/v1/user/getallusers
//@access Public
const GetUsers = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    const allUsers = await User.find().populate({ path: "department" }).populate({ path: "role_type" });
    logger.info(`${ip}: API /api/v1/user/getallusers | responnded with "Fetchd all the users" `);
    return res.status(200).json(allUsers);
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/getallusers  responnded with Error  " somethung went wrong" `);
    return res.status(500).json({ e: "Something went wrong" });
  }
};

//@desc Get Current User API
//@route GET /api/v1/user/getcurrentuser
//@access Public
const GetCurrentUser = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  try {
    if (!req.user) {
      logger.error(`${ip}: API /api/v1/user/getcurrentuser  responnded with Error , "Unautherized user " `);
      return res.status(500).json({ message: "Unauthorized user" });
    }

    logger.info(`${ip}: API /api/v1/getcurrentuser | responnded with "Successfully retreived current user" `);
    return res.status(200).json({ data: req.user, message: "User Retrived" });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/getcurrentuser  responnded with Error, " somthing went wrong"`);
    return res.status(500).json({ message: "Something went wrong current user not found" });
  }
};

//@desc Update Profile API
//@route GET /api/v1/user/updateprofile/:id
//@access Public
const UpdateProfile = async (req, res) => {
  const errors = validationResult(req); // checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; // what's remote address?

  const id = req.params.id;
  const data = matchedData(req);

  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/updateprofile responded with Error`);
    return res.status(400).json({ errors: errors.array() });
  }
  // console.log(data.newProfile);
  try {
    const result = await cloudinary.uploader.upload(data.newProfile, {
      folder: "profiles",
    });
    console.log(result.secure_url);
    const user = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        profile: result.secure_url,
      }
    );
    logger.info(`${ip}: API /api/v1/update | responded with "Profile updated successfully"`);

    return res.status(201).json({ result: user });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/update  responded with Error "while updating profile"`);
    return res.status(500).json({ error: "Something went wrong while updating profile" });
  }
};

//@desc Approve User API
//@route GET /api/v1/user/approveuser/:id
//@access Public
const ApproveUser = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  const id = req.params.id;
  const data = matchedData(req);
  console.log(data.newProfile);

  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/updateprofile responded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        approved: true,
      }
    );
    logger.info(`${ip}: API /api/v1/user/approveuser/:id | responded with "New user approved" `);

    return res.status(201).json({ result: user });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/approveuser/:id  responnded with Error "while approving new user" `);
    return res.status(500).json(e, " Something went wrong while updating profile");
  }
};

//@desc UnApprove User API
//@route GET /api/v1/user/unapproveuser/:id
//@access Public
const UnApproveUser = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  const id = req.params.id;
  const data = matchedData(req);
  console.log(data.newProfile);

  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/updateprofile responded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        approved: false,
      }
    );
    logger.info(`${ip}: API /api/v1/user/approveuser/:id | responded with "New user approved" `);

    return res.status(201).json({ result: user });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/approveuser/:id  responnded with Error "while approving new user" `);
    return res.status(500).json(e, " Something went wrong while updating profile");
  }
};

//@desc Get New Users API
//@route GET /api/v1/user/getnewusers
//@access Public
const GetNewUsers = async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    const allUsers = await User.find({ approved: false }).populate({ path: "department" }).populate({ path: "role_type" });
    logger.info(`${ip}: API /api/v1/user/getallusers | responnded with "Fetchd all the users" `);
    return res.status(200).json(allUsers);
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/getallusers  responnded with Error  " somethung went wrong" `);
    return res.status(500).json({ e: "Something went wrong" });
  }
};

//@desc Create Admin API
//@route POST /api/v1/user/createadmin
//@access Public
const CreateAdmin = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  //if error return
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/add  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }
  const data = matchedData(req);

  const checkAdmin = await User.findById({ _id: req.params.id }).populate({ path: "role_type" });
  if (!checkAdmin) {
    logger.error(`${ip}: API /api/v1/user/add  responnded with Error "Invalid admin ID" `);
    return res.status(404).json({ mesasge: "Invalid admin ID" });
  }
  if (checkAdmin.role_type.value !== "admin") {
    logger.error(`${ip}: API /api/v1/user/add  responnded with Error "Only admin can create admin" `);
    return res.status(403).json({ mesasge: "Only admin can create admin" });
  }
  console.log(checkAdmin);

  const oldUser = await User.findOne({ email: data.email });

  if (oldUser) {
    logger.error(`${ip}: API /api/v1/user/add  responnded with User already registered! for email: ${data.email} `);
    return res.status(400).json({ message: "User already registered!" });
  }

  const salt = await bcrypt.genSalt(10);
  const securedPass = await bcrypt.hash(data.password, salt);

  await User.create({
    profile: "",
    name: data.name,
    email: data.email,
    mobile_no: data.mobile_no,
    password: securedPass,
    department: data.department,
    role_type: data.role_type,
    whatsapp_status: data.whatsapp_status,
    whatsapp_no: data.whatsapp_no,
    instagram: data.instagram,
    facebook: data.facebook,
    approved: true,
  })
    .then((user) => {
      logger.info(`${ip}: API /api/v1/user/add  responnded with Success `);
      return res.status(201).json({ result: user });
    })
    .catch((err) => {
      logger.error(`${ip}: API /api/v1/user/add  responnded with Error `);
      return res.status(500).json({ message: err.message });
    });
};

//@desc Google LogIn API
//@route POST /api/v1/user/googlelogin
//@access Public
const GoogleLogIn = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  //if error return
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email;
  console.log(email);

  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      logger.error(`${ip}: API /api/v1/user/login  responded User does not 
      exist with email:  ${email} `);
      return res.status(404).json({ error: "User Does Not Exist" });
    }

    if (!oldUser.approved) {
      logger.error(`${ip}: API /api/v1/user/login  responded User approval is pending for email:  ${email} `);
      return res.status(400).json({ error: "User approval is still pending" });
    }

    const token = jwt.sign({ user: oldUser }, secret, { expiresIn: "48h" });

    logger.info(`${ip}: API /api/v1/login | Login Successfull" `);
    return res.status(200).json({ result: oldUser, token });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(500).json(e, " Something went wrong");
  }
};

//@desc Varify Email API
//@route POST /api/v1/user/varifyemail
//@access Public
const VarifyEmail = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  //if error return
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email;
  console.log(email);

  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      logger.error(`${ip}: API /api/v1/user/login  responded ' Email does not 
      exist :  ${email}' `);
      return res.status(404).json({ error: "User Does Not Exist" });
    }

    logger.info(`${ip}: API /api/v1/login | Login Successfull" `);
    return res.status(200).json({ result: oldUser.email });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(500).json(e, " Something went wrong");
  }
};

//@desc Reset Password API
//@route GET /api/v1/user/resetpassword
//@access Public
const ResetPasword = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  const data = matchedData(req);
  //console.log(data.email);
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const securedPass = await bcrypt.hash(data.password, salt);
    const user = await User.findOneAndUpdate(
      {
        email: data.email,
      },
      {
        password: securedPass,
      }
    );
    logger.info(`${ip}: API /api/v1/update | responnded with "User updated successfully" `);
    return res.status(201).json({ result: user });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/update  responnded with Error "while updating user" `);
    return res.status(500).json(e, " Something went wrong while updating data");
  }
};

//@desc Admin User Update API
//@route GET /api/v1/user/adminuserupdate
//@access Public
const AdminUserUpdate = async (req, res) => {
  const errors = validationResult(req); //checking for validations
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress; //wats remote address?

  const id = req.params.id;
  const data = matchedData(req);
  console.log(data.email);
  if (!errors.isEmpty()) {
    logger.error(`${ip}: API /api/v1/user/login  responnded with Error `);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        name: data.name,
        mobile_no: data.mobile_no,
        whatsapp_no: data.whatsapp_no,
        instagram: data.instagram,
        facebook: data.facebook,
        email: data.email,
        department: data.department,
        role_type: data.role_type,
        whatsapp_status: data.whatsapp_status,
      }
    );
    logger.info(`${ip}: API /api/v1/update | responnded with "User updated successfully" `);
    return res.status(201).json({ result: user });
  } catch (e) {
    logger.error(`${ip}: API /api/v1/user/update  responnded with Error "while updating user" `);
    return res.status(500).json(e, " Something went wrong while updating data");
  }
};

module.exports = {
  testUserAPI,
  CreateUser,
  LogInUser,
  UpdateUser,
  DeleteUser,
  GetUserById,
  GetUsers,
  GetCurrentUser,
  UpdateProfile,
  ApproveUser,
  UnApproveUser,
  GetNewUsers,
  CreateAdmin,
  GoogleLogIn,
  VarifyEmail,
  ResetPasword,
  AdminUserUpdate,
};
