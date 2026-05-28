/**
 * Application types (JSDoc for reference)
 * 
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {'admin'|'clinician'|'receptionist'} role
 * @property {string} fullName
 * @property {string} createdAt
 *
 * @typedef {Object} Doctor
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} specialization
 * @property {string} department
 * @property {string} email
 * @property {string} phone
 * @property {string} licenseNumber
 * @property {'active'|'inactive'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Patient
 * @property {string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} dateOfBirth
 * @property {'male'|'female'|'other'} gender
 * @property {string} bloodType
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 * @property {string} emergencyContact
 * @property {string} emergencyPhone
 * @property {string} doctorId
 * @property {'active'|'inactive'} status
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Illness
 * @property {string} id
 * @property {string} patientId
 * @property {string} icdCode
 * @property {string} description
 * @property {'mild'|'moderate'|'severe'|'critical'} severity
 * @property {string} diagnosisDate
 * @property {'active'|'resolved'|'chronic'} status
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} AuditLog
 * @property {string} id
 * @property {string} userId
 * @property {string} action
 * @property {string} entity
 * @property {string} entityId
 * @property {string} timestamp
 * @property {string} details
 * @property {string} [userFullName]
 */

export {};
