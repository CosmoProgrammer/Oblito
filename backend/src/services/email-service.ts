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

export const sendOrderConfirmationEmail = async (to: string, customerName: string, orderId: string, orderDetails: { productName: string; quantity: number; price: string; }[]) => {
    const subject = `Your Oblito Order Confirmation [${orderId}]`;
    
    let itemsHtml = '<ul>';
    let itemsText = '';
    for (const item of orderDetails) {
        itemsHtml += `<li>${item.productName} (Quantity: ${item.quantity}) - ₹${item.price}</li>`;
        itemsText += `- ${item.productName} (Quantity: ${item.quantity}) - ₹${item.price}\n`;
    }
    itemsHtml += '</ul>';

    const total = orderDetails.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    const text = `Dear ${customerName},\n\nThank you for your order!\n\nOrder ID: ${orderId}\n\nItems:\n${itemsText}\n\nTotal: ₹${total.toFixed(2)}\n\nWe'll notify you when your items have shipped.\n\nThe Oblito Team`;

    const html = `<p>Dear ${customerName},</p>
                  <p>Thank you for your order! Your order ID is <strong>${orderId}</strong>.</p>
                  <h3>Order Summary:</h3>
                  ${itemsHtml}
                  <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
                  <p>We'll notify you when your items have shipped.</p>
                  <p>Thank you for shopping with us!</p>
                  <p><strong>The Oblito Team</strong></p>`;

    try {
        await transporter.sendMail({
            from: `"Oblito" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log('Order confirmation email sent to:', to);
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
    }
};

