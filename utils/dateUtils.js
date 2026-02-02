export const isBirthdayToday = (dob) => {
  const today = new Date();
  const date = new Date(dob);
  return (
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
};

export const getNextBirthday = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());

  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return next;
};

export const daysUntil = (date) => {
  const now = new Date();
  const diff = date - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

