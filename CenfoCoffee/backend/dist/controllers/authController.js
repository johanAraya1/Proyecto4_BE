"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const authService_1 = require("../services/authService");
const telemetryService_1 = require("../services/telemetryService");
// HTTP handler for POST /auth/register - creates new user account
const register = async (req, res) => {
    try {
        console.log('🔵 Register request received:', req.body);
        // Aceptar tanto 'name' como 'username' para compatibilidad con el frontend
        const { email, password, name, username } = req.body;
        const finalName = name || username;
        // Validación de campos requeridos
        if (!email || !password || !finalName) {
            console.log('❌ Missing required fields:', {
                email: !!email,
                password: !!password,
                name: !!name,
                username: !!username,
                finalName: !!finalName
            });
            res.status(400).json({
                error: 'Faltan campos requeridos',
                required: ['email', 'password', 'name o username'],
                received: {
                    email: !!email,
                    password: !!password,
                    name: !!name,
                    username: !!username
                }
            });
            return;
        }
        const user = await (0, authService_1.registerUser)(email, password, finalName);
        // Registrar evento de registro exitoso
        telemetryService_1.telemetryService.incrementEvent('user_register_success');
        console.log('✅ User registered successfully:', user.id);
        res.status(201).json({ user });
    }
    catch (error) {
        console.error('❌ Register error:', error.message);
        // Registrar evento de registro fallido
        telemetryService_1.telemetryService.incrementEvent('user_register_failed');
        res.status(400).json({ error: error.message });
    }
};
exports.register = register;
// HTTP handler for POST /auth/login - authenticates user and returns session data
const login = async (req, res) => {
    try {
        console.log('🔵 Login request received:', { email: req.body.email, hasPassword: !!req.body.password });
        const { email, password } = req.body;
        // Validación de campos requeridos
        if (!email || !password) {
            console.log('❌ Missing required fields:', { email: !!email, password: !!password });
            res.status(400).json({
                error: 'Faltan campos requeridos',
                required: ['email', 'password'],
                received: { email: !!email, password: !!password }
            });
            return;
        }
        const { token, user } = await (0, authService_1.loginUser)(email, password);
        // Registrar evento de login exitoso
        telemetryService_1.telemetryService.incrementEvent('user_login_success');
        console.log('✅ User logged in successfully:', user.id);
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
        console.error('❌ Login error:', error.message);
        // Registrar evento de login fallido
        telemetryService_1.telemetryService.incrementEvent('user_login_failed');
        res.status(401).json({ error: error.message });
    }
};
exports.login = login;
