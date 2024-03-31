import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'

export const userRouter = new Hono<
    {
        Bindings: {
            DATABASE_URL: string;
            JWT_SECRET: string;
        }
    }
>();

userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const body = await c.req.json();
    // console.log("It's body: ", body);
    try {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password,
          name: body.name,
        },
      });
      // console.log("It's user: ", user);
      const payload = {
        id: user.id
      };
      const token = await sign(payload, c.env.JWT_SECRET);
      // console.log("It's token: ", token)
      return c.json({ jwt: token });
    }
    catch (e: any) {
      c.status(403);
      // console.log(e);
      return c.json({ message: "Error while signup" });
    }
  })
  
  userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    try {
      const body = await c.req.json();
      const user = await prisma.user.findFirst({
        where: {
          email: body.email,
          password: body.password,
        }
      });
      if (!user) {
        c.status(403);
        return c.json({ message: "User not found" });
      }
      const jwt = await sign({ id: user.id }, "myscret");
      return c.json({ jwt });
    } catch (e: any) {
      c.status(403);
      return c.json({ message: "Error while signin" });
    }
  
  })