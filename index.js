import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import User from "./users.js";

const __dirname = path.resolve();


const app = express();
app.set("port", process.env.PORT || 3001);
app.set("json spaces", 2);
app.use(cors());
app.use(express.static("public"));
app.use("/static", express.static("public"));

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"), { flags: "a" }
);

app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.json());

mongoose.connect(
    process.env.CONNECTION_DB, { useNewUrlParser: true }
);

// const db = mongoose.connection

// db.once('open', async() => {
//     if (await User.countDocuments().exec() > 0) return

//     Promise.all([
//         User.create({ name: 'User 1' }),
//         User.create({ name: 'User 2' }),
//         User.create({ name: 'User 3' }),
//         User.create({ name: 'User 4' }),
//         User.create({ name: 'User 5' }),
//         User.create({ name: 'User 6' }),
//         User.create({ name: 'User 7' }),
//         User.create({ name: 'User 8' }),
//         User.create({ name: 'User 9' }),
//         User.create({ name: 'User 10' }),
//         User.create({ name: 'User 11' }),
//         User.create({ name: 'User 12' }),
//     ]).then(() => console.log('add'))
// })
const paginatedResults = (model) => {
    return async(req, res, next) => {
        const page = Number(req && req.query && req.query.page) || 1;
        // const limit = Number(req.query.limit);
        const limit = 10;

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const results = {
            page: page,

            limit: limit,
            total: await model.countDocuments().exec(),
        };

        if (endIndex < (await model.countDocuments().exec())) {
            results.next = page + 1;
        }

        if (startIndex > 0) {
            results.prev = page - 1;
        }
        try {
            results.data = await model.find().limit(limit).skip(startIndex).exec();
        } catch (e) {
            res.status(500).json({ message: e.message });
        }

        res.paginatedResults = results;

        next();
    };
};

app.get("/list", paginatedResults(User), (req, res) => {
    res.json(res.paginatedResults);
});

app.use("/", (_, res) => {
    res.send("Welcome");
});

app.listen(app.get("port"), (_) => {
    console.log("Server Running on port " + app.get("port"));
});