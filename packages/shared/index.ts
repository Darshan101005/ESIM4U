// Shared types and utilities for eSIM4U

// User related types
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

// eSIM related types
export interface eSIMPlan {
  id: string
  name: string
  country: string
  dataLimit: string
  price: number
  currency: string
  validity: number // days
}

// Constants
export const APP_NAME = 'eSIM4U'
export const APP_VERSION = '1.0.0'
