'use client'

import { useState } from 'react'

interface InviteDetailsProps {
  groupName: string
  inviteCode: string
  inviteLink: string
  onClose: () => void
}

export default function InviteDetails({ groupName, inviteCode, inviteLink, onClose }: InviteDetailsProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🎉 Private Group Created!
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{groupName}</h3>
            <p className="text-sm text-gray-600">
              Share these details with people you want to invite to your private group:
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-gray-900 font-mono text-lg">
                  {inviteCode}
                </code>
                <button
                  onClick={() => copyToClipboard(inviteCode, 'code')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition duration-200"
                >
                  {copied === 'code' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-white px-3 py-2 rounded border text-gray-900 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(inviteLink, 'link')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition duration-200"
                >
                  {copied === 'link' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}