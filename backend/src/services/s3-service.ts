import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from 'crypto';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: process.env.ACCESS_KEY || '',
        secretAccessKey: process.env.SECRET_KEY || '',
    }
});
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'oblito';

export async function getS3UploadUrl(fileName: string, fileType: string) {
    const randomName = crypto.randomBytes(16).toString('hex');
    const key = `products/${randomName}-${fileName}`;
    
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const finalUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl: signedUrl, finalUrl };
}

export async function getS3UploadUrlForProfile(fileName: string, fileType: string) {
    const randomName = crypto.randomBytes(16).toString('hex');
    const key = `profiles/${randomName}-${fileName}`;
    
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const finalUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl: signedUrl, finalUrl };
}