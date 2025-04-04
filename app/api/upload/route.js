import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Disable the default body parser so we can parse files
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token, true);
    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    if (decoded.role !== "USER" && decoded.role !== "HOTEL_OWNER") {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    try {
        // Files are sent to "uploads" folder in project directory
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const formData = await request.formData();
        const file = formData.get("file");
        const uploadType = formData.get("upload-type");
        const hotelId = formData.get("hotel-id");
        const roomId = formData.get("room-id");

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const ext = path.extname(file.name) || ".jpg";
        let filePath;
        let fileName;
        let fileSubpath;
        let hash;

        switch (uploadType)
        {
            case "profile-picture":
                fileSubpath = path.join("users", `${decoded.id}`);
                const userDir = path.join(uploadDir, fileSubpath);
                fs.mkdirSync(userDir, { recursive: true });
                fileName = `profile-picture${ext}`;
                filePath = path.join(userDir, fileName);
                fileSubpath = path.join(fileSubpath, fileName);
                break;
            case "hotel-image":
                if (!hotelId) {
                    return NextResponse.json({ error: "Missing hotel ID" }, { status: 400 });
                }
                hash = crypto.createHash("sha256").update(buffer).digest("hex");
                fileSubpath = path.join("hotels", `${hotelId}`, "images");
                const hotelImageDir = path.join(uploadDir, fileSubpath);
                fs.mkdirSync(hotelImageDir, { recursive: true });
                fileName = `${hash}${ext}`;
                filePath = path.join(hotelImageDir, fileName);
                fileSubpath = path.join(fileSubpath, fileName);
                break;
            case "hotel-room-image":
                if (!hotelId || !roomId) {
                    return NextResponse.json({ error: "Missing hotel ID or room ID" }, { status: 400 });
                }
                hash = crypto.createHash("sha256").update(buffer).digest("hex");
                fileSubpath = path.join("hotels", `${hotelId}`, "rooms", `${roomId}`);
                const roomImageDir = path.join(uploadDir, fileSubpath);
                fs.mkdirSync(roomImageDir, { recursive: true });
                fileName = `${hash}${ext}`;
                filePath = path.join(roomImageDir, fileName);
                fileSubpath = path.join(fileSubpath, fileName);
                break;
            default:
                fileSubpath = "misc";
                const genericDir = path.join(uploadDir, fileSubpath);
                fs.mkdirSync(genericDir, { recursive: true });
                hash = crypto.createHash("sha256").update(buffer).digest("hex");
                fileName = `${decoded.id}_${hash}${ext}`;
                filePath = path.join(genericDir, fileName);
                fileSubpath = path.join(fileSubpath, fileName);
                break;
        }

        // Delete existing files with same name before saving
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ url: `/api/upload/${fileSubpath.replace(/\\/g, "/")}` },{
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" },{
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}