const adjectives = [
  'Swift', 'Bright', 'Clever', 'Bold', 'Quick', 'Smart', 'Keen', 'Sharp', 'Wise', 'Cool',
  'Calm', 'Fair', 'Kind', 'Pure', 'True', 'Free', 'Wild', 'Dark', 'Light', 'Fast',
  'Strong', 'Brave', 'Happy', 'Lucky', 'Magic', 'Noble', 'Royal', 'Super', 'Ultra', 'Mega'
]

const nouns = [
  'Tiger', 'Lion', 'Eagle', 'Wolf', 'Bear', 'Fox', 'Owl', 'Hawk', 'Shark', 'Dragon',
  'Phoenix', 'Falcon', 'Panther', 'Jaguar', 'Leopard', 'Cheetah', 'Raven', 'Cobra', 'Viper', 'Python',
  'Wizard', 'Knight', 'Warrior', 'Hunter', 'Scout', 'Ranger', 'Guardian', 'Champion', 'Hero', 'Legend',
  'Storm', 'Thunder', 'Lightning', 'Flame', 'Frost', 'Shadow', 'Spirit', 'Ghost', 'Phantom', 'Ninja'
]

export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 1000)
  
  return `${adjective}${noun}${number}`
}

// Store username mapping in localStorage
export function getUsernameForEmail(email: string): string {
  const storageKey = `username_${email}`
  let username = localStorage.getItem(storageKey)
  
  if (!username) {
    username = generateRandomUsername()
    localStorage.setItem(storageKey, username)
  }
  
  return username
}