import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export async function GET(request, { params }) {
    const paramData = await params;
    const segments = paramData.file;
    const filePath = path.join(process.cwd(), "uploads", ...segments);
    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream"; // Fallback to binary data if unknown

    return new Response(fileBuffer, {
        status: 200,
        headers: { "Content-Type": mimeType },
    });
}
