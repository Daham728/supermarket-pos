import "dotenv/config";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { loginSchema } from "../validators/authValidators.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with at least 32 characters."
    );
  }

  return secret;
}

const jwtSecret: string = getJwtSecret();
const jwtExpiresIn = (
  process.env.JWT_EXPIRES_IN || "8h"
) as SignOptions["expiresIn"];

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Login validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "This user account is inactive",
      });
      return;
    }

    const token = jwt.sign(
      {
        role: user.role,
      },
      jwtSecret,
      {
        algorithm: "HS256",
        subject: String(user.id),
        issuer: "supermarket-pos-api",
        audience: "supermarket-pos-client",
        expiresIn: jwtExpiresIn,
      }
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response
) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}