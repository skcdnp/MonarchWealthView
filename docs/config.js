// config.js — safe to commit publicly. Neither value below is a secret.
// CLIENT_ID is a public app identifier (visible in browser network inspector by design).
// SHEET_ID is safe as long as the Sheet itself requires Google authentication to access.

const CONFIG = {
  CLIENT_ID: '900533309879-rdnud95bfjgpv0167p7mpgs3j02pusjn.apps.googleusercontent.com',
  SHEET_ID: '176Cafqw3S46X2RE7ZmXhL9MdfeTO0YaqHdsRGdMQH-E',
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

  // Add every family member's Gmail address here.
  // To add a new person: add their email, push to GitHub — done.
  WHITELIST: [
    'shomi.k.chowdhury@gmail.com', 'shazia.peeran@gmail.com', 'khaled.srg@gmail.com'
  ],

  BASE_CURRENCY: 'USD',
  APP_NAME: 'MonarchWealthView',

  ACCOUNT_TYPES: [
    // Liquid
    'Checking', 'Savings', 'Money Market', 'CD',
    // Tax-Advantaged
    'HSA', '529', 'Retirement',
    // Investments
    'Brokerage', 'Crypto', 'Annuity',
    // Physical Assets
    'Real Estate', 'Vehicle', 'Collectibles',
    // Business
    'Business',
    // Insurance
    'Life Insurance',
    // Liabilities
    'Mortgage', 'Credit Card', 'Loan',
    // Catch-all
    'Other',
  ],

  CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN'],

  DATE_FORMATS: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
};
