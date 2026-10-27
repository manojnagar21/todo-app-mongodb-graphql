import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLBoolean,
    GraphQLID,
    GraphQLList,
    GraphQLNonNull
} from "graphql";
import { ObjectId } from "mongodb";
// Define the Todo type
const TodoType = new GraphQLObjectType({
    name: "Todo",
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLID),
            resolve: (todo) => todo._id.toString(),
        },
        title: {
            type: new GraphQLNonNull(GraphQLString),
        },
        completed: {
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        createdAt: {
            type: GraphQLString,
        },
    },
});
// Define queries
const RootQuery = new GraphQLObjectType({
    name: "Query",
    fields: {
        todos: {
            type: new GraphQLNonNull(
                new GraphQLList(
                    new GraphQLNonNull(TodoType)
                )
            ),
            resolve: async (_, args, { todosCollection }) => {
                return todosCollection.find({}).toArray();
            },
        },
        todo: {
            type: TodoType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLID),
                },
            },
            resolve: async (_, { id }, { todosCollection }) => {
                if(!ObjectId.isValid(id)) {
                    throw new Error("Invalid todo ID");
                }
                return todosCollection.findOne({
                    _id: new ObjectId(id),
                });
            },
        },
    },
});

//Define mutations
const RootMutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        addTodo: {
            type: TodoType,
            args: {
                title: {
                    type: new GraphQLNonNull(GraphQLString),
                },
            },
            resolve: async (_, { title }, { todosCollection }) => {
                const cleanTitle = title.trim();
                if(!cleanTitle) {
                    throw new Error("Title cannot be empty");
                }
                const todo = {
                    title: cleanTitle,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                const result = await todosCollection.insertOne(todo);
                return {
                    ...todo,
                    _id: result.insertedId,
                };
            },
        },
        updateTodo: {
            type: TodoType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLID),
                },
                title: {
                    type: GraphQLString,
                },
                completed: {
                    type: GraphQLBoolean,
                },
            },
            resolve: async (_, { id, title, completed }, { todosCollection }) => {
                if(!ObjectId.isValid(id)) {
                    throw new Error("Invalid todo ID");
                }
                const updates = {};
                if(title !== undefined) {
                    const cleanTitle = title.trim();
                    if(!cleanTitle) {
                        throw new Error("Title cannot be empty");
                    }
                    updates.title = cleanTitle;
                }
                if(completed !== undefined) {
                    updates.completed = completed;
                }
                if(Object.keys(updates).length === 0) {
                    throw new Error("Provide a field to update")
                }
                return todosCollection.findOneAndUpdate(
                    { _id: new ObjectId(id) },
                    { $set: updates },
                    { returnDocument: "after" }
                ).then((result) => {
                    // Recent MongoDB driver versions return the updated document directly
                    return result;
                });
            },
        },
        deleteTodo: {
            type: TodoType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLID),
                },
            },
            resolve: async (_, { id }, { todosCollection }) => {
                if(!ObjectId.isValid(id)) {
                    throw new Error("Invalid todo ID");
                }
                const todo = await todosCollection.findOneAndDelete({
                    _id: new ObjectId(id)
                });
                return todo;
            },
        },
    },
});

// Create and export GraphQLSchema
const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation
});
export { schema };