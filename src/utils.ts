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
