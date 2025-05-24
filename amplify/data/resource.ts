import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== MAMY DATA MANAGEMENT SYSTEM =======================================
This schema defines the data structure for a service request management system
including business hours, form data, and reservation management.
========================================================================*/

const schema = a.schema({
  // Enums
  MamyDataCategory: a.enum(["INQUIRY", "PURCHASE_REQUEST"]),
  MamyDataStatus: a.enum([
    "NEW",
    "PENDING", 
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED"
  ]),
  ReservationStatus: a.enum([
    "NEW",
    "CONFIRMED",
    "PROCESSING",
    "UNDER_VALUATION",
    "VALUATION_COMPLETED",
    "PREPARING_PICKUP",
    "PICKING_UP",
    "PICKUP_COMPLETED",
    "PURCHASE_COMPLETED",
    "PURCHASE_FAILED",
    "COMPLETED",
    "CANCELLED"
  ]),
  // Business Date Management
  BusinessDate: a
    .model({
      date: a.string().required(), // YYYY-MM-DD 形式の文字列
      dayOfWeek: a.integer(),
      isHoliday: a.boolean(),
      specialDay: a.string(),
      memo: a.string(),
      delFlg: a.integer().default(0),
      businessHours: a.json(), // Array of BusinessHour objects
      unavailableHours: a.json(), // Array of UnavailableHour objects
      purchaseRequestHours: a.json(), // Array of PurchaseRequestHour objects
    })
    .identifier(['date']) // 'date' フィールドを主キーとして指定
    .authorization((allow) => [
      allow.groups(["admins", "staff"]).to(["create", "read", "update", "delete"]),
      allow.groups(["users"]).to(["read"]),
      allow.guest().to(["read"])
    ]),
  // Form Item Categories
  FormItemCategory: a
    .model({
      name: a.string().required(),
      sort: a.integer().required(),
      delFlg: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.groups(["admins", "staff"]).to(["create", "read", "update", "delete"]),
      allow.groups(["users"]).to(["read"]),
      allow.guest().to(["read"])
    ]),  // Main Data Model for Service Requests
  ServiceRequest: a
    .model({
      category: a.ref("MamyDataCategory"),
      status: a.ref("MamyDataStatus"),
      userId: a.id(),
      // Customer Information
      customerName: a.string(),
      customerNameKana: a.string(),
      customerEmail: a.string(),
      customerPhone: a.string(),
      reasonForUse: a.string(),
      
      // Address Information
      postalCode: a.string(),
      prefecture: a.string(),
      city: a.string(),
      streetNumber: a.string(),
      building: a.string(),
      housingType: a.string(),
      elevatorAvailable: a.boolean(),
      
      // Preferred Dates
      preferredDate1: a.string(),
      preferredDate2: a.string(), 
      preferredDate3: a.string(),
      preferredTime1: a.string(),
      preferredTime2: a.string(),
      preferredTime3: a.string(),
      otherNotes: a.string(),
      
      // Item List (JSON array)
      itemList: a.json(),
      
      // Reservation Information (JSON array)
      reservationInfo: a.json(),
    })
    .authorization((allow) => [
      allow.groups(["admins"]).to(["create", "read", "update", "delete"]),
      allow.groups(["staff"]).to(["read", "update", "delete"]),
      allow.groups(["users"]).to(["create"]),
      allow.owner().to(["read", "update", "delete"])
    ]),
  // Backup table for Service Requests
  ServiceRequestBackup: a
    .model({
      originalId: a.id().required(),
      category: a.ref("MamyDataCategory"),
      status: a.ref("MamyDataStatus"),
      userId: a.id(),
      // Customer Information
      customerName: a.string(),
      customerNameKana: a.string(),
      customerEmail: a.string(),
      customerPhone: a.string(),
      reasonForUse: a.string(),
      
      // Address Information
      postalCode: a.string(),
      prefecture: a.string(),
      city: a.string(),
      streetNumber: a.string(),
      building: a.string(),
      housingType: a.string(),
      elevatorAvailable: a.boolean(),
      
      // Preferred Dates
      preferredDate1: a.string(),
      preferredDate2: a.string(),
      preferredDate3: a.string(),
      preferredTime1: a.string(),
      preferredTime2: a.string(),
      preferredTime3: a.string(),
      otherNotes: a.string(),
      
      // Item List (JSON array)
      itemList: a.json(),
      
      // Reservation Information (JSON array)
      reservationInfo: a.json(),
      
      // Backup metadata
      backupReason: a.string(),
    })
    .authorization((allow) => [
      allow.groups(["admins"]).to(["create", "read", "update", "delete"]),
      allow.groups(["staff"]).to(["create", "read", "update", "delete"]),
      allow.groups(["users"]).to(["create"]),
      allow.owner().to(["read", "update", "delete"])
    ]),  // Contact Inquiry Model
  ContactInquiry: a
    .model({
      name: a.string().required(),
      email: a.string().required(),
      phone: a.string(),
      subject: a.string().required(),
      message: a.string().required(),
      status: a.enum(["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
      // userId: a.id(), // Optional: if you want to link inquiries to registered users
    })
    .authorization((allow) => [
      allow.groups(["admins", "staff"]).to(["create", "read", "update", "delete"]),
      allow.groups(["users"]).to(["create"]),
      allow.owner().to(["read", "update", "delete"]),
      allow.guest().to(["create"])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
