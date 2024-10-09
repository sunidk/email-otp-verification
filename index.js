const express = require("express");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const app = express();
app.use(express.json());
require("dotenv").config();
const PORT = process.env.PORT || 3000;

let otps = {};

app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    const otp = randomstring.generate({ length: 6, charset: "numeric" });
    const expiryTime = Date.now() + 5 * 60 * 1000;

    otps[email] = { otp, expiryTime };

    let config = {
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    };

    let transporter = nodemailer.createTransport(config);

    let emailBody = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "OTP Verification!",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(emailBody);

    return res.status(200).json({
      msg: "Email sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ msg: "Failed to send email", error: error.message });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ msg: "Email and OTP are required" });
  }
  const storedOtp = otps[email];

  if (!storedOtp) {
    return res.status(400).send("OTP not found or has expired");
  }

  const { otp: generatedOtp, expiryTime } = storedOtp;

  if (Date.now() > expiryTime) {
    delete otps[email];
    return res.status(400).send("OTP has expired");
  }

  if (otp == generatedOtp) {
    setTimeout(() => {
      delete otps[email];
    }, 5000);
    return res.status(200).send("OTP verified successfully");
  } else {
    return res.status(400).send("Invalid OTP");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
