"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const authService_1 = require("../services/authService");
const telemetryService_1 = require("../services/telemetryService");
// HTTP handler for POST /auth/register - creates new user account
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = await (0, authService_1.registerUser)(email, password, name);
        // Registrar evento de registro exitoso
        telemetryService_1.telemetryService.incrementEvent('user_register_success');
        res.status(201).json({ user });
    }
    catch (error) {
        // Registrar evento de registro fallido
        telemetryService_1.telemetryService.incrementEvent('user_register_failed');
        res.status(400).json({ error: error.message });
    }
};
exports.register = register;
// HTTP handler for POST /auth/login - authenticates user and returns session data
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await (0, authService_1.loginUser)(email, password);
        // Registrar evento de login exitoso
        telemetryService_1.telemetryService.incrementEvent('user_login_success');
        res.status(200).json({
            token,
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            elo: user.elo
        });
    }
    catch (error) {
        // Registrar evento de login fallido
        telemetryService_1.telemetryService.incrementEvent('user_login_failed');
        res.status(401).json({ error: error.message });
    }
};
exports.login = login;
