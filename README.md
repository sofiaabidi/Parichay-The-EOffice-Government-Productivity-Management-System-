# Government Productivity Management System  
**Made Under Smart India Hackathon – Ministry of JalShakti**

---

## 1. Overview

This repository contains the backend implementation of the Government Productivity Management System developed under the Smart India Hackathon for the Ministry of JalShakti. The system addresses structural productivity gaps within government offices at the organizational, team, and individual levels.

Government institutions often lack structured digital mechanisms to define measurable objectives, benchmark performance indicators, track execution progress, collect structured peer feedback, and compute quantifiable productivity scores. This backend system provides a centralized and analytics-driven framework that enables measurable governance and performance transparency.

The backend manages user accounts, projects, milestones, tasks, KPI tracking, peer feedback records, notifications, audit logs, sentiment analysis integration, and staff adequacy prediction. The system is designed to integrate with the Government e-Office ecosystem and support scalable deployment across departments.

---
 ## Project Structure


```
sih-with-some-backend/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   │   ├── Login/       # Login page
│   │   │   ├── HQEmployee/  # Employee dashboard
│   │   │   └── HQManager/   # Manager dashboard
│   │   ├── services/         # API service layer
│   │   └── main.tsx         # Entry point
│   └── package.json
│
└── gov-productivity-backend/ # Node.js backend
    ├── src/
    │   ├── app.js           # Express app setup
    │   ├── server.js        # Server entry point
    │   ├── config/          # Configuration files
    │   ├── controllers/     # Route controllers
    │   ├── services/         # Business logic
    │   ├── routes/          # API routes
    │   ├── middleware/      # Express middleware
    │   ├── models/          # Data models
    │   ├── database/        # Migrations & seeds
    │   └── utils/           # Utility functions
    └── package.json
```


## 2. System Objective

The primary objective of this system is to operationalize measurable productivity management in government organizations by enabling:

- Structured goal and KPI definition  
- Hierarchical productivity monitoring (organization, team, individual)  
- Quantitative benchmarking across departments  
- Peer feedback collection and sentiment-based engagement analysis  
- Workforce adequacy prediction  
- Financial efficiency tracking  
- Transparent audit logging  

This repository focuses exclusively on backend services and database management.

---

## 3. Architecture

The system follows a modular backend architecture implemented using Node.js with a PostgreSQL relational database and an external machine learning service layer.

### 3.1 Architectural Layers

The backend consists of the following layers:

**API Layer**  
Handles routing, request validation, and response formatting.

**Controller Layer**  
Implements business logic for productivity evaluation, KPI management, task lifecycle control, and feedback processing.

**Service Layer**  
Contains integrations such as sentiment analysis and staff adequacy prediction services.

**Middleware Layer**  
Provides centralized error handling and logging mechanisms.

**Database Layer**  
Uses PostgreSQL to store structured productivity, task, KPI, user, and feedback data.

**Machine Learning Integration Layer**  
Communicates with external services for sentiment prediction and workforce adequacy modeling.

### 3.2 Service Communication

The backend communicates with machine learning services using HTTP requests. Before invoking prediction endpoints, the backend verifies service availability to ensure graceful failure handling in case of downtime.

---

## 4. Technology Stack

Backend Runtime:
- Node.js

Framework:
- Express.js

Database:
- PostgreSQL

Inter-Service Communication:
- Axios

Middleware:
- Centralized error handling
- Logging utilities

Machine Learning Integration:
- Sentiment Analysis Service
- Staff Adequacy Prediction Model

---

## 5. Database Structure

The system uses PostgreSQL as a relational database for structured productivity management.

### 5.1 Users Table

Stores employee and managerial information, including role definitions. Enables hierarchical productivity tracking and role-based access control.

### 5.2 Projects Table

Represents organizational initiatives. Projects act as containers for milestones and tasks.

### 5.3 Tasks Table

Stores operational task-level data including:

- Task name  
- Task description  
- Assigned user  
- Associated project  
- Status (pending, in-progress, awaiting-review, completed)  
- Scheduled start date  
- Deadline  
- Budget allocation  
- Cost incurred  

This table forms the operational backbone of productivity measurement.

### 5.4 KPI Data Points

Represents timestamped productivity metrics including:

- Average KPI score (0–100 scale)  
- Field-level average KPI score  
- Timestamp  

These records enable trend analysis and benchmarking across departments.

### 5.5 Peer Feedback Table

Stores structured textual feedback submitted by employees and managers. Feedback entries are processed through the sentiment analysis service to evaluate engagement trends.

### 5.6 Notifications Table

Manages system-generated notifications and internal alerts.

### 5.7 Audit Logs

Tracks user activity and system events to ensure governance transparency and accountability.

---

## 6. Functional Modules

### 6.1 Project and Task Management

The system enables structured creation and management of projects and tasks. Tasks can be assigned to individual users and tracked across lifecycle stages. Deadline adherence and status transitions contribute to productivity measurement.

Financial attributes such as budget and cost are recorded to support efficiency analysis.

---

### 6.2 KPI Tracking System

The KPI module enables quantifiable performance measurement. KPI scores are normalized on a 0–100 scale and stored as structured data points.

Aggregation at team and organizational levels enables benchmarking and comparative performance evaluation.

---

