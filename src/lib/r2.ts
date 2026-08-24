import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 habla el mismo protocolo que S3, así que usamos el SDK de AWS
// apuntando al endpoint de tu cuenta de Cloudflare.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${import.meta.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: import.meta.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = import.meta.env.R2_BUCKET_NAME!;

export async function subirArchivo(key: string, body: Buffer, contentType: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

// Genera un enlace de descarga temporal (por defecto 1 hora).
export async function urlDescargaTemporal(key: string, segundosValidez = 3600) {
  const comando = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, comando, { expiresIn: segundosValidez });
}
