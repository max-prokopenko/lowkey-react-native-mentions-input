export const PATTERNS = {
  MENTION: /<@[a-zA-Z0-9%_-]+::[a-f\d]{24}>/gi,
  URL: /(?:(?:https?):\/\/|www\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim,
  USERNAME_MENTION: /\B@[a-zA-Z0-9%_-]*/gi,
};
