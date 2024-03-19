import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { signupInput, signinInput } from "@mayukh03/medium-common";
import { sign } from 'hono/jwt'


export const userRouter= new Hono<{
    Bindings: {
      DATABASE_URL: string,
      JWT_SECRET: string
    }
  }>()


userRouter.post('/signup',async (c) => {
    const body=await c.req.json()
    const {success}= signupInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: "Invalid credentials"
      })
    }
    const prisma= new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    try{
      const newUser= await prisma.user.create({
        data: {
          username: body?.username,
          password: body?.password,
          name: body?.name
        }
      })
      const jwt= await sign({
        id: newUser.id
      }, c.env.JWT_SECRET)
      c.status(200)
      return c.json({jwt, newUser})
    }catch(error: any){
      throw new Error(error);
    }
})
  
userRouter.post('/signin', async(c) => {
    const body=await c.req.json()
    const {success}= signinInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: "Invalid credentials"
      })
    }
    const prisma= new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
      const existingUser= await prisma.user.findFirst({
        where: {
          username: body?.username,
          password: body?.password
        }
      })
      if(!existingUser){
          c.status(401);
          return c.text("invalid credentials")
      }
      const jwt= await sign({
        id: existingUser.id
      }, c.env.JWT_SECRET)
      c.status(200);
      return c.json({
        existingUser, jwt
      })
    } catch (error: any) {
      throw new Error(error);
    }
})