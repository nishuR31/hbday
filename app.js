import express from "express";
import cors from "cors";
import "./utils/env.js";
import route from "./routes/birthdayRoutes.js";
import "./cronScheduler.js";
import morgan from "morgan";


const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    service: "Birthday Automation Service",
    status: "running",
    version: "v1"
  });
});

app.use("/api/v1", route);

app.all("/{*splat}", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Birthday service running on ${PORT}`));

