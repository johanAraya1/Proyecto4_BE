"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
// User authentication routes - registration and login endpoints
const router = (0, express_1.Router)();
router.post('/register', authController_1.register); // POST /auth/register
router.post('/login', authController_1.login); // POST /auth/login
exports.default = router;
