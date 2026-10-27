import { connectDB } from "./db.js";
import { schema } from "./schema.js";
import { graphql } from "graphql";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Todo GraphQL API is running");
});
app.post("/graphql", async (req, res) => {
    try {
        const { query, variables, operationName } = req.body;
        if(typeof query !== "string") {
            return res.status(400).json({
                errors: [{ message: "A GraphQL query is required" }],
            });
        }
        const result = await graphql({
            schema: schema,
            source: query,
            rootValue: undefined,
            contextValue: {
                todosCollection: app.locals.todosCollection
            },
            variableValues: variables,
            operationName: operationName
        });
        res.json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            errors: [{ message: "Internal server error" }],
        });
    }
});
async function startServer() {
    try {
        const { todosCollection } = await connectDB();
        app.locals.todosCollection = todosCollection
        const port = process.env.port || 5000;
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`GraphQL endpoint: http://localhost:5000/graphql`);
        })
    } catch (error) {
        console.log("Failed to start application:", error);
        process.exit(1);
    }
}

startServer();