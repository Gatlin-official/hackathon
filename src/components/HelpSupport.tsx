'use client'

interface HelpSupportProps {
  onClose: () => void
}

export default function HelpSupport({ onClose }: HelpSupportProps) {
  const faqs = [
    {
      question: "How do I create a group?",
      answer: "Click the 'Create Group' button and provide a group name. You'll get an invite code to share with others."
    },
    {
      question: "How do I join a group?",
      answer: "Click 'Join Group' and enter the invite code provided by the group creator."
    },
    {
      question: "Is my data private?",
      answer: "Yes, all messages are encrypted and your identity is protected through pseudonyms."
    },
    {
      question: "How do I leave a group?",
      answer: "Contact the group administrator or use the leave group option in your dashboard."
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Help & Support</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Need More Help?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800">Email Support</span>
                  </div>
                  <p className="text-sm text-gray-600">support@discussiongroups.com</p>
                  <p className="text-xs text-gray-500 mt-1">Response within 24 hours</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <span className="font-medium text-gray-800">Live Chat</span>
                  </div>
                  <p className="text-sm text-gray-600">Available 9 AM - 5 PM EST</p>
                  <button className="text-xs bg-green-600 text-white px-2 py-1 rounded mt-2 hover:bg-green-700 transition-colors">
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}