import express from "express";
import authRoute from "./routes/authRoute.js";
import errorHandler from "./middlewares/errorHandler.js";

// const app = express();
// app.use(express.json());

// app.use("/api/auth" , authRoute);

// app.use(errorHandler);
// export default app;

export  const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoute);
    app.use(errorHandler);
    return app;
}
