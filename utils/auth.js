import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10);

export function hashPassword(password) {
    return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

export function generateToken(payload, isAccess) {
    if (isAccess) {
        return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    }
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function getTokenExpiry(isAccess) {
    if (isAccess) {
        return string_to_sec(ACCESS_TOKEN_EXPIRY);
    }
    return string_to_sec(REFRESH_TOKEN_EXPIRY);
}

export function verifyToken(request, isAccess) {
    let token;
    if (typeof request === 'object') {
        const authorization = request.headers.get("Authorization");
        if (!authorization) {
            return null;
        }
      
        token = authorization.replace("Bearer ", "");
    }
    else {
        token = request;
    }
  
    try {
        let decoded;
        if (isAccess) decoded = jwt.verify(token, ACCESS_SECRET);
        else decoded = jwt.verify(token, REFRESH_SECRET);
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

export async function fetchWithAuth(url, options = {}) {
    let response = await fetch(url, {
        ...options,
        credentials: "include",
    });

    if (response.status === 401 || response.status === 403) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
            return new Response(JSON.stringify({ message: "Session expired" }), {
                status: 440,
                headers: { "Content-Type": "application/json" },
            });
        }

        response = await fetch(url, {
            ...options,
            credentials: "include",
        });
    }
    return response;
}

// HELPERS
function string_to_sec(expiry) {
    const unit = expiry.slice(-1);
    const amount = parseInt(expiry.slice(0, -1), 10);
    let seconds;
    if (unit === 's') seconds = amount;
    else if (unit === 'm') seconds = amount * 60;
    else if (unit === 'h') seconds = amount * 60 * 60;
    else if (unit === 'd') seconds = amount * 24 * 60 * 60;
    else throw new Error('Unsupported time unit');
    return seconds;
}

async function refreshAccessToken() {
    try {
        const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}
