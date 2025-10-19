"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const supabaseClient_1 = require("../utils/supabaseClient");
const registerUser = async (email, password, name, role = 'player', elo = 1000 // default elo for players
) => {
    const user = { email, password, name, role, elo: role === 'player' ? elo : undefined };
    const { data, error } = await supabaseClient_1.supabase.from('users').insert([user]).select();
    if (error)
        throw new Error(error.message);
    return data[0];
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const { data, error } = await supabaseClient_1.supabase.from('users').select('*').eq('email', email).eq('password', password);
    if (error || !data || data.length === 0)
        throw new Error('Invalid credentials');
    const user = data[0];
    const { password: _, ...userWithoutPassword } = user;
    // Return both token and user info (excluding password)
    return {
        token: 'mock-token',
        user: userWithoutPassword
    };
};
exports.loginUser = loginUser;