### 6.3 Peer Feedback and Sentiment Analysis

The backend supports structured peer feedback submission. Feedback text is processed through an integrated sentiment analysis service.

The sentiment service provides:

- Sentiment classification  
- Service availability verification  
- Structured prediction responses  

This module enables morale trend analysis and early detection of engagement risks.

---

### 6.4 Staff Adequacy Prediction

The system includes a predictive analytics module for workforce evaluation.

The Staff Adequacy Input Model includes:

- Team utilization rate (0–1 scale)  
- Output-to-manpower ratio  
- Cost-to-output ratio  
- Current team size  

Based on these parameters, the model evaluates workforce adequacy and identifies whether teams are understaffed, adequately staffed, or overstaffed.

---

### 6.5 Budget and Cost Monitoring

Budget allocation and actual cost tracking at task and project levels enable financial productivity assessment in addition to operational measurement.

---

### 6.6 Error Handling and Logging

A centralized error handling middleware ensures:

- Consistent error response formatting  
- Server-side logging  
- Graceful exception management  

This enhances reliability and maintainability.

---

## 7. API Overview

The backend exposes RESTful endpoints for:

- User management  
- Project creation and retrieval  
- Task assignment and updates  
- KPI submission and retrieval  
- Peer feedback submission  
- Sentiment analysis processing  
- Staff adequacy prediction  
- Notification management  
- Audit log retrieval  

All endpoints return structured JSON responses.

---

## 8. Installation and Setup

### 8.1 Prerequisites

- Node.js (v16 or higher recommended)  
- npm package manager  
- PostgreSQL database instance  
- Running machine learning service (required for analytics features)

### 8.2 Installation Steps

Clone the repository:
git clone <url>
cd gov-productivity-backend


- Install dependencies:

npm install

- Create a `.env` file in the project root:

PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=gov_productivity
ML_SERVICE_URL=http://localhost:8000

- Initialize the PostgreSQL database using the provided seed scripts located in the database seeds directory.

Start the server:

npm start


The API server will run on the configured port.

---

## 9. Design Considerations

The backend is designed with modularity and extensibility in mind. Separation between API handling, business logic, and machine learning services allows independent scaling and future enhancement.

The architecture supports future expansion including advanced predictive analytics, department-level benchmarking dashboards, automated performance reporting, and deeper integration with government digital infrastructure.

---

## 10. Governance Impact

This system transforms productivity evaluation in government offices from subjective and manual assessment processes to structured, data-driven performance analytics.

It introduces measurable KPIs, predictive workforce modeling, sentiment-informed engagement insights, and financial efficiency tracking within a unified backend system.

---

## 11. Running of AI Models

The Government Productivity Management System integrates external Artificial Intelligence services for sentiment analysis and workforce adequacy prediction. These services operate independently from the main Node.js backend and communicate via HTTP APIs.

The AI models are deployed as a separate service, typically running on a local server (e.g., http://localhost:8000) or on a dedicated analytics server.

### 11.1 Sentiment Analysis Model

The sentiment analysis model processes textual peer feedback and classifies it into sentiment categories such as positive, neutral, or negative.

Workflow:

1. A user submits peer feedback through the backend API.
2. The backend sends the feedback text to the AI service endpoint.
3. The AI model processes the text and returns a structured sentiment response.
4. The backend stores the sentiment result alongside the feedback record.

The backend verifies service availability before making prediction calls to ensure graceful failure handling.

If the AI service is unavailable:
- The system logs the error.
- Feedback is stored without sentiment classification.
- No application crash occurs.

### 11.2 Staff Adequacy Prediction Model

The staff adequacy model evaluates workforce efficiency using structured numerical inputs:

- Team utilization rate (0–1 scale)
- Output-to-manpower ratio
- Cost-to-output ratio
- Current team size

Workflow:

1. The backend receives adequacy parameters via API.
2. The parameters are forwarded to the AI service.
3. The model computes adequacy status.
4. The response indicates whether the team is:
   - Understaffed
   - Adequately staffed
   - Overstaffed

The result is returned as structured JSON and can be used for decision-making analytics.

### 11.3 Starting the AI Service

Before running the backend server, ensure the AI service is active.

Example:


cd models
python app.py


The AI service must be accessible at the URL defined in the `.env` file:


ML_SERVICE_URL=http://localhost:8000


The backend checks service availability before invoking prediction endpoints.

## 👥 Team

We are grateful for the contributions of the following team members:

| Name | Role | GitHub Profile |
|------|------|----------------|
| **Ankita Sagar** | Database & Integration | [GitHub](https://github.com/Sagarankita) |
| **Anushree Upasham** | AI/ML Developer | [GitHub](https://github.com/annuuxoxo) |
| **Akshi Takle** | Full Stack Developer | [GitHub](https://github.com/Akshii17) |
| **Shreya Mane** | Frontend Developer | [GitHub](https://github.com/shreyamane1526) |
| **Sakshi Kalunge** | Frontend Developer | [GitHub](https://github.com/SakshiKalunge07) |
| **Sofia Abidi** | Backend Developer | [GitHub](https://github.com/sofiaabidi) |

---

## 📖 Documentation Credit

All project documentation, structuring, and formatting has been led by **Ankita Sagar**.
Credit of Documentation: Ankita Sagar ❤️
