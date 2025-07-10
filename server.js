require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.get("/get-presigned-url", async (req, res) => {
  let { fileName, fileType, userId, itemId, type } = req.query;

  // Validate required query params
  if (!fileName || !fileType || !userId || !itemId) {
    console.log("Missing required query params:", req.query);
    return res
      .status(400)
      .json({ error: "Missing required query parameters." });
  }

  // Validate bucket name
  if (!process.env.S3_BUCKET) {
    console.log("Bucket name is missing or undefined in env.");
    return res.status(500).json({ error: "Bucket name is undefined." });
  }

  // Ensure fileType is a valid MIME type
  const validMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
  ];
  if (!validMimeTypes.includes(fileType)) {
    console.log(
      `Invalid fileType "${fileType}" received, defaulting to image/png`
    );
    fileType = "image/png";
  }

  const folderPrefix = type === "ngo" ? "items/ngocampaign" : "items";
  const key = `${folderPrefix}/${userId}/${itemId}/${fileName}`;
  console.log("Bucket name:", process.env.S3_BUCKET);
  console.log("Key:", key);
  console.log("fileType:", fileType);

  const uploadParams = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 60,
    ContentType: fileType,
    ServerSideEncryption: "AES256",
  };

  try {
    const uploadUrl = await s3.getSignedUrlPromise("putObject", uploadParams);
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
    res.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.log("S3 error:", err);
    res.status(500).json({ error: err.message, details: err });
  }
});

app.post("/create-payment-intent", express.json(), async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing amount or currency" });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
