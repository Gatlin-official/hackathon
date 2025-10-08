'use client'

import { useState, useEffect } from 'react'
import { getCurrentUsername, generateRandomUsername } from '@/utils/username'
import { useSession } from 'next-auth/react'

interface AccountSettingsProps {
  onClose: () => void
}

export default function AccountSettings({ onClose }: AccountSettingsProps) {
  const { data: session } = useSession()
  const [displayName, setDisplayName] = useState('')
  const [mentorContacts, setMentorContacts] = useState([{ name: '', contact: '' }])
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      const currentUsername = getCurrentUsername(session)
      setDisplayName(currentUsername)
    }
    
    // Load saved mentor contacts from localStorage
    if (session?.user?.email) {
      const contactsKey = `mentorContacts_${session.user.email}`
      const savedContacts = localStorage.getItem(contactsKey)
      if (savedContacts) {
        setMentorContacts(JSON.parse(savedContacts))
      }
    }
  }, [session])

  const handleGenerateNewUsername = async () => {
    if (!session?.user?.email) return
    
    setIsGeneratingUsername(true)
    setTimeout(() => {
      const newUsername = generateRandomUsername()
      setDisplayName(newUsername)
      
      // Update localStorage with new username using the same key format as getCurrentUsername
      if (session.user?.email) {
        const usernameKey = `displayName_${session.user.email}`
        localStorage.setItem(usernameKey, newUsername)
      }
      
      setIsGeneratingUsername(false)
    }, 500) // Add a small delay for better UX
  }

  const handleAddMentorContact = () => {
    setMentorContacts([...mentorContacts, { name: '', contact: '' }])
  }

  const handleRemoveMentorContact = (index: number) => {
    setMentorContacts(mentorContacts.filter((_, i) => i !== index))
  }

  const handleMentorContactChange = (index: number, field: 'name' | 'contact', value: string) => {
    const updatedContacts = mentorContacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    )
    setMentorContacts(updatedContacts)
  }

  const handleSave = () => {
    if (session?.user?.email) {
      // Save mentor contacts to localStorage with user-specific key
      const contactsKey = `mentorContacts_${session.user.email}`
      localStorage.setItem(contactsKey, JSON.stringify(mentorContacts))
      
      // Save current display name to localStorage
      const usernameKey = `displayName_${session.user.email}`
      localStorage.setItem(usernameKey, displayName)
      
      console.log('Settings saved successfully!')
    }
    
    // Close the modal
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-6">
            {/* Random Display Name Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name (Random)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                  placeholder="Your random display name"
                />
                <button
                  onClick={handleGenerateNewUsername}
                  disabled={isGeneratingUsername}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isGeneratingUsername ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>🎲</span>
                    </>
                  ) : (
                    <>
                      <span>🎲</span>
                      <span>Randomize</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Click the dice to generate a new random username</p>
            </div>

            {/* Mentor/Safety Contacts Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🚨 Mentor/Safety Contacts
              </label>
              <p className="text-xs text-gray-500 mb-3">
                These contacts will be shown in crisis situations instead of generic hotlines
              </p>
              
              {mentorContacts.map((contact, index) => (
                <div key={index} className="flex gap-2 mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleMentorContactChange(index, 'name', e.target.value)}
                    placeholder="Mentor name (e.g., Dr. Smith)"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="tel"
                    value={contact.contact}
                    onChange={(e) => handleMentorContactChange(index, 'contact', e.target.value)}
                    placeholder="Phone number"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  {mentorContacts.length > 1 && (
                    <button
                      onClick={() => handleRemoveMentorContact(index)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={handleAddMentorContact}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
              >
                + Add Another Contact
              </button>
            </div>

            {/* Email Notifications Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Notifications
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="ml-2 text-sm text-gray-600">Group messages</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">Crisis alerts</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-600">System updates</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}