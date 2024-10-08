import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z, ZodError } from 'zod';
import { userSchema } from '../schemas';

const prisma = new PrismaClient();

export async function registerUser(req: Request, res: Response) {
    try {
        const userData = userSchema.parse(req.body);

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const user = await prisma.user.create({
            data: { ...userData, password: hashedPassword }
        });
        res.json(user);

    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({ error: error.errors });
        } else {
            console.log(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function loginUser(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, 'your_jwt_secret', { expiresIn: "1h" });
    res.json({ token });
}

export async function validateJwt(req: Request, res: Response) {
    try {
        const { token } = req.body;

        const decoded = jwt.verify(token, 'your_jwt_secret');
        res.json({ token, decoded });
        
    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: 'Invalid credentials' });
    }
}

