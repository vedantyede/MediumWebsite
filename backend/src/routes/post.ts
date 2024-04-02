import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { createBlogInput, updateBlogInput } from "@vedantyede/medium-common";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const postRouter = new Hono<
    {
        Bindings: {
            DATABASE_URL: string;
            JWT_SECRET: string;
        },
        Variables: {
            userId: string;
        }
    }
>();

postRouter.use("/*", async (c, next) => {
    const token = c.req.header("Authorization") || "";
    const user = await verify(token, "myscret");
    if (user) {
        c.set("userId", user.id);
        await next();
    } else {
        c.status(403);
        c.json({ message: "Unauthorized" });
    }
});


///////////////////
postRouter.post("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const authorId = c.get("userId");
    try {
        const body = await c.req.json();
        const { success } = createBlogInput.safeParse(body);
        // console.log("Success: ", success);
        if (!success) {
            c.status(400);
            return c.json({ message: "Invalid input" });
        }
        const post = await prisma.post.create({
            data: {
                title: body.title,
                content: body.content,
                authorId: authorId,
            },
        });
        return c.json({
            id: post.id,
        });
    } catch (e: any) {
        c.status(403);
        console.log(e.message);
        return c.json({ message: "error while fetching blog" });
    }
});
///////////////////
postRouter.put("/", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const body = await c.req.json();
        const { success } = updateBlogInput.safeParse(body);
        // console.log("Success: ", success);
        if (!success) {
            c.status(400);
            return c.json({ message: "Invalid input" });
        }
        const post = await prisma.post.update({
            where: {
                id: body.id,
            },
            data: {
                title: body.title,
                content: body.content
            }
        });
        return c.json({
            id: post.id,
        });
    } catch (e: any) {
        c.status(403);
        return c.json({ message: "error while fetching post" });
    }
});
///////////////////
// Todo: Add Pagination
postRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const posts = await prisma.post.findMany();
        return c.json({
            posts
        })
    } catch (e: any) {
        c.status(403);
        return c.json({ message: "error while fetching blog" });
    }
})
///////////////////
postRouter.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const id = c.req.param("id");
    try {
        const post = await prisma.post.findFirst({
            where: {
                id: id
            },
        });
        return c.json({
            post
        })
    } catch (e: any) {
        c.status(403);
        return c.json({ message: "error while fetching blog" });
    }
})