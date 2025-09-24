"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const authService_1 = require("../services/authService");
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = await (0, authService_1.registerUser)(email, password, name);
        res.status(201).json({ user });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await (0, authService_1.loginUser)(email, password);
        res.status(200).json({ token });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
};
exports.login = login;
