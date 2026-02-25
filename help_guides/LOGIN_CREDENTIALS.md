# Login Credentials Reference

This document contains all login credentials for the Gov Productivity Backend system, organized by user role.

## Table of Contents
- [Admin](#admin)
- [HQ Manager](#hq-manager)
- [HQ Employee](#hq-employee)
- [Field Manager](#field-manager)
- [Field Employee](#field-employee)
- [HQ Organization](#hq-organization)
- [Field Organization](#field-organization)

---

## Admin

| User ID | Name | Email | Password | Department | Designation |
|---------|------|-------|----------|------------|-------------|
| 1 | System Admin | `admin@bb.gov.in` | `Admin@123` | Brahmaputra Board | Chief Administrator |

**Login Endpoint:** `POST /api/auth/login`

---

## HQ Manager

| User ID | Name | Email | Password | Department | Designation |
|---------|------|-------|----------|------------|-------------|
| 2 | Rajesh Kumar | `
` | `Manager@123` | Flood Management | Executive Engineer |
| 5 | Suresh Das | `
 | `Manager@123` | River Bank Erosion Control | Superintending Engineer |
| 30 | Anil Kapoor | `anil@bb.gov.in` | `Manager@123` | Hydrology & Survey | Executive Engineer |

**Login Endpoint:** `POST /api/auth/login`

---

## HQ Employee

| User ID | Name | Email | Password | Department | Designation |
|---------|------|-------|----------|------------|-------------|
| 3 | Priya Sharma | `priya@bb.gov.in` | `Employee@123` | Flood Management | Junior Engineer |
| 4 | Amit Verma | `amit@bb.gov.in` | `Employee@123` | Flood Management | Technical Assistant |
| 6 | Neha Patel | `neha@bb.gov.in` | `Employee@123` | River Bank Erosion Control | Junior Engineer |
| 7 | Kiran Reddy | `kiran@bb.gov.in` | `Employee@123` | River Bank Erosion Control | Surveyor |
| 8 | Deepak Singh | `deepak@bb.gov.in` | `Employee@123` | Flood Management | Technical Assistant |
| 31 | Ritu Sharma | `ritu@bb.gov.in` | `Employee@123` | Hydrology & Survey | Junior Engineer |
| 32 | Naveen Kumar | `naveen@bb.gov.in` | `Employee@123` | Hydrology & Survey | Surveyor |
| 33 | Kavita Singh | `kavita.singh@bb.gov.in` | `Employee@123` | Hydrology & Survey | Technical Assistant |
| 34 | Rahul Verma | `rahul@bb.gov.in` | `Employee@123` | Flood Management | Junior Engineer |
| 35 | Sonia Patel | `sonia@bb.gov.in` | `Employee@123` | Flood Management | Technical Assistant |

**Login Endpoint:** `POST /api/auth/login`

---

## Field Manager

| User ID | Name | Email | Password | Department | Designation |
|---------|------|-------|----------|------------|-------------|
| 9 | Vikram Mehta | `vikram@bb.gov.in` | `FieldManager@123` | Field Operations - Assam | Field Manager |
| 14 | Rajesh Singh | `rajesh.singh@bb.gov.in` | `FieldManager@123` | Field Operations - Arunachal Pradesh | Field Manager |
| 22 | Amitabh Das | `amitabh@bb.gov.in` | `FieldManager@123` | Field Operations - Meghalaya | Field Manager |
| 26 | Sanjay Verma | `sanjay@bb.gov.in` | `FieldManager@123` | Field Operations - Manipur | Field Manager |

**Login Endpoint:** `POST /api/field/auth/manager/login`

**Note:** Field Managers can only see employees from their own department.

---

## Field Employee

### Department 1: Field Operations - Assam

| User ID | Name | Email | Password | Designation |
|---------|------|-------|----------|-------------|
| 10 | Arjun Sharma | `arjun@bb.gov.in` | `FieldEmployee@123` | Junior Engineer |
| 11 | Priya Das | `priya.das@bb.gov.in` | `FieldEmployee@123` | Surveyor |
| 12 | Amit Kumar | `amit.kumar@bb.gov.in` | `FieldEmployee@123` | Site Supervisor |
| 13 | Sneha Reddy | `sneha@bb.gov.in` | `FieldEmployee@123` | Project Coordinator |
| 18 | Ravi Kumar | `ravi@bb.gov.in` | `FieldEmployee@123` | Junior Engineer |
| 19 | Sunita Devi | `sunita@bb.gov.in` | `FieldEmployee@123` | Surveyor |
| 20 | Manoj Singh | `manoj@bb.gov.in` | `FieldEmployee@123` | Site Supervisor |
| 21 | Anjali Sharma | `anjali@bb.gov.in` | `FieldEmployee@123` | Project Coordinator |

### Department 2: Field Operations - Arunachal Pradesh

| User ID | Name | Email | Password | Designation |
|---------|------|-------|----------|-------------|
| 15 | Neha Verma | `neha.verma@bb.gov.in` | `FieldEmployee@123` | Junior Engineer |
| 16 | Rohit Desai | `rohit@bb.gov.in` | `FieldEmployee@123` | Surveyor |
| 17 | Kavita Nair | `kavita@bb.gov.in` | `FieldEmployee@123` | Site Supervisor |

### Department 3: Field Operations - Meghalaya

| User ID | Name | Email | Password | Designation |
|---------|------|-------|----------|-------------|
| 23 | Pankaj Mehta | `pankaj@bb.gov.in` | `FieldEmployee@123` | Junior Engineer |
| 24 | Rekha Patel | `rekha@bb.gov.in` | `FieldEmployee@123` | Surveyor |
| 25 | Vikash Kumar | `vikash@bb.gov.in` | `FieldEmployee@123` | Site Supervisor |

### Department 4: Field Operations - Manipur

| User ID | Name | Email | Password | Designation |
|---------|------|-------|----------|-------------|
| 27 | Meera Nair | `meera.nair@bb.gov.in` | `FieldEmployee@123` | Junior Engineer |
| 28 | Rajesh Iyer | `rajesh.iyer@bb.gov.in` | `FieldEmployee@123` | Surveyor |
| 29 | Suresh Reddy | `suresh.reddy@bb.gov.in` | `FieldEmployee@123` | Site Supervisor |

**Login Endpoint:** `POST /api/field/auth/employee/login`

---

## HQ Organization

| User ID | Name | Email | Password | Department | Designation |
|---------|------|-------|----------|------------|-------------|
| 998 | HQ Organization Admin | `hq@bb.gov.in` | `HQOrg@123` | Brahmaputra Board | Organization Administrator |
| 997 | Priya Sharma | `priya.hq@bb.gov.in` | `Priya@HQ123` | Brahmaputra Board | Senior Organization Administrator |
| 996 | Arjun Patel | `arjun.hq@bb.gov.in` | `Arjun@HQ123` | Brahmaputra Board | Organization Administrator |

**Login Endpoint:** `POST /api/auth/login`

**Dashboard Route:** `/hq-org`

---

## Field Organization

| User ID | Name | Email | Password | Department | Designation |
|---------|------|-------|----------|------------|-------------|
| 999 | Field Organization Admin | `field@bb.gov.in` | `FieldOrg@123` | Field Operations | Organization Administrator |
| 995 | Field Organization Manager | `field.mgr@bb.gov.in` | `FieldOrgMgr@123` | Field Operations | Organization Manager |

**Login Endpoint:** `POST /api/auth/login`

**Dashboard Route:** `/field-org`



