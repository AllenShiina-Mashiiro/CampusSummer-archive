import { randomInt } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

import { env } from "./env";

/**
 * 注册人机验证：勾选「我是真人」+ 两道随机算术题。
 *
 * 题目与答案由服务端生成并签名，答案不放进页面明文；提交时校验签名与答案，
 * 这样即使有人直接构造表单也绕不过去。
 */

export type HumanChallenge = {
  token: string;
  questions: { prompt: string }[];
};

const TTL = "15m";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

function makeQuestion(index: number): { prompt: string; answer: number } {
  if (index === 0) {
    const a = randomInt(2, 10);
    const b = randomInt(1, 10);
    return { prompt: `${a} + ${b} = ?`, answer: a + b };
  }

  if (index === 1) {
    const a = randomInt(5, 16);
    const b = randomInt(1, a);
    return { prompt: `${a} − ${b} = ?`, answer: a - b };
  }

  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  return { prompt: `${a} × ${b} = ?`, answer: a * b };
}

export async function createHumanChallenge(): Promise<HumanChallenge> {
  const questions = [makeQuestion(0), makeQuestion(1)];

  const token = await new SignJWT({ answers: questions.map((question) => String(question.answer)) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secretKey());

  return {
    token,
    questions: questions.map((question) => ({ prompt: question.prompt })),
  };
}

export async function verifyHumanChallenge(token: string, answers: string[]): Promise<boolean> {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const expected = payload.answers;
    if (!Array.isArray(expected) || expected.length !== answers.length) return false;

    return expected.every(
      (value, index) => String(value) === String(answers[index] ?? "").trim(),
    );
  } catch {
    return false;
  }
}
