import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "olin64@ethereal.email",
    pass: "WvBcS1qK7Yc7FU4awT",
  },
});

export { transporter };
