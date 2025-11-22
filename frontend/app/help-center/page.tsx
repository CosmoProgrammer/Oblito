export default function HelpCenterPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Help Center</h1>
            <p className="text-gray-700 leading-relaxed mb-6">
                Welcome to the Oblito Help Center. We're here to assist you with any questions or issues you may have. Below you'll find various ways to get in touch with our support team.
            </p>

            <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
                <h2 className="text-2xl font-bold mb-3 text-gray-800">Contact Information</h2>
                <p className="text-gray-700 mb-2">
                    <strong>Phone:</strong> +91 6366676969
                </p>
                <p className="text-gray-700 mb-2">
                    <strong>Email:</strong> <a href="mailto:support@oblito.com" className="text-blue-600 hover:underline">support@oblito.com</a>
                </p>
                <p className="text-gray-700">
                    <strong>Address:</strong> BITS Pilani Hyderabad Campus, Jawahar Nagar, Shameerpet, Hyderabad, Telangana 500078
                </p>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                <h2 className="text-2xl font-bold mb-3 text-gray-800">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">How do I place an order?</h3>
                        <p className="text-gray-700">To place an order, simply browse our products, add the desired items to your cart, and proceed to checkout. Follow the on-screen instructions to complete your purchase.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">How can I track my order?</h3>
                        <p className="text-gray-700">Once your order has shipped, you will receive a tracking number via email. You can use this number on our "Track Order" page to monitor its delivery status.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">What is your return policy?</h3>
                        <p className="text-gray-700">We offer a 30-day return policy on most items. Please visit our "Returns and Orders" section for detailed information on how to initiate a return.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">How do I contact customer support?</h3>
                        <p className="text-gray-700">You can reach our customer support team via phone at +91 6366676969 or by emailing us at support@oblito.com. Our support hours are Monday to Friday, 9 AM to 5 PM IST.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
