/**
 * Firebase Functions v2 – Send Invoice Email with PDF
 */

const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2/options");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const cors = require("cors")({ origin: true });

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

/* ============================================================
   EMAIL TRANSPORTER (USE GMAIL APP PASSWORD)
============================================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jawaharlalr10@gmail.com",      // <-- change
    pass: "cdpm yvpi txdy nyms" // <-- change
  },
});

/* ============================================================
   PDF GENERATOR
============================================================ */
function generatePDF(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // ---- HEADER ----
    doc.fontSize(22).text("INVOICE", { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Order ID: ${order.orderId}`);
    doc.text(`Customer: ${order.userName}`);
    doc.text(`Phone: ${order.userPhone}`);
    doc.text(`Address: ${order.address}`);
    doc.moveDown();

    // ---- ITEMS ----
    (order.items || []).forEach((item) => {
      doc.text(
        `${item.name} | Color: ${item.selectedOptions?.color || "-"} | Size: ${
          item.selectedOptions?.size || "-"
        } | Qty: ${item.quantity} | ₹${item.price}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: ₹${order.totalPrice}`);

    doc.end();
  });
}

/* ============================================================
   SEND INVOICE EMAIL (HTTP API)
============================================================ */
exports.sendInvoiceEmail = onRequest(
  { cors: true }, // enables CORS automatically
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    try {
      const { order, email } = req.body;

      if (!order || !email) {
        return res.status(400).json({ error: "Missing order or email" });
      }

      logger.info("Sending invoice email to:", email);

      const pdfBuffer = await generatePDF(order);

      await transporter.sendMail({
        from: "prstationersstore@gmail.com",
        to: email,
        subject: `Invoice for Order ${order.orderId}`,
        text: "Your invoice is attached.",
        attachments: [
          {
            filename: `Invoice_${order.orderId}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error("INVOICE EMAIL ERROR:", error);
      return res.status(500).json({ error: "Failed to send invoice" });
    }
  }
);
