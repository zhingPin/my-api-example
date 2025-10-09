// import express from "express";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import mongoose from "mongoose";
// import User from "./models/User.js";
// import { OAuth2Client } from "google-auth-library";
// import fetch from "node-fetch";

// const app = express();
// app.use(express.json());

// // Google OAuth client
// const googleClient = new OAuth2Client(process.env.GOOGLE_ID);

// // --- Credentials login (like CredentialsProvider) ---
// app.post("/api/auth/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const foundUser = await User.findOne({ email }).lean().exec();
//     if (!foundUser) return res.status(401).json({ message: "User not found" });

//     const match = await bcrypt.compare(password, foundUser.password);
//     if (!match) return res.status(401).json({ message: "Invalid password" });

//     const role = foundUser.email === "crypto2doe@gmail.com" ? "admin" : "user";

//     const token = jwt.sign(
//       { id: foundUser._id, email: foundUser.email, role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({ token, user: { email: foundUser.email, role } });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // --- Google login (like GoogleProvider) ---
// app.post("/api/auth/google", async (req, res) => {
//   const { token } = req.body; // ID token from frontend

//   try {
//     const ticket = await googleClient.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_ID,
//     });
//     const payload = ticket.getPayload();

//     let user = await User.findOne({ email: payload.email });
//     if (!user) {
//       user = await User.create({
//         googleId: payload.sub,
//         email: payload.email,
//         name: payload.name,
//       });
//     }

//     const role = payload.email === "crypto2doe@gmail.com" ? "admin" : "Google User";

//     const jwtToken = jwt.sign(
//       { id: user._id, email: user.email, role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({ token: jwtToken, user: { email: user.email, role } });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "Invalid Google token" });
//   }
// });

// // --- GitHub login (like GitHubProvider) ---
// app.post("/api/auth/github", async (req, res) => {
//   const { code } = req.body;

//   try {
//     // Step 1: exchange code for access token
//     const tokenRes = await fetch(
//       `https://github.com/login/oauth/access_token`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Accept: "application/json" },
//         body: JSON.stringify({
//           client_id: process.env.GITHUB_ID,
//           client_secret: process.env.GITHUB_SECRET,
//           code,
//         }),
//       }
//     );
//     const tokenJson = await tokenRes.json();
//     const accessToken = tokenJson.access_token;

//     // Step 2: fetch user profile
//     const userRes = await fetch(`https://api.github.com/user`, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });
//     const profile = await userRes.json();

//     let user = await User.findOne({ githubId: profile.id });
//     if (!user) {
//       user = await User.create({
//         githubId: profile.id,
//         email: profile.email,
//         name: profile.name,
//       });
//     }

//     const role = profile.email === "crypto2doe@gmail.com" ? "admin" : "GitHub User";

//     const jwtToken = jwt.sign(
//       { id: user._id, email: user.email, role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({ token: jwtToken, user: { email: user.email, role } });
//   } catch (err) {
//     console.error(err);
//     res.status(401).json({ message: "GitHub login failed" });
//   }
// });

// app.listen(8080, () => console.log("Auth server running on 8080"));
