// src/app.ts
import express from "express"
import identifyRoutes from "./routes/identify.route.js"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use(express.json())
app.use("/", identifyRoutes)

export default app
