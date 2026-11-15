/**
 * 环境变量集中读取。除了这里，其它模块不再直接读 process.env。
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`缺少必需的环境变量: ${name}`);
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  authSecret: required("AUTH_SECRET"),

  siteUrl: optional("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/$/, ""),
  siteName: optional("NEXT_PUBLIC_SITE_NAME", "学园夏日局"),

  redisUrl: optional("REDIS_URL"),

  s3: {
    region: optional("S3_REGION"),
    bucket: optional("S3_BUCKET"),
    endpoint: optional("S3_ENDPOINT"),
    accessKeyId: optional("S3_ACCESS_KEY_ID"),
    secretAccessKey: optional("S3_SECRET_ACCESS_KEY"),
    publicBaseUrl: optional("S3_PUBLIC_BASE_URL").replace(/\/$/, ""),
  },

  smtp: {
    host: optional("SMTP_HOST"),
    port: Number(optional("SMTP_PORT", "465")),
    user: optional("SMTP_USER"),
    pass: optional("SMTP_PASS"),
    from: optional("SMTP_FROM"),
  },
};

export const isS3Enabled = Boolean(
  env.s3.region && env.s3.bucket && env.s3.accessKeyId && env.s3.secretAccessKey,
);

export const isRedisEnabled = Boolean(env.redisUrl);

export const isSmtpEnabled = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
