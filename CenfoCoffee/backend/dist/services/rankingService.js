"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTop10Players = getTop10Players;
const supabaseClient_1 = require("../utils/supabaseClient");
async function getTop10Players() {
    const { data, error } = await supabaseClient_1.supabase.rpc("get_top10_players");
    if (error)
        throw error;
    return data;
}
