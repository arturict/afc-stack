import { env } from "@/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

type UploadResult = { key: string; url?: string };

export async function uploadFile(file: File): Promise<UploadResult> {
    if (env.STORAGE_PROVIDER === "uploadthing") {
        // Client-seitig über UploadThing (separate Routen/Komponenten). Backend hier nicht nötig.
        throw new Error("Use UploadThing client flow in production.");
    }

    // MinIO (S3) – serverseitiger Upload
    const arrayBuffer = await file.arrayBuffer();
    const key = `uploads/${randomUUID()}-${file.name}`;
    const s3 = new S3Client({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION || "us-east-1",
        credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID!,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY!
        },
        forcePathStyle: true
    });
    await s3.send(new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type
    }));
    return { key };
}
