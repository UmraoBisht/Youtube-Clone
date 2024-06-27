import dotenv from "dotenv";
import { connectDB } from "./db/connectDB.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.on("error", () => {
      console.log("ERROR: ", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT} at url:: http://localhost:8000/api/v1/users/register`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", () => {
//       console.log("ERROR: ", error);
//       throw error;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`Server running on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("ERROR: ", error);
//     throw error;
//   }
// })();
