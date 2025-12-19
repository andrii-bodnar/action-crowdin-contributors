export const wait = async (milliseconds: number): Promise<string> => {
  return new Promise((resolve) => {
    if (isNaN(milliseconds)) {
      throw new Error('milliseconds not a number');
    }

    setTimeout(() => resolve('done!'), milliseconds);
  });
};

export const extractCrowdinOrganization = (text: string): string => {
  const match = text.match(/([\w\d-]+)(\.api\.crowdin\.com|\.crowdin\.com|$)/);
  return match ? match[1] : text;
};

export const formatUserName = (
  fullName: string,
  username: string,
  maxNameLength: number = 20,
): { displayName: string; usernameDisplay: string } => {
  // Parse display name and username from fullName
  // If fullName is empty or same as username: show only username
  // If fullName exists and different from username: show "DisplayName (username)"
  const trimmedFullName = fullName.trim();
  let displayName: string;
  let usernameDisplay: string;

  if (!trimmedFullName || trimmedFullName === username) {
    // No display name or same as username: show only username
    displayName = username;
    usernameDisplay = '';
  } else {
    // Has display name different from username
    // Check if it already contains username in parentheses
    const nameMatch = trimmedFullName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (nameMatch) {
      // Already has format "Display Name (username)"
      displayName = nameMatch[1].trim();
      usernameDisplay = `(${nameMatch[2].trim()})`;
    } else {
      // Display name without parentheses, add username
      displayName = trimmedFullName;
      usernameDisplay = `(${username})`;
    }
  }

  // Truncate display name if too long
  if (displayName.length > maxNameLength) {
    displayName = displayName.substring(0, maxNameLength) + '...';
  }

  return { displayName, usernameDisplay };
};
