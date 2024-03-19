import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { createBlogInput, updateBlogInput } from "@mayukh03/medium-common";
import { verify} from 'hono/jwt'

type Variable={
    userId: string
}
export const blogRouter= new Hono<{
    Bindings: {
      DATABASE_URL: string,
      JWT_SECRET: string
    },
    Variables: Variable
}>()



blogRouter.use("/*", async (c, next)=>{
    type authHeaderParam= string | ""
    const authHeader: authHeaderParam= c.req.header("authorization") ?? ""
    const user= await verify(authHeader, c.env.JWT_SECRET)
    if(user){
        c.set("userId", user.id)
        await next()
    }
    else{
        c.status(403);
        return c.json({
            message: "Failed to authenticate"
        })

    }
})

blogRouter.post('/',async (c) => {
    const body=await c.req.json()
    const {success}= createBlogInput.safeParse(body);
    if(!success){
      c.status(411);
      return c.json({
        message: "Invalid credentials"
      })
    }
    const authorId= c.get("userId");
    const prisma= new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try{
        const newBlog= await prisma.blog.create({
            data: {
                title: body?.title,
                content: body?.content,
                authorId: +authorId
            }
        })
        c.status(200);
        return c.json({
            blog: newBlog
        })
    }catch(error: any){
        throw new Error(error);
    }
})
blogRouter.put('/', async(c) => {
    const body=await c.req.json()
    const {success}= updateBlogInput.safeParse(body);
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
        const updatedBlog= await prisma.blog.update({
            where: {
                id: body?.id
            }, 
            data: {
                title: body?.title,
                content: body?.content,
            }
        })
        
        
        c.status(200);
        return c.json({
            blog: updatedBlog
        })
    }catch(error: any){
        throw new Error(error);
    }
})
// todo: add pagination
blogRouter.get('/bulk', async (c) => {
    const prisma= new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const allBlogs= await prisma.blog.findMany({});
        c.status(200);
        return c.json({
            blogs: allBlogs
        })
    } catch (error: any) {
        console.log(error.message)
        throw new Error(error);
    }
})
blogRouter.get('/:id', async(c) => {
    const id=await c.req.param("id") || ""
    const prisma= new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const blog= await prisma.blog.findFirst({
            where: {
                id: +id
            }
        })
        c.status(200);
        return c.json({
            blog: blog
        })
    } catch (error: any) {
        throw new Error(error);
    }
    
})

  
