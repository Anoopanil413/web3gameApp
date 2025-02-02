// Helper function to extract tweet ID from URL or return the ID itself
 const extractTweetId = (tweetIdOrUrl) => {
    if (!tweetIdOrUrl) return null;
  
    // If it's a pure numeric string, assume it's an ID
    if (/^\d+$/.test(tweetIdOrUrl)) {
      return tweetIdOrUrl;
    }
  
    try {
      const url = new URL(tweetIdOrUrl);
      // Handle different Twitter URL formats
      const pathParts = url.pathname.split('/');
      const statusIndex = pathParts.findIndex(part => part === 'status' || part === 'statuses');
      
      if (statusIndex !== -1 && pathParts[statusIndex + 1]) {
        // Remove any query parameters or additional path segments
        return pathParts[statusIndex + 1].split('?')[0];
      }
    } catch (error) {
      return null;
    }
    
    return null;
  };

  module.exports = { extractTweetId };
  