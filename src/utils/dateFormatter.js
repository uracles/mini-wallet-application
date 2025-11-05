export const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString(); // returns 2025-11-04T10:45:23.000Z
};
