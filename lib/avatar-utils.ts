/**
 * Generate a consistent color for an avatar based on a string
 * Similar to WhatsApp's avatar color generation
 */
export function getAvatarColor(str: string): string {
  // WhatsApp-like color palette
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Orange
    '#52BE80', // Green
    '#EC7063', // Coral
    '#5DADE2', // Light Blue
    '#F1948A', // Pink
    '#82E0AA', // Light Green
    '#F9E79F', // Light Yellow
    '#D7BDE2', // Lavender
  ];

  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get initials from a name/username
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return 'U';
  }

  const parts = name.trim().split(/\s+/);
  
  if (parts.length >= 2) {
    // First letter of first word + first letter of last word
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  // First two letters of the name
  return name.substring(0, 2).toUpperCase();
}

