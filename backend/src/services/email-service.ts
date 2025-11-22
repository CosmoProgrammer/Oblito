import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendOrderStatusUpdateEmail = async (to: string, orderId: string, newStatus: string, productName: string, customerName: string) => {
    const subject = `Order Status Update for ${productName}`;
    const text = `Dear ${customerName},

Your order for ${productName} (Order ID: ${orderId}) has been updated to: ${newStatus}.

Thank you for shopping with us!

The Oblito Team`;
    const html = `<p>Dear ${customerName},</p><p>Your order for <strong>${productName}</strong> (Order ID: ${orderId}) has been updated to: <strong>${newStatus}</strong>.</p><p>Thank you for shopping with us!</p><p><strong>The Oblito Team</strong></p>`;

    try {
        await transporter.sendMail({
            from: `"Oblito" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Order status update email sent to:', to);
    } catch (error) {
        console.error('Error sending order status update email:', error);
        // We probably don't want to fail the whole request if email fails, so we just log the error.
    }
};
