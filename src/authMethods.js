export default {
  citizen: {
    low: [
      'iam-aprofiel-userpass',
      'fas-citizen-bmid',
      'fas-citizen-otp',
      'fas-citizen-totp',
      'fas-citizen-eid'
    ],
    substantial: [
      'fas-citizen-bmid',
      'fas-citizen-otp',
      'fas-citizen-totp',
      'fas-citizen-eid'
    ],
    high: [
      'fas-citizen-bmid',
      'fas-citizen-eid'
    ]
  },
  enterprise: {
    substantial: [
      'fas-enterprise-bmid',
      'fas-enterprise-otp',
      'fas-enterprise-totp',
      'fas-enterprise-eid'
    ],
    high: [
      'fas-enterprise-eid'
    ]
  },
  'enterprise-citizen': {
    substantial: [
      'fas-hintedlogin-bmid',
      'fas-hintedlogin-otp',
      'fas-hintedlogin-totp',
      'fas-hintedlogin-eid'
    ],
    high: [
      'fas-citizen-bmid',
      'fas-hintedlogin-eid'
    ]
  }
}
