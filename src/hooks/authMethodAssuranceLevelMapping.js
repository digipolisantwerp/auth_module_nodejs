/**
 * the following script can be used to automatically generate this mapping
 */


// import authMethodsConfig from '../authMethods';

// const authMethodsAssuranceLevel = Object
//   .keys(authMethodsConfig)
//   .reduce((assuranceLevelMapping, currentContext) => {
//     const assuranceLevelMethods = authMethodsConfig[currentContext];
//     const mapping = Object.keys(assuranceLevelMethods).reduce((acc, assuranceLevel) => {
//       const extraMapping = assuranceLevelMethods[assuranceLevel].reduce((acc, authMethod) => {
//         return {
//           ...acc,
//           [authMethod]: assuranceLevel
//         }
//       }, {});
//       return {
//         ...acc,
//         ...extraMapping,
//       }
//     }, {})

//     return {
//       ...assuranceLevelMapping,
//       ...mapping
//     }
// }, {});

export default {
  'iam-aprofiel-userpass': 'low',
  'fas-citizen-bmid': 'substantial',
  'fas-citizen-otp': 'substantial',
  'fas-citizen-totp': 'substantial',
  'fas-citizen-eid': 'high',
  'fas-enterprise-bmid': 'substantial',
  'fas-enterprise-otp': 'substantial',
  'fas-enterprise-totp': 'substantial',
  'fas-enterprise-eid': 'high',
  'fas-hintedlogin-bmid': 'substantial',
  'fas-hintedlogin-otp': 'substantial',
  'fas-hintedlogin-totp': 'substantial',
  'fas-hintedlogin-eid': 'high'
}
